import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';
import { transactionService, categoryService } from '../../services/transactionService';
import useTransactionStore from '../../store/transactionStore';

export default function NewTransactionScreen({ navigation }) {
  const { addTransaction } = useTransactionStore();
  const [type, setType] = useState('EXPENSE');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await categoryService.getCategories(type);
        setCategories(data.categories);
        setSelectedCategory(null);
      } catch {
        Alert.alert('Error', 'No se pudieron cargar las categorías');
      } finally {
        setLoadingCats(false);
      }
    };
    loadCategories();
  }, [type]);

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0)
      return Alert.alert('Error', 'Ingresa un monto válido');

    try {
      setLoading(true);
      const data = await transactionService.createTransaction({
        amount: parseFloat(amount),
        description: description.trim() || null,
        type,
        categoryId: selectedCategory?.id || null,
      });
      addTransaction(data.transaction);
      Alert.alert('✅ Guardado', 'Transacción registrada exitosamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Nueva Transacción</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Tipo */}
        <View style={styles.typeRow}>
          {['EXPENSE', 'INCOME'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeChip, type === t && (t === 'EXPENSE' ? styles.expenseActive : styles.incomeActive)]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.typeText, type === t && styles.typeTextActive]}>
                {t === 'EXPENSE' ? '📉 Gasto' : '📈 Ingreso'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Monto */}
        <View style={styles.card}>
          <Text style={styles.label}>Monto</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0"
            placeholderTextColor={COLORS.textLight}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </View>

        {/* Descripción */}
        <View style={styles.card}>
          <Text style={styles.label}>Descripción (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Mercado del mes..."
            placeholderTextColor={COLORS.textLight}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Categorías */}
        <View style={styles.card}>
          <Text style={styles.label}>Categoría</Text>
          {loadingCats ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    selectedCategory?.id === cat.id && { backgroundColor: cat.color + '30', borderColor: cat.color },
                  ]}
                  onPress={() => setSelectedCategory(selectedCategory?.id === cat.id ? null : cat)}
                >
                  <Text style={styles.catIcon}>{cat.icon}</Text>
                  <Text style={[styles.catName, selectedCategory?.id === cat.id && { color: cat.color, fontWeight: 'bold' }]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Guardar */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveText}>Guardar transacción</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56 },
  backText: { color: COLORS.primary, fontSize: FONTS.size.sm, width: 60 },
  title: { fontSize: FONTS.size.lg, fontWeight: 'bold', color: COLORS.text },
  typeRow: { flexDirection: 'row', marginHorizontal: 16, gap: 12, marginBottom: 16 },
  typeChip: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.white, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  expenseActive: { backgroundColor: COLORS.danger + '15', borderColor: COLORS.danger },
  incomeActive: { backgroundColor: COLORS.secondary + '15', borderColor: COLORS.secondary },
  typeText: { fontSize: FONTS.size.sm, color: COLORS.textLight, fontWeight: '600' },
  typeTextActive: { color: COLORS.text },
  card: { marginHorizontal: 16, backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12 },
  label: { fontSize: FONTS.size.sm, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  amountInput: { fontSize: 36, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', paddingVertical: 8 },
  input: { fontSize: FONTS.size.md, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, gap: 4 },
  catIcon: { fontSize: 16 },
  catName: { fontSize: FONTS.size.xs, color: COLORS.textLight },
  saveButton: { marginHorizontal: 16, backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  saveText: { color: COLORS.white, fontSize: FONTS.size.md, fontWeight: 'bold' },
});
