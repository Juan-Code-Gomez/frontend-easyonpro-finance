import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';
import { debtService } from '../../services/financeService';

const formatCurrency = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

const STATUS_COLOR = { ACTIVE: COLORS.warning, PAID: COLORS.secondary, OVERDUE: COLORS.danger };
const STATUS_LABEL = { ACTIVE: 'Activa', PAID: 'Pagada', OVERDUE: 'Vencida' };

export default function DebtsScreen({ navigation }) {
  const [debts, setDebts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await debtService.getDebts();
      setDebts(data.debts);
      setSummary(data.summary);
    } catch { Alert.alert('Error', 'No se pudieron cargar las deudas'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePayment = (debt) => {
    Alert.prompt(
      `Registrar pago - ${debt.creditor}`,
      `Cuota sugerida: ${formatCurrency(debt.monthlyPayment || 0)}\nIngresa el monto:`,
      async (amount) => {
        if (!amount) return;
        try {
          await debtService.addPayment(debt.id, { amount: parseFloat(amount) });
          Alert.alert('✅', 'Pago registrado');
          load();
        } catch { Alert.alert('Error', 'No se pudo registrar el pago'); }
      },
      'plain-text',
      String(debt.monthlyPayment || ''),
      'numeric'
    );
  };

  const renderItem = ({ item }) => {
    const remaining = item.totalAmount - item.paidAmount;
    const progress = item.paidAmount / item.totalAmount;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.creditor}>{item.creditor}</Text>
            {item.description && <Text style={styles.desc}>{item.description}</Text>}
          </View>
          <View style={[styles.badge, { backgroundColor: STATUS_COLOR[item.status] + '20' }]}>
            <Text style={[styles.badgeText, { color: STATUS_COLOR[item.status] }]}>{STATUS_LABEL[item.status]}</Text>
          </View>
        </View>

        {/* Barra de progreso */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: item.status === 'PAID' ? COLORS.secondary : COLORS.primary }]} />
        </View>

        <View style={styles.amounts}>
          <View>
            <Text style={styles.amtLabel}>Pagado</Text>
            <Text style={[styles.amtValue, { color: COLORS.secondary }]}>{formatCurrency(item.paidAmount)}</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.amtLabel}>Total</Text>
            <Text style={styles.amtValue}>{formatCurrency(item.totalAmount)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.amtLabel}>Pendiente</Text>
            <Text style={[styles.amtValue, { color: remaining > 0 ? COLORS.danger : COLORS.secondary }]}>{formatCurrency(remaining)}</Text>
          </View>
        </View>

        {item.status !== 'PAID' && (
          <TouchableOpacity style={styles.payBtn} onPress={() => handlePayment(item)}>
            <Text style={styles.payBtnText}>💳 Registrar pago</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Deudas</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('NewDebt', { onCreated: load })}>
          <Text style={styles.addBtnText}>+ Nueva</Text>
        </TouchableOpacity>
      </View>

      {summary && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total deuda</Text>
            <Text style={[styles.summaryValue, { color: COLORS.danger }]}>{formatCurrency(summary.totalDebt)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total pagado</Text>
            <Text style={[styles.summaryValue, { color: COLORS.secondary }]}>{formatCurrency(summary.totalPaid)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Activas</Text>
            <Text style={styles.summaryValue}>{summary.activeCount}</Text>
          </View>
        </View>
      )}

      {loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={debts}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🎉</Text>
              <Text style={styles.emptyText}>¡Sin deudas registradas!</Text>
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
  summaryValue: { fontSize: FONTS.size.md, fontWeight: 'bold', color: COLORS.text, marginTop: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  creditor: { fontSize: FONTS.size.md, fontWeight: 'bold', color: COLORS.text },
  desc: { fontSize: FONTS.size.xs, color: COLORS.textLight, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: FONTS.size.xs, fontWeight: 'bold' },
  progressBar: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, marginBottom: 12, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  amounts: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  amtLabel: { fontSize: FONTS.size.xs, color: COLORS.textLight },
  amtValue: { fontSize: FONTS.size.sm, fontWeight: 'bold', color: COLORS.text, marginTop: 2 },
  payBtn: { backgroundColor: COLORS.primary + '15', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary + '40' },
  payBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: FONTS.size.sm },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: FONTS.size.md, fontWeight: '600', color: COLORS.text },
});
