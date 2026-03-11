import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';
import { transactionService } from '../../services/transactionService';
import useAuthStore from '../../store/authStore';
import useTransactionStore from '../../store/transactionStore';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);

export default function DashboardScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const { summary, setSummary } = useTransactionStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear] = useState(now.getFullYear());

  const loadSummary = useCallback(async () => {
    try {
      const data = await transactionService.getSummary(selectedMonth, selectedYear);
      setSummary(data);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const onRefresh = () => { setRefreshing(true); loadSummary(); };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const balance = summary?.balance ?? 0;
  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpense = summary?.totalExpense ?? 0;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.subGreeting}>Aquí está tu resumen financiero</Text>
        </View>
      </View>

      {/* Selector de mes */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthsRow}>
        {MONTHS.map((m, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.monthChip, selectedMonth === i + 1 && styles.monthChipActive]}
            onPress={() => setSelectedMonth(i + 1)}
          >
            <Text style={[styles.monthChipText, selectedMonth === i + 1 && styles.monthChipTextActive]}>
              {m}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Balance principal */}
      <View style={[styles.balanceCard, { backgroundColor: balance >= 0 ? COLORS.primary : COLORS.danger }]}>
        <Text style={styles.balanceLabel}>Balance del mes</Text>
        <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
        <Text style={styles.balanceMonth}>{MONTHS[selectedMonth - 1]} {selectedYear}</Text>
      </View>

      {/* Income / Expense */}
      <View style={styles.row}>
        <View style={[styles.summaryCard, { borderLeftColor: COLORS.secondary }]}>
          <Text style={styles.summaryIcon}>📈</Text>
          <Text style={styles.summaryLabel}>Ingresos</Text>
          <Text style={[styles.summaryAmount, { color: COLORS.secondary }]}>{formatCurrency(totalIncome)}</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: COLORS.danger }]}>
          <Text style={styles.summaryIcon}>📉</Text>
          <Text style={styles.summaryLabel}>Gastos</Text>
          <Text style={[styles.summaryAmount, { color: COLORS.danger }]}>{formatCurrency(totalExpense)}</Text>
        </View>
      </View>

      {/* Top categorías */}
      {summary?.categoryBreakdown?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top gastos por categoría</Text>
          {summary.categoryBreakdown
            .filter((b) => b.type === 'EXPENSE')
            .slice(0, 5)
            .map((b, i) => (
              <View key={i} style={styles.categoryRow}>
                <Text style={styles.categoryIcon}>{b.category?.icon ?? '📦'}</Text>
                <Text style={styles.categoryName}>{b.category?.name ?? 'Sin categoría'}</Text>
                <Text style={[styles.categoryAmount, { color: COLORS.danger }]}>
                  {formatCurrency(b.total)}
                </Text>
              </View>
            ))}
        </View>
      )}

      {/* Botón acceso rápido */}
      <TouchableOpacity
        style={styles.seeAllButton}
        onPress={() => navigation.navigate('Transactions')}
      >
        <Text style={styles.seeAllText}>Ver todas las transacciones →</Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56 },
  greeting: { fontSize: FONTS.size.xl, fontWeight: 'bold', color: COLORS.text },
  subGreeting: { fontSize: FONTS.size.sm, color: COLORS.textLight, marginTop: 2 },
  monthsRow: { paddingHorizontal: 16, marginBottom: 16 },
  monthChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: COLORS.white, marginRight: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  monthChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  monthChipText: { fontSize: FONTS.size.sm, color: COLORS.textLight },
  monthChipTextActive: { color: COLORS.white, fontWeight: 'bold' },
  balanceCard: {
    marginHorizontal: 16, borderRadius: 16, padding: 24, marginBottom: 16,
    alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: FONTS.size.sm },
  balanceAmount: { color: COLORS.white, fontSize: FONTS.size.xxl, fontWeight: 'bold', marginVertical: 4 },
  balanceMonth: { color: 'rgba(255,255,255,0.7)', fontSize: FONTS.size.xs },
  row: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 20 },
  summaryCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 16,
    borderLeftWidth: 4, elevation: 2,
  },
  summaryIcon: { fontSize: 22, marginBottom: 4 },
  summaryLabel: { fontSize: FONTS.size.xs, color: COLORS.textLight, marginBottom: 4 },
  summaryAmount: { fontSize: FONTS.size.md, fontWeight: 'bold' },
  section: { marginHorizontal: 16, backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: FONTS.size.md, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  categoryIcon: { fontSize: 20, marginRight: 10 },
  categoryName: { flex: 1, fontSize: FONTS.size.sm, color: COLORS.text },
  categoryAmount: { fontSize: FONTS.size.sm, fontWeight: 'bold' },
  seeAllButton: { marginHorizontal: 16, padding: 14, backgroundColor: COLORS.white, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  seeAllText: { color: COLORS.primary, fontWeight: '600', fontSize: FONTS.size.sm },
});
