import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';
import { reportService } from '../../services/reportService';

const formatCurrency = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v || 0);

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const SectionTitle = ({ emoji, title }) => (
  <Text style={styles.sectionTitle}>{emoji} {title}</Text>
);

const MiniBar = ({ value, max, color = COLORS.primary }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <View style={styles.miniBarTrack}>
      <View style={[styles.miniBarFill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
};

export default function ReportsScreen() {
  const now = new Date();
  const [view, setView] = useState('monthly'); // 'monthly' | 'yearly'
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [monthlyData, setMonthlyData] = useState(null);
  const [yearlyData, setYearlyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      if (view === 'monthly') {
        const data = await reportService.getMonthly(month, year);
        setMonthlyData(data);
      } else {
        const data = await reportService.getYearly(year);
        setYearlyData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [view, month, year]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const maxMonthlyBar = yearlyData
    ? Math.max(...yearlyData.monthlyData.map(m => Math.max(m.income, m.expense)), 1)
    : 1;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[COLORS.primary]} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Reportes</Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity style={[styles.toggleBtn, view === 'monthly' && styles.toggleActive]} onPress={() => setView('monthly')}>
            <Text style={[styles.toggleText, view === 'monthly' && styles.toggleTextActive]}>Mensual</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, view === 'yearly' && styles.toggleActive]} onPress={() => setView('yearly')}>
            <Text style={[styles.toggleText, view === 'yearly' && styles.toggleTextActive]}>Anual</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Selector de mes (solo en vista mensual) */}
      {view === 'monthly' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {MONTHS_SHORT.map((m, idx) => (
            <TouchableOpacity key={idx} style={[styles.monthChip, month === idx + 1 && styles.monthChipActive]} onPress={() => setMonth(idx + 1)}>
              <Text style={[styles.monthChipText, month === idx + 1 && styles.monthChipTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 60 }} />
      ) : view === 'monthly' ? (
        <MonthlyView data={monthlyData} month={month} year={year} />
      ) : (
        <YearlyView data={yearlyData} year={year} maxBar={maxMonthlyBar} />
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── VISTA MENSUAL ───────────────────────────────────────────────────────────
function MonthlyView({ data, month, year }) {
  if (!data) return null;
  const { summary, expenseByCategory, incomeByCategory, topTransactions, budgetComparison } = data;
  const maxCatAmount = Math.max(...expenseByCategory.map(c => c.amount), 1);

  return (
    <View style={styles.content}>
      {/* Resumen financiero */}
      <Text style={styles.periodLabel}>{MONTHS[month - 1]} {year}</Text>
      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, { borderLeftColor: COLORS.secondary }]}>
          <Text style={styles.summaryCardLabel}>Ingresos</Text>
          <Text style={[styles.summaryCardValue, { color: COLORS.secondary }]}>{formatCurrency(summary.totalIncome)}</Text>
          <Text style={styles.summaryCardCount}>{summary.incomeCount} movimientos</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: '#EF4444' }]}>
          <Text style={styles.summaryCardLabel}>Gastos</Text>
          <Text style={[styles.summaryCardValue, { color: '#EF4444' }]}>{formatCurrency(summary.totalExpense)}</Text>
          <Text style={styles.summaryCardCount}>{summary.expenseCount} movimientos</Text>
        </View>
      </View>

      {/* Balance y tasa de ahorro */}
      <View style={[styles.balanceCard, { backgroundColor: summary.balance >= 0 ? COLORS.primary : '#EF4444' }]}>
        <View>
          <Text style={styles.balanceLabel}>Balance del mes</Text>
          <Text style={styles.balanceValue}>{formatCurrency(summary.balance)}</Text>
        </View>
        <View style={styles.savingsRateBox}>
          <Text style={styles.savingsRateLabel}>Tasa de ahorro</Text>
          <Text style={styles.savingsRateValue}>{summary.savingsRate}%</Text>
        </View>
      </View>

      {/* Gastos por categoría */}
      {expenseByCategory.length > 0 && (
        <View style={styles.section}>
          <SectionTitle emoji="📊" title="Gastos por categoría" />
          {expenseByCategory.map((item, i) => (
            <View key={i} style={styles.catRow}>
              <Text style={styles.catRowIcon}>{item.category?.icon || '💰'}</Text>
              <View style={styles.catRowInfo}>
                <View style={styles.catRowHeader}>
                  <Text style={styles.catRowName}>{item.category?.name || 'Sin categoría'}</Text>
                  <Text style={styles.catRowAmount}>{formatCurrency(item.amount)}</Text>
                </View>
                <MiniBar value={item.amount} max={maxCatAmount} color={item.category?.color || '#EF4444'} />
                <Text style={styles.catRowPct}>{item.percentage}% del total</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Ingresos por categoría */}
      {incomeByCategory.length > 0 && (
        <View style={styles.section}>
          <SectionTitle emoji="💵" title="Ingresos por categoría" />
          {incomeByCategory.map((item, i) => (
            <View key={i} style={styles.catRow}>
              <Text style={styles.catRowIcon}>{item.category?.icon || '💰'}</Text>
              <View style={styles.catRowInfo}>
                <View style={styles.catRowHeader}>
                  <Text style={styles.catRowName}>{item.category?.name || 'Sin categoría'}</Text>
                  <Text style={[styles.catRowAmount, { color: COLORS.secondary }]}>{formatCurrency(item.amount)}</Text>
                </View>
                <MiniBar value={item.amount} max={summary.totalIncome} color={COLORS.secondary} />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Top transacciones */}
      {topTransactions.length > 0 && (
        <View style={styles.section}>
          <SectionTitle emoji="🏆" title="Mayores movimientos" />
          {topTransactions.map((tx, i) => (
            <View key={tx.id} style={styles.txRow}>
              <View style={styles.txRank}><Text style={styles.txRankText}>#{i + 1}</Text></View>
              <Text style={styles.txIcon}>{tx.category?.icon || (tx.type === 'INCOME' ? '💵' : '💸')}</Text>
              <View style={styles.txInfo}>
                <Text style={styles.txDesc}>{tx.description || tx.category?.name || 'Sin descripción'}</Text>
                <Text style={styles.txCat}>{tx.category?.name || ''}</Text>
              </View>
              <Text style={[styles.txAmount, { color: tx.type === 'INCOME' ? COLORS.secondary : '#EF4444' }]}>
                {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Presupuestos vs real */}
      {budgetComparison.length > 0 && (
        <View style={styles.section}>
          <SectionTitle emoji="🎯" title="Presupuestos este mes" />
          {budgetComparison.map((b) => {
            const barColor = b.status === 'exceeded' ? '#EF4444' : b.status === 'warning' ? '#F59E0B' : COLORS.secondary;
            return (
              <View key={b.id} style={styles.budgetRow}>
                <View style={styles.budgetRowHeader}>
                  <Text style={styles.budgetCat}>{b.category.icon} {b.category.name}</Text>
                  <Text style={[styles.budgetPct, { color: barColor }]}>{b.percentage}%</Text>
                </View>
                <View style={styles.budgetBarTrack}>
                  <View style={[styles.budgetBarFill, { width: `${Math.min(b.percentage, 100)}%`, backgroundColor: barColor }]} />
                </View>
                <View style={styles.budgetAmounts}>
                  <Text style={styles.budgetAmtLabel}>Gastado: {formatCurrency(b.spent)}</Text>
                  <Text style={styles.budgetAmtLabel}>Límite: {formatCurrency(b.amount)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ─── VISTA ANUAL ─────────────────────────────────────────────────────────────
function YearlyView({ data, year, maxBar }) {
  if (!data) return null;
  const { annual, monthlyData, financings, debts, savings } = data;

  return (
    <View style={styles.content}>
      <Text style={styles.periodLabel}>Año {year}</Text>

      {/* Resumen anual */}
      <View style={[styles.balanceCard, { backgroundColor: annual.balance >= 0 ? COLORS.primary : '#EF4444' }]}>
        <View>
          <Text style={styles.balanceLabel}>Balance anual</Text>
          <Text style={styles.balanceValue}>{formatCurrency(annual.balance)}</Text>
        </View>
        <View>
          <Text style={[styles.balanceLabel, { textAlign: 'right' }]}>Ingresos vs Gastos</Text>
          <Text style={styles.balanceSubValue}>{formatCurrency(annual.totalIncome)} / {formatCurrency(annual.totalExpense)}</Text>
        </View>
      </View>

      {/* Gráfica mes a mes */}
      <View style={styles.section}>
        <SectionTitle emoji="📈" title="Evolución mensual" />
        <View style={styles.barChart}>
          {monthlyData.map((m) => {
            const incH = maxBar > 0 ? (m.income / maxBar) * 100 : 0;
            const expH = maxBar > 0 ? (m.expense / maxBar) * 100 : 0;
            return (
              <View key={m.month} style={styles.barGroup}>
                <View style={styles.barPair}>
                  <View style={[styles.bar, { height: Math.max(incH, 2), backgroundColor: COLORS.secondary + 'CC' }]} />
                  <View style={[styles.bar, { height: Math.max(expH, 2), backgroundColor: '#EF4444CC' }]} />
                </View>
                <Text style={styles.barLabel}>{MONTHS_SHORT[m.month - 1]}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.barLegend}>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: COLORS.secondary }]} /><Text style={styles.legendText}>Ingresos</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} /><Text style={styles.legendText}>Gastos</Text></View>
        </View>
      </View>

      {/* Portafolio de financiamientos */}
      <View style={styles.section}>
        <SectionTitle emoji="📦" title="Portafolio de financiamientos" />
        <View style={styles.statsGrid}>
          <View style={styles.statCard}><Text style={styles.statVal}>{financings.total}</Text><Text style={styles.statLbl}>Total</Text></View>
          <View style={styles.statCard}><Text style={[styles.statVal, { color: COLORS.primary }]}>{financings.active}</Text><Text style={styles.statLbl}>Activos</Text></View>
          <View style={styles.statCard}><Text style={[styles.statVal, { color: '#F59E0B', fontSize: FONTS.size.xs }]}>{formatCurrency(financings.capitalDeployed)}</Text><Text style={styles.statLbl}>Capital</Text></View>
          <View style={styles.statCard}><Text style={[styles.statVal, { color: COLORS.secondary, fontSize: FONTS.size.xs }]}>{formatCurrency(financings.expectedProfit)}</Text><Text style={styles.statLbl}>Ganancia total</Text></View>
        </View>
        <View style={[styles.highlightRow, { backgroundColor: COLORS.secondary + '15' }]}>
          <Text style={styles.highlightLabel}>💰 Recaudado este año</Text>
          <Text style={[styles.highlightValue, { color: COLORS.secondary }]}>{formatCurrency(financings.collectedThisYear)}</Text>
        </View>
      </View>

      {/* Deudas */}
      <View style={styles.section}>
        <SectionTitle emoji="💳" title="Estado de deudas" />
        <View style={styles.statsGrid}>
          <View style={styles.statCard}><Text style={styles.statVal}>{debts.total}</Text><Text style={styles.statLbl}>Total</Text></View>
          <View style={styles.statCard}><Text style={[styles.statVal, { color: '#EF4444' }]}>{debts.active}</Text><Text style={styles.statLbl}>Activas</Text></View>
          <View style={[styles.statCard, { flex: 2 }]}><Text style={[styles.statVal, { color: '#EF4444', fontSize: FONTS.size.xs }]}>{formatCurrency(debts.totalOwed)}</Text><Text style={styles.statLbl}>Por pagar</Text></View>
        </View>
      </View>

      {/* Ahorros */}
      <View style={styles.section}>
        <SectionTitle emoji="🏦" title="Metas de ahorro" />
        <View style={styles.statsGrid}>
          <View style={styles.statCard}><Text style={styles.statVal}>{savings.total}</Text><Text style={styles.statLbl}>Metas</Text></View>
          <View style={styles.statCard}><Text style={[styles.statVal, { color: '#F59E0B' }]}>{savings.completed}</Text><Text style={styles.statLbl}>Logradas 🏆</Text></View>
          <View style={[styles.statCard, { flex: 2 }]}>
            <Text style={[styles.statVal, { color: COLORS.secondary, fontSize: FONTS.size.xs }]}>{formatCurrency(savings.totalSaved)}</Text>
            <Text style={styles.statLbl}>de {formatCurrency(savings.totalTarget)}</Text>
          </View>
        </View>
        {savings.totalTarget > 0 && (
          <View style={styles.miniBarTrack}>
            <View style={[styles.miniBarFill, { width: `${Math.round((savings.totalSaved / savings.totalTarget) * 100)}%`, backgroundColor: COLORS.secondary }]} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56 },
  title: { fontSize: FONTS.size.xl, fontWeight: 'bold', color: COLORS.text },
  viewToggle: { flexDirection: 'row', backgroundColor: COLORS.border, borderRadius: 20, padding: 3 },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 17 },
  toggleActive: { backgroundColor: COLORS.primary },
  toggleText: { fontSize: FONTS.size.xs, color: COLORS.textLight, fontWeight: '600' },
  toggleTextActive: { color: COLORS.white },
  monthRow: { marginBottom: 8 },
  monthChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  monthChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  monthChipText: { fontSize: FONTS.size.xs, color: COLORS.textLight },
  monthChipTextActive: { color: COLORS.white, fontWeight: 'bold' },
  content: { paddingHorizontal: 16 },
  periodLabel: { fontSize: FONTS.size.md, fontWeight: '600', color: COLORS.textLight, marginBottom: 12, marginTop: 4 },
  summaryGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  summaryCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 14, borderLeftWidth: 4 },
  summaryCardLabel: { fontSize: FONTS.size.xs, color: COLORS.textLight },
  summaryCardValue: { fontSize: FONTS.size.md, fontWeight: 'bold', marginTop: 4 },
  summaryCardCount: { fontSize: FONTS.size.xs, color: COLORS.textLight, marginTop: 2 },
  balanceCard: { borderRadius: 14, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  balanceLabel: { fontSize: FONTS.size.xs, color: 'rgba(255,255,255,0.8)' },
  balanceValue: { fontSize: 26, fontWeight: 'bold', color: COLORS.white, marginTop: 4 },
  balanceSubValue: { fontSize: FONTS.size.xs, color: 'rgba(255,255,255,0.9)', marginTop: 4, textAlign: 'right' },
  savingsRateBox: { alignItems: 'center' },
  savingsRateLabel: { fontSize: FONTS.size.xs, color: 'rgba(255,255,255,0.8)' },
  savingsRateValue: { fontSize: 28, fontWeight: 'bold', color: COLORS.white },
  section: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: FONTS.size.md, fontWeight: 'bold', color: COLORS.text, marginBottom: 14 },
  catRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  catRowIcon: { fontSize: 22, marginRight: 10, marginTop: 2 },
  catRowInfo: { flex: 1 },
  catRowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  catRowName: { fontSize: FONTS.size.sm, fontWeight: '600', color: COLORS.text },
  catRowAmount: { fontSize: FONTS.size.sm, fontWeight: 'bold', color: COLORS.text },
  catRowPct: { fontSize: FONTS.size.xs, color: COLORS.textLight, marginTop: 3 },
  miniBarTrack: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  miniBarFill: { height: '100%', borderRadius: 3 },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  txRank: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  txRankText: { fontSize: 10, fontWeight: 'bold', color: COLORS.primary },
  txIcon: { fontSize: 20, marginRight: 10 },
  txInfo: { flex: 1 },
  txDesc: { fontSize: FONTS.size.sm, fontWeight: '600', color: COLORS.text },
  txCat: { fontSize: FONTS.size.xs, color: COLORS.textLight },
  txAmount: { fontSize: FONTS.size.sm, fontWeight: 'bold' },
  budgetRow: { marginBottom: 14 },
  budgetRowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  budgetCat: { fontSize: FONTS.size.sm, fontWeight: '600', color: COLORS.text },
  budgetPct: { fontSize: FONTS.size.sm, fontWeight: 'bold' },
  budgetBarTrack: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  budgetBarFill: { height: '100%', borderRadius: 4 },
  budgetAmounts: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetAmtLabel: { fontSize: FONTS.size.xs, color: COLORS.textLight },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 100, marginBottom: 8 },
  barGroup: { flex: 1, alignItems: 'center' },
  barPair: { flexDirection: 'row', gap: 2, alignItems: 'flex-end', height: 90 },
  bar: { width: 7, borderRadius: 3 },
  barLabel: { fontSize: 8, color: COLORS.textLight, marginTop: 4 },
  barLegend: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: FONTS.size.xs, color: COLORS.textLight },
  statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  statCard: { flex: 1, backgroundColor: COLORS.background, borderRadius: 10, padding: 10, alignItems: 'center' },
  statVal: { fontSize: FONTS.size.md, fontWeight: 'bold', color: COLORS.text },
  statLbl: { fontSize: 9, color: COLORS.textLight, marginTop: 2, textAlign: 'center' },
  highlightRow: { borderRadius: 10, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  highlightLabel: { fontSize: FONTS.size.sm, fontWeight: '600', color: COLORS.text },
  highlightValue: { fontSize: FONTS.size.md, fontWeight: 'bold' },
});
