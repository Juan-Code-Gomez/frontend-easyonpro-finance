import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';
import { financingService } from '../../services/financeService';

const formatCurrency = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

const formatDate = (d) => new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

export default function FinancingDetailScreen({ route, navigation }) {
  const { id, onUpdated } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await financingService.getById(id);
      setData(res);
    } catch { Alert.alert('Error', 'No se pudo cargar el detalle'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleRegisterPayment = async () => {
    if (!data) return;
    const { financing } = data;
    if (financing.paidInstallments >= financing.installments)
      return Alert.alert('✅', 'Este financiamiento ya está completamente pagado');

    Alert.alert(
      `Registrar cuota #${financing.nextInstallment}`,
      `Monto: ${formatCurrency(financing.installmentAmount)}\n¿Confirmar pago?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar', onPress: async () => {
            try {
              setPaying(true);
              await financingService.addPayment(id, {});
              onUpdated?.();
              load();
              Alert.alert('✅', `Cuota #${financing.nextInstallment} registrada`);
            } catch (e) {
              Alert.alert('Error', e.response?.data?.message || 'No se pudo registrar');
            } finally { setPaying(false); }
          }
        }
      ]
    );
  };

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!data) return null;

  const { financing, schedule } = data;
  const progress = financing.paidInstallments / financing.installments;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[COLORS.primary]} />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Volver</Text></TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>Detalle</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Info cliente */}
      <View style={styles.infoCard}>
        <Text style={styles.clientName}>{financing.clientName}</Text>
        {financing.clientPhone && <Text style={styles.clientPhone}>📞 {financing.clientPhone}</Text>}
        <Text style={styles.itemDesc}>{financing.itemDescription} • {financing.itemType}</Text>
        <Text style={styles.startDate}>Desde {formatDate(financing.startDate)}</Text>
      </View>

      {/* Resumen financiero */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}><Text style={styles.summaryLabel}>Capital</Text><Text style={styles.summaryValue}>{formatCurrency(financing.capital)}</Text></View>
          <View style={styles.summaryItem}><Text style={styles.summaryLabel}>Tasa</Text><Text style={styles.summaryValue}>{financing.interestRate}% mensual</Text></View>
          <View style={styles.summaryItem}><Text style={styles.summaryLabel}>Cuota</Text><Text style={styles.summaryValue}>{formatCurrency(financing.installmentAmount)}</Text></View>
        </View>
        <View style={[styles.summaryRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border }]}>
          <View style={styles.summaryItem}><Text style={styles.summaryLabel}>Total</Text><Text style={styles.summaryValue}>{formatCurrency(financing.totalAmount)}</Text></View>
          <View style={styles.summaryItem}><Text style={styles.summaryLabel}>Recaudado</Text><Text style={[styles.summaryValue, { color: COLORS.secondary }]}>{formatCurrency(financing.paidAmount)}</Text></View>
          <View style={styles.summaryItem}><Text style={styles.summaryLabel}>Ganancia 🎉</Text><Text style={[styles.summaryValue, { color: '#F59E0B' }]}>{formatCurrency(financing.totalInterest)}</Text></View>
        </View>
      </View>

      {/* Progreso */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progreso de pago</Text>
          <Text style={styles.progressLabel}>{financing.paidInstallments}/{financing.installments} cuotas ({Math.round(progress * 100)}%)</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      {/* Botón registrar pago */}
      {financing.status !== 'PAID' && (
        <TouchableOpacity style={styles.payBtn} onPress={handleRegisterPayment} disabled={paying}>
          {paying ? <ActivityIndicator color={COLORS.white} /> : (
            <Text style={styles.payBtnText}>💳 Registrar cuota #{financing.nextInstallment} — {formatCurrency(financing.installmentAmount)}</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Tabla de cuotas */}
      <View style={styles.scheduleCard}>
        <Text style={styles.scheduleTitle}>📋 Tabla de cuotas</Text>
        {schedule.map((row) => (
          <View key={row.installmentNo} style={[styles.scheduleRow, row.paid && styles.scheduleRowPaid]}>
            <View style={[styles.cuotaBadge, { backgroundColor: row.paid ? COLORS.secondary : COLORS.border }]}>
              <Text style={[styles.cuotaNo, { color: row.paid ? COLORS.white : COLORS.textLight }]}>#{row.installmentNo}</Text>
            </View>
            <View style={styles.scheduleInfo}>
              <Text style={[styles.scheduleAmount, { color: row.paid ? COLORS.secondary : COLORS.text }]}>
                {formatCurrency(row.amount)}
              </Text>
              {row.paid && row.paymentDate && (
                <Text style={styles.scheduleDate}>Pagado {formatDate(row.paymentDate)}</Text>
              )}
              {!row.paid && <Text style={styles.scheduleDate}>Pendiente</Text>}
            </View>
            <Text style={{ fontSize: 18 }}>{row.paid ? '✅' : '⏳'}</Text>
          </View>
        ))}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56 },
  back: { color: COLORS.primary, fontSize: FONTS.size.sm, width: 60 },
  title: { fontSize: FONTS.size.lg, fontWeight: 'bold', color: COLORS.text },
  infoCard: { marginHorizontal: 16, backgroundColor: COLORS.primary, borderRadius: 12, padding: 20, marginBottom: 12 },
  clientName: { fontSize: FONTS.size.xl, fontWeight: 'bold', color: COLORS.white },
  clientPhone: { fontSize: FONTS.size.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  itemDesc: { fontSize: FONTS.size.sm, color: 'rgba(255,255,255,0.8)', marginTop: 8 },
  startDate: { fontSize: FONTS.size.xs, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  summaryCard: { marginHorizontal: 16, backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryLabel: { fontSize: FONTS.size.xs, color: COLORS.textLight },
  summaryValue: { fontSize: FONTS.size.sm, fontWeight: 'bold', color: COLORS.text, marginTop: 2 },
  progressCard: { marginHorizontal: 16, backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: FONTS.size.xs, color: COLORS.textLight },
  progressBar: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  payBtn: { marginHorizontal: 16, backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  payBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: FONTS.size.sm },
  scheduleCard: { marginHorizontal: 16, backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12 },
  scheduleTitle: { fontSize: FONTS.size.md, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  scheduleRowPaid: { opacity: 0.8 },
  cuotaBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cuotaNo: { fontSize: FONTS.size.xs, fontWeight: 'bold' },
  scheduleInfo: { flex: 1 },
  scheduleAmount: { fontSize: FONTS.size.sm, fontWeight: 'bold' },
  scheduleDate: { fontSize: FONTS.size.xs, color: COLORS.textLight, marginTop: 2 },
});
