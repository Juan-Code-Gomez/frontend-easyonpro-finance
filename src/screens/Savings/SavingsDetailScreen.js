import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, TextInput, Modal,
} from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';
import { savingsService } from '../../services/savingsService';

const formatCurrency = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

const formatDate = (d) => new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

export default function SavingsDetailScreen({ route, navigation }) {
  const { id, onUpdated } = route.params;
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await savingsService.getById(id);
      setGoal(data);
    } catch { Alert.alert('Error', 'No se pudo cargar la meta'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0)
      return Alert.alert('Error', 'Ingresa un monto válido');
    try {
      setSaving(true);
      const result = await savingsService.addDeposit(id, { amount: parseFloat(depositAmount), note: depositNote || null });
      setModalVisible(false);
      setDepositAmount('');
      setDepositNote('');
      onUpdated?.();
      load();
      if (result.completed) Alert.alert('🎉', `¡Felicidades! Lograste tu meta "${goal.name}"`);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo registrar');
    } finally { setSaving(false); }
  };

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!goal) return null;

  const progress = Math.min(goal.savedAmount / goal.targetAmount, 1);
  const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[COLORS.primary]} />}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Volver</Text></TouchableOpacity>
          <Text style={styles.title}>Detalle</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Hero card */}
        <View style={[styles.heroCard, goal.status === 'COMPLETED' && { backgroundColor: COLORS.secondary }]}>
          <Text style={styles.heroIcon}>{goal.icon}</Text>
          <Text style={styles.heroName}>{goal.name}</Text>
          {goal.targetDate && <Text style={styles.heroDate}>📅 Meta para {formatDate(goal.targetDate)}</Text>}
          <Text style={styles.heroSaved}>{formatCurrency(goal.savedAmount)}</Text>
          <Text style={styles.heroTarget}>de {formatCurrency(goal.targetAmount)}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: 'rgba(255,255,255,0.8)' }]} />
          </View>
          <Text style={styles.heroPercent}>{Math.round(progress * 100)}% completado</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Ahorrado</Text>
            <Text style={[styles.statValue, { color: COLORS.secondary }]}>{formatCurrency(goal.savedAmount)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Faltante</Text>
            <Text style={[styles.statValue, { color: remaining > 0 ? COLORS.danger : COLORS.secondary }]}>{formatCurrency(remaining)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Depósitos</Text>
            <Text style={styles.statValue}>{goal.deposits.length}</Text>
          </View>
        </View>

        {/* Botón depositar */}
        {goal.status === 'ACTIVE' && (
          <TouchableOpacity style={styles.depositBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.depositBtnText}>💰 Agregar depósito</Text>
          </TouchableOpacity>
        )}
        {goal.status === 'COMPLETED' && (
          <View style={styles.completedBanner}>
            <Text style={styles.completedText}>🎉 ¡Meta lograda! ¡Felicidades!</Text>
          </View>
        )}

        {/* Historial */}
        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>📋 Historial de depósitos</Text>
          {goal.deposits.length === 0 ? (
            <Text style={styles.noDeposits}>Aún no hay depósitos</Text>
          ) : (
            goal.deposits.map((d) => (
              <View key={d.id} style={styles.depositRow}>
                <View style={styles.depositIcon}><Text style={{ fontSize: 18 }}>💵</Text></View>
                <View style={styles.depositInfo}>
                  <Text style={styles.depositAmount}>{formatCurrency(d.amount)}</Text>
                  {d.note && <Text style={styles.depositNote}>{d.note}</Text>}
                </View>
                <Text style={styles.depositDate}>{formatDate(d.date)}</Text>
              </View>
            ))
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal depósito */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>💰 Agregar depósito</Text>
            <Text style={styles.modalSub}>{goal.icon} {goal.name}</Text>

            <Text style={styles.modalLabel}>Monto</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="0"
              placeholderTextColor={COLORS.textLight}
              value={depositAmount}
              onChangeText={setDepositAmount}
              keyboardType="numeric"
              autoFocus
            />

            <Text style={styles.modalLabel}>Nota (opcional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ahorro semanal, bono..."
              placeholderTextColor={COLORS.textLight}
              value={depositNote}
              onChangeText={setDepositNote}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); setDepositAmount(''); setDepositNote(''); }}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleDeposit} disabled={saving}>
                {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.confirmBtnText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56 },
  back: { color: COLORS.primary, fontSize: FONTS.size.sm, width: 60 },
  title: { fontSize: FONTS.size.lg, fontWeight: 'bold', color: COLORS.text },
  heroCard: { marginHorizontal: 16, backgroundColor: COLORS.primary, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 12 },
  heroIcon: { fontSize: 48, marginBottom: 8 },
  heroName: { fontSize: FONTS.size.xl, fontWeight: 'bold', color: COLORS.white },
  heroDate: { fontSize: FONTS.size.xs, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  heroSaved: { fontSize: 36, fontWeight: 'bold', color: COLORS.white, marginTop: 16 },
  heroTarget: { fontSize: FONTS.size.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, width: '100%', marginTop: 16, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  heroPercent: { fontSize: FONTS.size.sm, color: 'rgba(255,255,255,0.8)', marginTop: 8 },
  statsCard: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12, justifyContent: 'space-between' },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: FONTS.size.xs, color: COLORS.textLight },
  statValue: { fontSize: FONTS.size.sm, fontWeight: 'bold', color: COLORS.text, marginTop: 2 },
  depositBtn: { marginHorizontal: 16, backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  depositBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: FONTS.size.md },
  completedBanner: { marginHorizontal: 16, backgroundColor: COLORS.secondary + '20', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: COLORS.secondary },
  completedText: { color: COLORS.secondary, fontWeight: 'bold', fontSize: FONTS.size.md },
  historyCard: { marginHorizontal: 16, backgroundColor: COLORS.white, borderRadius: 12, padding: 16 },
  historyTitle: { fontSize: FONTS.size.md, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  noDeposits: { color: COLORS.textLight, textAlign: 'center', paddingVertical: 20 },
  depositRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  depositIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.secondary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  depositInfo: { flex: 1 },
  depositAmount: { fontSize: FONTS.size.sm, fontWeight: 'bold', color: COLORS.secondary },
  depositNote: { fontSize: FONTS.size.xs, color: COLORS.textLight, marginTop: 2 },
  depositDate: { fontSize: FONTS.size.xs, color: COLORS.textLight },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: FONTS.size.lg, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  modalSub: { fontSize: FONTS.size.sm, color: COLORS.textLight, marginBottom: 16 },
  modalLabel: { fontSize: FONTS.size.sm, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 8 },
  modalInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, fontSize: FONTS.size.md, color: COLORS.text },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, backgroundColor: COLORS.background, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  cancelBtnText: { color: COLORS.text, fontWeight: '600' },
  confirmBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  confirmBtnText: { color: COLORS.white, fontWeight: 'bold' },
});
