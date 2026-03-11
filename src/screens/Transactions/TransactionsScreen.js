import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';
import { transactionService } from '../../services/transactionService';
import useTransactionStore from '../../store/transactionStore';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);

const formatDate = (date) =>
  new Date(date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

export default function TransactionsScreen({ navigation }) {
  const { transactions, setTransactions, removeTransaction } = useTransactionStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL'); // ALL | INCOME | EXPENSE

  const loadTransactions = useCallback(async () => {
    try {
      const params = filter !== 'ALL' ? { type: filter } : {};
      const data = await transactionService.getTransactions(params);
      setTransactions(data.transactions);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las transacciones');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const onRefresh = () => { setRefreshing(true); loadTransactions(); };

  const handleDelete = (id) => {
    Alert.alert('Eliminar', '¿Estás seguro de eliminar esta transacción?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            await transactionService.deleteTransaction(id);
            removeTransaction(id);
          } catch {
            Alert.alert('Error', 'No se pudo eliminar la transacción');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onLongPress={() => handleDelete(item.id)}
    >
      <View style={[styles.iconBox, { backgroundColor: item.category?.color + '20' ?? '#f3f4f6' }]}>
        <Text style={styles.itemIcon}>{item.category?.icon ?? '💰'}</Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{item.description || item.category?.name || 'Sin descripción'}</Text>
        <Text style={styles.itemDate}>{formatDate(item.date)}</Text>
      </View>
      <Text style={[styles.itemAmount, { color: item.type === 'INCOME' ? COLORS.secondary : COLORS.danger }]}>
        {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(item.amount)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Transacciones</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('NewTransaction')}
        >
          <Text style={styles.addButtonText}>+ Nueva</Text>
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      <View style={styles.filters}>
        {['ALL', 'INCOME', 'EXPENSE'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'ALL' ? 'Todos' : f === 'INCOME' ? 'Ingresos' : 'Gastos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No hay transacciones aún</Text>
              <Text style={styles.emptySubtext}>Toca "+ Nueva" para agregar una</Text>
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
  addButton: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: FONTS.size.sm },
  filters: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: FONTS.size.sm, color: COLORS.textLight },
  filterTextActive: { color: COLORS.white, fontWeight: 'bold' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 10, elevation: 1 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemIcon: { fontSize: 22 },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: FONTS.size.sm, fontWeight: '600', color: COLORS.text },
  itemDate: { fontSize: FONTS.size.xs, color: COLORS.textLight, marginTop: 2 },
  itemAmount: { fontSize: FONTS.size.md, fontWeight: 'bold' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: FONTS.size.md, fontWeight: '600', color: COLORS.text },
  emptySubtext: { fontSize: FONTS.size.sm, color: COLORS.textLight, marginTop: 4 },
});
