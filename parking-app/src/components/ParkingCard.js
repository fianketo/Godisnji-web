import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { formatTime, formatDuration } from "../utils/format";

const DURATION_OPTIONS = [
  { label: "30 min", minutes: 30 },
  { label: "1h", minutes: 60 },
  { label: "2h", minutes: 120 },
  { label: "Ceo dan", minutes: 24 * 60, daily: true },
];

export default function ParkingCard({ session, onSelectDuration, onPaySms }) {
  const hasZone = Boolean(session.zone_name);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{session.street || "Ulica nije prepoznata"}</Text>
      <Text style={styles.subtitle}>
        {hasZone ? session.zone_name : "Zona nije mapirana u ovoj MVP verziji"}
      </Text>
      {hasZone && <Text style={styles.price}>{session.price_per_hour} RSD / h</Text>}
      <Text style={styles.meta}>
        Parkirano u {formatTime(session.started_at)} · traje {formatDuration(session.started_at)}
      </Text>

      {session.planned_until && (
        <Text style={styles.meta}>
          Plaćeno do {formatTime(session.planned_until)}
        </Text>
      )}

      <Text style={styles.sectionLabel}>Trajanje parkiranja</Text>
      <View style={styles.durationRow}>
        {DURATION_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.label}
            style={styles.durationChip}
            onPress={() => onSelectDuration(opt)}
          >
            <Text style={styles.durationText}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.payButton, !hasZone && styles.payButtonDisabled]}
        disabled={!hasZone}
        onPress={onPaySms}
      >
        <Text style={styles.payButtonText}>Plati SMS-om</Text>
      </TouchableOpacity>
      {session.paid ? <Text style={styles.paidBadge}>✓ SMS poslat</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#12213a",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "700" },
  subtitle: { color: "#9fb3d1", fontSize: 14, marginTop: 4 },
  price: { color: "#5ad1a0", fontSize: 16, fontWeight: "600", marginTop: 8 },
  meta: { color: "#9fb3d1", fontSize: 13, marginTop: 8 },
  sectionLabel: { color: "#fff", fontSize: 13, marginTop: 16, marginBottom: 8 },
  durationRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  durationChip: {
    backgroundColor: "#1f345a",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  durationText: { color: "#fff", fontSize: 13 },
  payButton: {
    backgroundColor: "#1f6feb",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  payButtonDisabled: { backgroundColor: "#33415c" },
  payButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  paidBadge: { color: "#5ad1a0", marginTop: 10, textAlign: "center" },
});
