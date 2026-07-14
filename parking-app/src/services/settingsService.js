import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants/config";

export async function getVehiclePlate() {
  return AsyncStorage.getItem(STORAGE_KEYS.VEHICLE_PLATE);
}

export async function setVehiclePlate(plate) {
  return AsyncStorage.setItem(STORAGE_KEYS.VEHICLE_PLATE, plate.trim().toUpperCase());
}

export async function isTrackingEnabled() {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.TRACKING_ENABLED);
  return value === "true";
}

export async function setTrackingEnabled(enabled) {
  return AsyncStorage.setItem(STORAGE_KEYS.TRACKING_ENABLED, enabled ? "true" : "false");
}
