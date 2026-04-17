import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';
import { savingsService } from '../../services/savingsService';

const formatCurrency = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

const STATUS_COLOR = { ACTIVE: COLORS.primary, COMPLETED: COLORS.secondary, CANCELLED: COLORS.danger };
const STATUS_LABEL = { ACTIVE: 'Activa', COMPLETED: '¡Lograda!', CANCELLED: 'Cancelada' };

export default function SavingsScreen({ navigation }) {
  const [goals, setGoals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await savingsService.getGoals();
      setGoals(data.goals);
      setSummary(data.summary);
    } catch { Alert.alert('Error', 'No se pudieron cargar las metas'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (id, name) => {
    Alert.alert(`Eliminar "${name}"`, '¿Estás seguro? Se perderá el historial de depósitos.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await savingsService.deleteGoal(id); load(); } },
    ]);
  };

  const renderItem = ({ item }) => {
    const progress = Math.min(item.savedAmount / item.targetAmount, 1);
    const remaining = Math.max(item.targetAmount - item.savedAmount, 0);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('SavingsDetail', { id: item.id, onUpdated: load })}
        onLongPress={() => handleDelete(item.id, item.name)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: STATUS_COLOR[item.status] + '15' }]}>
            <Text style={styles.icon}>{item.icon}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.goalName}>{item.name}</Text>
            <Text style={styles.goalSub}>
              {item.targetDate
                ? `Meta: ${new Date(item.targetDate).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}`
                : 'Sin fecha límite'}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: STATUS_COLOR[item.status] + '20' }]}>
            <Text style={[styles.badgeText, { color: STATUS_COLOR[item.status] }]}>{STATUS_LABEL[item.status]}</Text>
          </View>
        </View>

        <View style={styles.progressRow}>
          <Text style={styles.progressText}>{Math.round(progress * 100)}% completado</Text>
          {remaining > 0 && <Text style={styles.progressText}>Faltan {formatCurrency(remaining)}</Text>}
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: item.status === 'COMPLETED' ? COLORS.secondary : COLORS.primary }]} />
        </View>

        <View style={styles.amounts}>
          <View>
            <Text style={styles.amtLabel}>Ahorrado</Text>
            <Text style={[styles.amtValue, { color: COLORS.secondary }]}>{formatCurrency(item.savedAmount)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.amtLabel}>Objetivo</Text>
            <Text style={styles.amtValue}>{formatCurrency(item.targetAmount)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Ahorros</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('NewSavings', { onCreated: load })}>
          <Text style={styles.addBtnText}>+ Nueva meta</Text>
        </TouchableOpacity>
      </View>

      {summary && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total ahorrado</Text>
            <Text style={[styles.summaryValue, { color: COLORS.secondary }]}>{formatCurrency(summary.totalSaved)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Objetivo total</Text>
            <Text style={[styles.summaryValue, { color: COLORS.primary }]}>{formatCurrency(summary.totalTarget)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Logradas 🏆</Text>
            <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>{summary.completedGoals}</Text>
          </View>
        </View>
      )}

      {loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={goals}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏦</Text>
              <Text style={styles.emptyText}>Sin metas de ahorro</Text>
              <Text style={styles.emptySub}>Toca "+ Nueva meta" para empezar</Text>
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
  iconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  icon: { fontSize: 26 },
  cardInfo: { flex: 1 },
  goalName: { fontSize: FONTS.size.md, fontWeight: 'bold', color: COLORS.text },
  goalSub: { fontSize: FONTS.size.xs, color: COLORS.textLight, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: FONTS.size.xs, fontWeight: 'bold' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressText: { fontSize: FONTS.size.xs, color: COLORS.textLight },
  progressBar: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, marginBottom: 12, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  amounts: { flexDirection: 'row', justifyContent: 'space-between' },
  amtLabel: { fontSize: FONTS.size.xs, color: COLORS.textLight },
  amtValue: { fontSize: FONTS.size.sm, fontWeight: 'bold', color: COLORS.text, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: FONTS.size.md, fontWeight: '600', color: COLORS.text },
  emptySub: { fontSize: FONTS.size.sm, color: COLORS.textLight, marginTop: 4 },
});
