import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TextInput, Switch, StyleSheet, ScrollView, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import ParkingCard from "../components/ParkingCard";
import { getActiveSession, setPlannedUntil, markPaid } from "../services/historyService";
import {
  getVehiclePlate,
  setVehiclePlate,
  isTrackingEnabled,
  setTrackingEnabled,
} from "../services/settingsService";
import { requestLocationPermissions, startTracking, stopTracking } from "../services/locationTracker";
import {
  requestNotificationPermissions,
  registerNotificationCategories,
  scheduleExpiryReminder,
  cancelScheduledNotification,
} from "../services/notificationService";
import { payZoneBySms } from "../services/smsService";
import { getAllZones } from "../services/zoneMatcher";

export default function HomeScreen() {
  const [plate, setPlate] = useState("");
  const [trackingOn, setTrackingOn] = useState(false);
  const [session, setSession] = useState(null);

  const refresh = useCallback(async () => {
    const [p, tracking, active] = await Promise.all([
      getVehiclePlate(),
      isTrackingEnabled(),
      getActiveSession(),
    ]);
    setPlate(p || "");
    setTrackingOn(tracking);
    setSession(active || null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
      const interval = setInterval(refresh, 5000);
      return () => clearInterval(interval);
    }, [refresh])
  );

  useEffect(() => {
    registerNotificationCategories();
    requestNotificationPermissions();
  }, []);

  async function onToggleTracking(value) {
    if (value) {
      Alert.alert(
        "Praćenje lokacije",
        "Parking NS koristi tvoju lokaciju da prepozna kada parkiraš vozilo, i mora da radi i kada je aplikacija u pozadini. Na sledećem ekranu izaberi \"Dozvoli uvek\" / \"Allow all the time\".",
        [
          { text: "Otkaži", style: "cancel" },
          {
            text: "Nastavi",
            onPress: async () => {
              const { granted, background } = await requestLocationPermissions();
              if (!granted) {
                Alert.alert("Dozvola odbijena", "Bez dozvole za lokaciju aplikacija ne može da detektuje parkiranje.");
                return;
              }
              if (!background) {
                Alert.alert(
                  "Napomena",
                  "Bez pozadinske dozvole detekcija radi samo dok je aplikacija otvorena."
                );
              }
              await startTracking();
              await setTrackingEnabled(true);
              setTrackingOn(true);
            },
          },
        ]
      );
    } else {
      await stopTracking();
      await setTrackingEnabled(false);
      setTrackingOn(false);
    }
  }

  async function onSavePlate(value) {
    setPlate(value);
    await setVehiclePlate(value);
  }

  async function onSelectDuration(option) {
    if (!session) return;
    const plannedUntil = Date.now() + option.minutes * 60000;
    if (session.reminder_notification_id) {
      await cancelScheduledNotification(session.reminder_notification_id);
    }
    const reminderId = await scheduleExpiryReminder({
      sessionId: session.id,
      plannedUntil,
      street: session.street,
      zoneName: session.zone_name,
    });
    await setPlannedUntil(session.id, plannedUntil, reminderId);
    refresh();
  }

  async function onPaySms() {
    if (!session) return;
    const zone = getAllZones().find((z) => z.id === session.zone_id);
    try {
      await payZoneBySms(zone, {});
      await markPaid(session.id, Date.now());
      refresh();
    } catch (e) {
      Alert.alert("Greška", e.message);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Parking NS</Text>
        <Text style={styles.headerSubtitle}>Automatska prijava parkiranja — Novi Sad</Text>
      </View>

      <View style={styles.settingsBox}>
        <Text style={styles.label}>Registarska oznaka vozila</Text>
        <TextInput
          value={plate}
          onChangeText={onSavePlate}
          placeholder="NS-000-AA"
          placeholderTextColor="#6b7d9c"
          autoCapitalize="characters"
          style={styles.input}
        />

        <View style={styles.trackingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Automatska detekcija parkiranja</Text>
            <Text style={styles.hint}>
              Prati brzinu kretanja u pozadini; kad stane {">"}~3 min, prepoznaje parking.
            </Text>
          </View>
          <Switch value={trackingOn} onValueChange={onToggleTracking} />
        </View>
      </View>

      {session ? (
        <ParkingCard session={session} onSelectDuration={onSelectDuration} onPaySms={onPaySms} />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Trenutno nisi parkiran</Text>
          <Text style={styles.emptyHint}>
            {trackingOn
              ? "Pratimo tvoju lokaciju u pozadini. Čim staneš na jednom mestu duže od par minuta, javićemo ti."
              : "Uključi praćenje iznad da bi aplikacija mogla automatski da prepozna parkiranje."}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1626" },
  header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },
  headerTitle: { color: "#fff", fontSize: 26, fontWeight: "800" },
  headerSubtitle: { color: "#9fb3d1", fontSize: 14, marginTop: 4 },
  settingsBox: {
    backgroundColor: "#12213a",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
  },
  label: { color: "#fff", fontSize: 14, fontWeight: "600" },
  hint: { color: "#6b7d9c", fontSize: 12, marginTop: 2 },
  input: {
    backgroundColor: "#0b1626",
    color: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 8,
    marginBottom: 16,
  },
  trackingRow: { flexDirection: "row", alignItems: "center" },
  emptyState: { padding: 32, alignItems: "center", marginTop: 16 },
  emptyTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  emptyHint: { color: "#9fb3d1", fontSize: 14, textAlign: "center", marginTop: 8 },
});
