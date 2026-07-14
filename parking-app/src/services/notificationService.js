import * as Notifications from "expo-notifications";
import { REMINDER_MINUTES_BEFORE_EXPIRY } from "../constants/config";

export const PARKED_CATEGORY = "parking-detected";
export const PAY_SMS_ACTION = "PAY_SMS";

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (e) {
  // not supported on this platform (e.g. browser preview without HTTPS)
}

export async function requestNotificationPermissions() {
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted) return true;
    const result = await Notifications.requestPermissionsAsync();
    return result.granted;
  } catch (e) {
    return false;
  }
}

export async function registerNotificationCategories() {
  try {
    await Notifications.setNotificationCategoryAsync(PARKED_CATEGORY, [
      {
        identifier: PAY_SMS_ACTION,
        buttonTitle: "Plati SMS-om",
        options: { opensAppToForeground: true },
      },
    ]);
  } catch (e) {
    // categories with action buttons aren't supported on every platform
  }
}

export async function notifyParked({ street, zoneName, pricePerHour, sessionId }) {
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "Izgleda da si parkirao 🅿️",
        body: street
          ? `${street} — ${zoneName}${pricePerHour ? `. Cena: ${pricePerHour} RSD/h.` : "."}`
          : `Ulica nije prepoznata, ali si stao na jednom mestu. Proveri zonu ručno.`,
        data: { sessionId },
        categoryIdentifier: PARKED_CATEGORY,
      },
      trigger: null,
    });
  } catch (e) {
    console.warn("Notifikacija nije poslata:", e.message);
    return null;
  }
}

export async function scheduleExpiryReminder({ sessionId, plannedUntil, street, zoneName }) {
  const triggerDate = new Date(plannedUntil - REMINDER_MINUTES_BEFORE_EXPIRY * 60 * 1000);
  if (triggerDate.getTime() <= Date.now()) {
    return null;
  }
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "Parking uskoro ističe",
        body: `Plaćeno vreme za ${street || "trenutnu lokaciju"} (${zoneName || ""}) ističe za ${REMINDER_MINUTES_BEFORE_EXPIRY} minuta.`,
        data: { sessionId },
      },
      trigger: { date: triggerDate },
    });
  } catch (e) {
    console.warn("Podsetnik nije zakazan:", e.message);
    return null;
  }
}

export async function cancelScheduledNotification(notificationId) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (e) {
    // notification may already have fired; safe to ignore
  }
}
