import { Linking } from "react-native";
import { getVehiclePlate } from "./settingsService";

/**
 * Opens the native SMS app with the zone's payment number and the user's
 * vehicle plate pre-filled as the message body. The user still has to press
 * send themselves — no SEND_SMS permission or payment gateway is needed.
 */
export async function payZoneBySms(zone, { daily = false } = {}) {
  if (!zone) {
    throw new Error("Nepoznata zona — ne mogu da odredim broj za SMS plaćanje.");
  }
  const plate = (await getVehiclePlate()) || "";
  const number = daily && zone.smsDailyNumber ? zone.smsDailyNumber : zone.smsNumber;
  const body = encodeURIComponent(plate);
  const url = `sms:${number}?body=${body}`;
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    throw new Error("Uređaj ne može da otvori SMS aplikaciju.");
  }
  await Linking.openURL(url);
}
