import * as Notifications from "expo-notifications";
import { REMINDER_MINUTES_BEFORE_EXPIRY } from "../constants/config";

export const PARKED_CATEGORY = "parking-detected";
export const PAY_SMS_ACTION = "PAY_SMS";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions() {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}

export async function registerNotificationCategories() {
  await Notifications.setNotificationCategoryAsync(PARKED_CATEGORY, [
    {
      identifier: PAY_SMS_ACTION,
      buttonTitle: "Plati SMS-om",
      options: { opensAppToForeground: true },
    },
  ]);
}

export async function notifyParked({ street, zoneName, pricePerHour, sessionId }) {
  return Notifications.scheduleNotificationAsync({
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
}

export async function scheduleExpiryReminder({ sessionId, plannedUntil, street, zoneName }) {
  const triggerDate = new Date(plannedUntil - REMINDER_MINUTES_BEFORE_EXPIRY * 60 * 1000);
  if (triggerDate.getTime() <= Date.now()) {
    return null;
  }
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Parking uskoro ističe",
      body: `Plaćeno vreme za ${street || "trenutnu lokaciju"} (${zoneName || ""}) ističe za ${REMINDER_MINUTES_BEFORE_EXPIRY} minuta.`,
      data: { sessionId },
    },
    trigger: { date: triggerDate },
  });
  return id;
}

export async function cancelScheduledNotification(notificationId) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (e) {
    // notification may already have fired; safe to ignore
  }
}
