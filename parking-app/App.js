import "react-native-gesture-handler";
import React, { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import AppNavigator from "./src/navigation/AppNavigator";
import "./src/services/locationTracker";
import { PAY_SMS_ACTION } from "./src/services/notificationService";
import { getSessionById, markPaid } from "./src/services/historyService";
import { getAllZones } from "./src/services/zoneMatcher";
import { payZoneBySms } from "./src/services/smsService";

export default function App() {
  const responseListener = useRef();

  useEffect(() => {
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const sessionId = response.notification.request.content.data?.sessionId;
        if (!sessionId) return;

        if (response.actionIdentifier === PAY_SMS_ACTION) {
          const session = await getSessionById(sessionId);
          if (!session) return;
          const zone = getAllZones().find((z) => z.id === session.zone_id);
          try {
            await payZoneBySms(zone, {});
            await markPaid(session.id, Date.now());
          } catch (e) {
            console.warn("SMS plaćanje iz notifikacije nije uspelo:", e.message);
          }
        }
      }
    );

    return () => responseListener.current?.remove();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}
