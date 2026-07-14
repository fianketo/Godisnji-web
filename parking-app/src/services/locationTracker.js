import { Platform } from "react-native";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  LOCATION_TASK_NAME,
  PARK_DETECT_MINUTES,
  STOPPED_SPEED_MS,
  MOVING_SPEED_MS,
  STORAGE_KEYS,
} from "../constants/config";
import { reverseGeocode } from "./geocodingService";
import { matchZone } from "./zoneMatcher";
import { createSession, closeSession, getActiveSession } from "./historyService";
import { notifyParked } from "./notificationService";

// Must be defined at module scope so it survives app restarts / headless JS.
// expo-task-manager has no web implementation, so this only runs on native.
if (Platform.OS !== "web") {
  TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
      console.warn("Location task error:", error.message);
      return;
    }
    const { locations } = data || {};
    if (!locations || locations.length === 0) return;

    const location = locations[locations.length - 1];
    await handleLocationUpdate(location);
  });
}

async function readMotionState() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.MOTION_STATE);
  if (!raw) return { status: "moving", stationarySince: null };
  try {
    return JSON.parse(raw);
  } catch {
    return { status: "moving", stationarySince: null };
  }
}

async function writeMotionState(state) {
  await AsyncStorage.setItem(STORAGE_KEYS.MOTION_STATE, JSON.stringify(state));
}

async function handleLocationUpdate(location) {
  const { coords, timestamp } = location;
  const speed = typeof coords.speed === "number" && coords.speed >= 0 ? coords.speed : 0;
  const state = await readMotionState();

  if (speed <= STOPPED_SPEED_MS) {
    if (!state.stationarySince) {
      await writeMotionState({ status: state.status, stationarySince: timestamp });
      return;
    }

    const stationaryMinutes = (timestamp - state.stationarySince) / 60000;
    if (state.status !== "parked" && stationaryMinutes >= PARK_DETECT_MINUTES) {
      await markAsParked(coords, timestamp);
      await writeMotionState({ status: "parked", stationarySince: state.stationarySince });
    }
    return;
  }

  if (speed >= MOVING_SPEED_MS) {
    if (state.status === "parked") {
      await markAsLeft(timestamp);
    }
    await writeMotionState({ status: "moving", stationarySince: null });
  }
}

async function markAsParked(coords, timestamp) {
  let street = null;
  let zone = null;
  try {
    const address = await reverseGeocode(coords.latitude, coords.longitude);
    street = address.street;
    zone = matchZone(street);
  } catch (e) {
    console.warn("Reverse geocoding nije uspeo:", e.message);
  }

  const sessionId = await createSession({
    latitude: coords.latitude,
    longitude: coords.longitude,
    street,
    zoneId: zone?.id,
    zoneName: zone?.name,
    pricePerHour: zone?.pricePerHour,
    smsNumber: zone?.smsNumber,
    startedAt: timestamp,
  });

  await notifyParked({
    street,
    zoneName: zone?.name || "Nepoznata zona",
    pricePerHour: zone?.pricePerHour,
    sessionId,
  });
}

async function markAsLeft(timestamp) {
  const active = await getActiveSession();
  if (active) {
    await closeSession(active.id, timestamp);
  }
}

export async function requestLocationPermissions() {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== "granted") {
    return { granted: false, background: false };
  }
  if (Platform.OS === "web") {
    return { granted: true, background: false };
  }
  const background = await Location.requestBackgroundPermissionsAsync();
  return { granted: true, background: background.status === "granted" };
}

export async function startTracking() {
  // Background location tasks are Android/iOS-only (no web implementation).
  if (Platform.OS === "web") return;

  const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (hasStarted) return;

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 30000,
    distanceInterval: 25,
    pausesUpdatesAutomatically: false,
    foregroundService: {
      notificationTitle: "Parking NS prati lokaciju",
      notificationBody: "Detektujem kada parkiraš, u pozadini, uz minimalnu potrošnju baterije.",
    },
  });
}

export async function stopTracking() {
  if (Platform.OS === "web") return;

  const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (hasStarted) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
}
