import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';
import { financingService } from '../../services/financeService';

const formatCurrency = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

const ITEM_TYPES = { Celular: '📱', Oro: '🥇', Dinero: '💵', Electrodoméstico: '🏠', Otro: '📦' };
const STATUS_COLOR = { ACTIVE: COLORS.primary, PAID: COLORS.secondary, OVERDUE: COLORS.danger };
const STATUS_LABEL = { ACTIVE: 'Activo', PAID: 'Pagado', OVERDUE: 'Atrasado' };

export default function FinancingsScreen({ navigation }) {
  const [financings, setFinancings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await financingService.getFinancings();
      setFinancings(data.financings);
      setSummary(data.summary);
    } catch { Alert.alert('Error', 'No se pudieron cargar los financiamientos'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const renderItem = ({ item }) => {
    const progress = item.paidInstallments / item.installments;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('FinancingDetail', { id: item.id, onUpdated: load })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <Text style={styles.itemIcon}>{ITEM_TYPES[item.itemType] ?? '📦'}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.clientName}>{item.clientName}</Text>
            <Text style={styles.itemDesc}>{item.itemDescription}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: STATUS_COLOR[item.status] + '20' }]}>
            <Text style={[styles.badgeText, { color: STATUS_COLOR[item.status] }]}>{STATUS_LABEL[item.status]}</Text>
          </View>
        </View>

        <View style={styles.progressRow}>
          <Text style={styles.progressText}>{item.paidInstallments}/{item.installments} cuotas</Text>
          <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: item.status === 'PAID' ? COLORS.secondary : COLORS.primary }]} />
        </View>

        <View style={styles.amounts}>
          <View>
            <Text style={styles.amtLabel}>Capital</Text>
            <Text style={styles.amtValue}>{formatCurrency(item.capital)}</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.amtLabel}>Cuota</Text>
            <Text style={styles.amtValue}>{formatCurrency(item.installmentAmount)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.amtLabel}>Ganancia</Text>
            <Text style={[styles.amtValue, { color: COLORS.secondary }]}>{formatCurrency(item.totalInterest)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Financiamientos</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('NewFinancing', { onCreated: load })}>
          <Text style={styles.addBtnText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      {summary && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Capital activo</Text>
            <Text style={[styles.summaryValue, { color: COLORS.primary }]}>{formatCurrency(summary.totalCapital)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Recaudado</Text>
            <Text style={[styles.summaryValue, { color: COLORS.secondary }]}>{formatCurrency(summary.totalCollected)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Ganancia total</Text>
            <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>{formatCurrency(summary.totalExpectedProfit)}</Text>
          </View>
        </View>
      )}

      {loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={financings}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💼</Text>
              <Text style={styles.emptyText}>Sin financiamientos aún</Text>
              <Text style={styles.emptySub}>Toca "+ Nuevo" para registrar uno</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56 },
  title: { fontSize: FONTS.size.xl, fontWeight: 'bold', color: COLORS.text },
  addBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: FONTS.size.sm },
  summaryCard: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12, justifyContent: 'space-between' },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { fontSize: FONTS.size.xs, color: COLORS.textLight },
  summaryValue: { fontSize: FONTS.size.sm, fontWeight: 'bold', marginTop: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemIcon: { fontSize: 22 },
  cardInfo: { flex: 1 },
  clientName: { fontSize: FONTS.size.md, fontWeight: 'bold', color: COLORS.text },
  itemDesc: { fontSize: FONTS.size.xs, color: COLORS.textLight, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: FONTS.size.xs, fontWeight: 'bold' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressText: { fontSize: FONTS.size.xs, color: COLORS.textLight },
  progressBar: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, marginBottom: 12, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  amounts: { flexDirection: 'row', justifyContent: 'space-between' },
  amtLabel: { fontSize: FONTS.size.xs, color: COLORS.textLight },
  amtValue: { fontSize: FONTS.size.sm, fontWeight: 'bold', color: COLORS.text, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: FONTS.size.md, fontWeight: '600', color: COLORS.text },
  emptySub: { fontSize: FONTS.size.sm, color: COLORS.textLight, marginTop: 4 },
});
