import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, Modal, TextInput,
} from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';
import { alertService } from '../../services/alertService';
import { categoryService } from '../../services/transactionService';

const formatCurrency = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export default function BudgetsScreen({ navigation }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [budgetData, catData] = await Promise.all([
        alertService.getBudgets(month, year),
        categoryService.getCategories('EXPENSE'),
      ]);
      setBudgets(budgetData.budgets);
      const budgetedIds = new Set(budgetData.budgets.map(b => b.categoryId));
      const expenseCats = (Array.isArray(catData) ? catData : catData.categories || []).filter(c => !budgetedIds.has(c.id));
      setCategories(expenseCats);
    } catch (e) { Alert.alert('Error', 'No se pudieron cargar los presupuestos'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!selectedCategory || !budgetAmount) return Alert.alert('Error', 'Selecciona categoría y monto');
    try {
      setSaving(true);
      await alertService.createBudget({ categoryId: selectedCategory.id, amount: parseFloat(budgetAmount), month, year });
      setModalVisible(false);
      setSelectedCategory(null);
      setBudgetAmount('');
      load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo guardar');
    } finally { setSaving(false); }
  };

  const handleDelete = (id, name) => {
    Alert.alert(`Eliminar presupuesto`, `¿Eliminar límite de "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await alertService.deleteBudget(id); load(); } },
    ]);
  };

  const getBarColor = (pct) => {
    if (pct >= 100) return '#EF4444';
    if (pct >= 80) return '#F59E0B';
    return COLORS.secondary;
  };

  const renderBudget = ({ item }) => {
    const barColor = getBarColor(item.percentage);
    const width = Math.min(item.percentage, 100);
    return (
      <TouchableOpacity style={styles.card} onLongPress={() => handleDelete(item.id, item.category.name)}>
        <View style={styles.cardHeader}>
          <View style={[styles.catIcon, { backgroundColor: item.category.color + '20' }]}>
            <Text style={styles.catEmoji}>{item.category.icon}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.catName}>{item.category.name}</Text>
            <Text style={styles.catSub}>Límite: {formatCurrency(item.amount)}</Text>
          </View>
          <View>
            <Text style={[styles.percentage, { color: barColor }]}>{item.percentage}%</Text>
          </View>
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Gastado: {formatCurrency(item.spent)}</Text>
          <Text style={styles.progressLabel}>Disponible: {formatCurrency(Math.max(item.amount - item.spent, 0))}</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${width}%`, backgroundColor: barColor }]} />
        </View>
        {item.percentage >= 100 && (
          <Text style={styles.warningText}>🚨 Presupuesto excedido en {formatCurrency(item.spent - item.amount)}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Volver</Text></TouchableOpacity>
          <Text style={styles.title}>Presupuestos</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.addBtnText}>+ Nuevo</Text>
          </TouchableOpacity>
        </View>

        {/* Selector de mes */}
        <View style={styles.monthSelector}>
          {MONTHS.map((m, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.monthChip, month === idx + 1 && styles.monthChipActive]}
              onPress={() => setMonth(idx + 1)}
            >
              <Text style={[styles.monthText, month === idx + 1 && styles.monthTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} /> : (
          <FlatList
            data={budgets}
            keyExtractor={i => i.id}
            renderItem={renderBudget}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[COLORS.primary]} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>💰</Text>
                <Text style={styles.emptyText}>Sin presupuestos para {MONTHS[month - 1]}</Text>
                <Text style={styles.emptySub}>Toca "+ Nuevo" para controlar tus gastos</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Modal nuevo presupuesto */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>💰 Nuevo presupuesto</Text>
            <Text style={styles.modalSub}>{MONTHS[month - 1]} {year}</Text>

            <Text style={styles.modalLabel}>Categoría de gasto</Text>
            {categories.length === 0 ? (
              <Text style={styles.noCats}>Todas las categorías ya tienen presupuesto este mes</Text>
            ) : (
              <View style={styles.catGrid}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catChip, selectedCategory?.id === cat.id && styles.catChipActive]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={styles.catChipIcon}>{cat.icon}</Text>
                    <Text style={[styles.catChipText, selectedCategory?.id === cat.id && styles.catChipTextActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.modalLabel}>Límite mensual</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="0"
              placeholderTextColor={COLORS.textLight}
              value={budgetAmount}
              onChangeText={setBudgetAmount}
              keyboardType="numeric"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); setSelectedCategory(null); setBudgetAmount(''); }}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleSave} disabled={saving}>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56 },
  back: { color: COLORS.primary, fontSize: FONTS.size.sm, width: 60 },
  title: { fontSize: FONTS.size.lg, fontWeight: 'bold', color: COLORS.text },
  addBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  addBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: FONTS.size.xs },
  monthSelector: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12, flexWrap: 'nowrap' },
  monthChip: { paddingHorizontal: 10, paddingVertical: 6, marginHorizontal: 2, borderRadius: 16, backgroundColor: COLORS.background },
  monthChipActive: { backgroundColor: COLORS.primary },
  monthText: { fontSize: FONTS.size.xs, color: COLORS.textLight },
  monthTextActive: { color: COLORS.white, fontWeight: 'bold' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  catIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  catEmoji: { fontSize: 22 },
  cardInfo: { flex: 1 },
  catName: { fontSize: FONTS.size.md, fontWeight: 'bold', color: COLORS.text },
  catSub: { fontSize: FONTS.size.xs, color: COLORS.textLight, marginTop: 2 },
  percentage: { fontSize: FONTS.size.lg, fontWeight: 'bold' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: FONTS.size.xs, color: COLORS.textLight },
  progressBar: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  warningText: { fontSize: FONTS.size.xs, color: '#EF4444', marginTop: 8, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: FONTS.size.md, fontWeight: '600', color: COLORS.text },
  emptySub: { fontSize: FONTS.size.sm, color: COLORS.textLight, marginTop: 4, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: FONTS.size.lg, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  modalSub: { fontSize: FONTS.size.sm, color: COLORS.textLight, marginBottom: 16 },
  modalLabel: { fontSize: FONTS.size.sm, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 12 },
  noCats: { fontSize: FONTS.size.sm, color: COLORS.textLight, textAlign: 'center', paddingVertical: 12 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, gap: 6 },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catChipIcon: { fontSize: 16 },
  catChipText: { fontSize: FONTS.size.xs, color: COLORS.textLight },
  catChipTextActive: { color: COLORS.white, fontWeight: 'bold' },
  modalInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, fontSize: FONTS.size.md, color: COLORS.text },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, backgroundColor: COLORS.background, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  cancelBtnText: { color: COLORS.text, fontWeight: '600' },
  confirmBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  confirmBtnText: { color: COLORS.white, fontWeight: 'bold' },
});
