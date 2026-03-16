import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';
import { debtService } from '../../services/financeService';

export default function NewDebtScreen({ navigation, route }) {
  const onCreated = route.params?.onCreated;
  const [creditor, setCreditor] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!creditor.trim() || !totalAmount) return Alert.alert('Error', 'Acreedor y monto total son requeridos');
    try {
      setLoading(true);
      await debtService.createDebt({ creditor, description, totalAmount, monthlyPayment: monthlyPayment || null, dueDate: dueDate || null });
      onCreated?.();
      Alert.alert('✅', 'Deuda registrada', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo guardar');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Volver</Text></TouchableOpacity>
          <Text style={styles.title}>Nueva Deuda</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>¿A quién le debes? *</Text>
          <TextInput style={styles.input} placeholder="Banco, persona, etc." placeholderTextColor={COLORS.textLight} value={creditor} onChangeText={setCreditor} />

          <Text style={styles.label}>Descripción (opcional)</Text>
          <TextInput style={styles.input} placeholder="Crédito vehículo, préstamo..." placeholderTextColor={COLORS.textLight} value={description} onChangeText={setDescription} />

          <Text style={styles.label}>Monto total de la deuda *</Text>
          <TextInput style={styles.input} placeholder="0" placeholderTextColor={COLORS.textLight} value={totalAmount} onChangeText={setTotalAmount} keyboardType="numeric" />

          <Text style={styles.label}>Cuota mensual (opcional)</Text>
          <TextInput style={styles.input} placeholder="0" placeholderTextColor={COLORS.textLight} value={monthlyPayment} onChangeText={setMonthlyPayment} keyboardType="numeric" />

          <Text style={styles.label}>Fecha límite (opcional, YYYY-MM-DD)</Text>
          <TextInput style={styles.input} placeholder="2026-12-31" placeholderTextColor={COLORS.textLight} value={dueDate} onChangeText={setDueDate} />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>Guardar deuda</Text>}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56 },
  back: { color: COLORS.primary, fontSize: FONTS.size.sm, width: 60 },
  title: { fontSize: FONTS.size.lg, fontWeight: 'bold', color: COLORS.text },
  card: { marginHorizontal: 16, backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 16 },
  label: { fontSize: FONTS.size.sm, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 8 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, fontSize: FONTS.size.md, color: COLORS.text },
  saveBtn: { marginHorizontal: 16, backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  saveBtnText: { color: COLORS.white, fontSize: FONTS.size.md, fontWeight: 'bold' },
});
