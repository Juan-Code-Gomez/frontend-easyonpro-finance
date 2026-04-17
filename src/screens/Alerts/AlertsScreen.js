import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';
import { alertService } from '../../services/alertService';

const ALERT_CONFIG = {
  BUDGET_EXCEEDED:   { icon: '🚨', color: '#EF4444', bg: '#FEF2F2', label: 'Presupuesto excedido' },
  BUDGET_WARNING:    { icon: '⚡', color: '#F59E0B', bg: '#FFFBEB', label: 'Alerta de presupuesto' },
  DEBT_OVERDUE:      { icon: '⚠️', color: '#EF4444', bg: '#FEF2F2', label: 'Deuda vencida' },
  DEBT_DUE_SOON:     { icon: '📅', color: '#F59E0B', bg: '#FFFBEB', label: 'Vence pronto' },
  FINANCING_OVERDUE: { icon: '💸', color: '#EF4444', bg: '#FEF2F2', label: 'Cobro pendiente' },
  SAVINGS_MILESTONE: { icon: '🎉', color: '#10B981', bg: '#ECFDF5', label: '¡Meta lograda!' },
  GENERAL:           { icon: '🔔', color: COLORS.primary, bg: '#EFF6FF', label: 'Recordatorio' },
};

const formatDate = (d) => {
  const now = new Date();
  const date = new Date(d);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
};

export default function AlertsScreen({ navigation }) {
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await alertService.getAlerts();
      setAlerts(data.alerts);
      setUnreadCount(data.unreadCount);
    } catch { Alert.alert('Error', 'No se pudieron cargar las alertas'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMarkAllRead = async () => {
    await alertService.markAllRead();
    load();
  };

  const handleMarkRead = async (id) => {
    await alertService.markRead(id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    setUnreadCount(prev => Math.max(prev - 1, 0));
  };

  const handleDelete = (id) => {
    Alert.alert('Eliminar alerta', '¿Seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await alertService.deleteAlert(id); load(); } },
    ]);
  };

  const renderItem = ({ item }) => {
    const cfg = ALERT_CONFIG[item.type] || ALERT_CONFIG.GENERAL;
    return (
      <TouchableOpacity
        style={[styles.alertCard, !item.read && styles.alertCardUnread, { borderLeftColor: cfg.color }]}
        onPress={() => !item.read && handleMarkRead(item.id)}
        onLongPress={() => handleDelete(item.id)}
      >
        <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
          <Text style={styles.alertIcon}>{cfg.icon}</Text>
        </View>
        <View style={styles.alertContent}>
          <View style={styles.alertHeader}>
            <Text style={[styles.alertTitle, !item.read && styles.alertTitleUnread]}>{item.title}</Text>
            {!item.read && <View style={[styles.unreadDot, { backgroundColor: cfg.color }]} />}
          </View>
          <Text style={styles.alertMessage}>{item.message}</Text>
          <Text style={styles.alertDate}>{formatDate(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Alertas</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadBadge}>{unreadCount} sin leer</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
              <Text style={styles.markAllText}>Leer todo</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.budgetsBtn}
            onPress={() => navigation.navigate('Budgets')}
          >
            <Text style={styles.budgetsBtnText}>💰 Presupuestos</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={alerts}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyText}>Sin alertas por ahora</Text>
              <Text style={styles.emptySub}>Te avisaremos cuando haya algo importante</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingTop: 56 },
  title: { fontSize: FONTS.size.xl, fontWeight: 'bold', color: COLORS.text },
  unreadBadge: { fontSize: FONTS.size.xs, color: '#EF4444', fontWeight: '600', marginTop: 2 },
  headerActions: { alignItems: 'flex-end', gap: 8 },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: COLORS.primary + '15' },
  markAllText: { color: COLORS.primary, fontSize: FONTS.size.xs, fontWeight: '600' },
  budgetsBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: COLORS.primary },
  budgetsBtnText: { color: COLORS.white, fontSize: FONTS.size.xs, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  alertCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 10,
    flexDirection: 'row', borderLeftWidth: 4, elevation: 1,
  },
  alertCardUnread: { backgroundColor: '#FAFBFF' },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  alertIcon: { fontSize: 22 },
  alertContent: { flex: 1 },
  alertHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  alertTitle: { fontSize: FONTS.size.sm, fontWeight: '600', color: COLORS.textLight, flex: 1 },
  alertTitleUnread: { color: COLORS.text, fontWeight: 'bold' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
  alertMessage: { fontSize: FONTS.size.sm, color: COLORS.text, marginTop: 3, lineHeight: 18 },
  alertDate: { fontSize: FONTS.size.xs, color: COLORS.textLight, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyText: { fontSize: FONTS.size.md, fontWeight: '600', color: COLORS.text },
  emptySub: { fontSize: FONTS.size.sm, color: COLORS.textLight, marginTop: 4, textAlign: 'center' },
});
