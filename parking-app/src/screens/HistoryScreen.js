import React, { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getHistory } from "../services/historyService";
import { formatDateTime, formatDuration } from "../utils/format";

function HistoryRow({ item }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.street}>{item.street || "Nepoznata ulica"}</Text>
        <Text style={styles.zone}>{item.zone_name || "Zona nije mapirana"}</Text>
        <Text style={styles.meta}>
          {formatDateTime(item.started_at)} · {formatDuration(item.started_at, item.ended_at)}
        </Text>
      </View>
      <View style={styles.badgeWrap}>
        {item.price_per_hour ? <Text style={styles.price}>{item.price_per_hour} RSD/h</Text> : null}
        <Text style={item.paid ? styles.paidBadge : styles.unpaidBadge}>
          {item.paid ? "Plaćeno" : "Nije plaćeno"}
        </Text>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const [sessions, setSessions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const rows = await getHistory();
    setSessions(rows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Istorija parkiranja</Text>
      <FlatList
        data={sessions}
        keyExtractor={(item) => String(item.id)}
        renderItem={HistoryRow}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.empty}>Još uvek nema sačuvanih parkiranja.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1626", paddingTop: 24 },
  title: { color: "#fff", fontSize: 22, fontWeight: "800", paddingHorizontal: 20, marginBottom: 12 },
  row: {
    flexDirection: "row",
    backgroundColor: "#12213a",
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  street: { color: "#fff", fontSize: 16, fontWeight: "700" },
  zone: { color: "#9fb3d1", fontSize: 13, marginTop: 2 },
  meta: { color: "#6b7d9c", fontSize: 12, marginTop: 6 },
  badgeWrap: { alignItems: "flex-end", justifyContent: "center" },
  price: { color: "#5ad1a0", fontSize: 13, fontWeight: "600" },
  paidBadge: { color: "#5ad1a0", fontSize: 12, marginTop: 4 },
  unpaidBadge: { color: "#e0a83c", fontSize: 12, marginTop: 4 },
  empty: { color: "#6b7d9c", textAlign: "center", marginTop: 40 },
});
