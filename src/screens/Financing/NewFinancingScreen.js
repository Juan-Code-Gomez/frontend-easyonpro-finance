import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';
import { financingService } from '../../services/financeService';

const formatCurrency = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

const ITEM_TYPES = ['Celular', 'Oro', 'Dinero', 'Electrodoméstico', 'Otro'];

export default function NewFinancingScreen({ navigation, route }) {
  const onCreated = route.params?.onCreated;
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemType, setItemType] = useState('Celular');
  const [capital, setCapital] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [installments, setInstallments] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const handleCalculate = async () => {
    if (!capital || !interestRate || !installments) return Alert.alert('Error', 'Ingresa capital, tasa y cuotas para calcular');
    try {
      setCalculating(true);
      const result = await financingService.calculate(parseFloat(capital), parseFloat(interestRate), parseInt(installments));
      setPreview(result);
    } catch { Alert.alert('Error', 'No se pudo calcular'); }
    finally { setCalculating(false); }
  };

  const handleSave = async () => {
    if (!clientName || !itemDescription || !capital || !interestRate || !installments)
      return Alert.alert('Error', 'Completa todos los campos obligatorios');
    try {
      setLoading(true);
      await financingService.createFinancing({ clientName, clientPhone, itemDescription, itemType, capital, interestRate, installments });
      onCreated?.();
      Alert.alert('✅', 'Financiamiento creado', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo guardar');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Volver</Text></TouchableOpacity>
          <Text style={styles.title}>Nuevo Financiamiento</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Cliente */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>👤 Datos del cliente</Text>
          <Text style={styles.label}>Nombre del cliente *</Text>
          <TextInput style={styles.input} placeholder="Pedro Gómez" placeholderTextColor={COLORS.textLight} value={clientName} onChangeText={setClientName} />
          <Text style={styles.label}>Teléfono (opcional)</Text>
          <TextInput style={styles.input} placeholder="3001234567" placeholderTextColor={COLORS.textLight} value={clientPhone} onChangeText={setClientPhone} keyboardType="phone-pad" />
        </View>

        {/* Item */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📦 ¿Qué se financia?</Text>
          <Text style={styles.label}>Descripción *</Text>
          <TextInput style={styles.input} placeholder="iPhone 14 Pro, 1gr oro 18k..." placeholderTextColor={COLORS.textLight} value={itemDescription} onChangeText={setItemDescription} />
          <Text style={styles.label}>Tipo</Text>
          <View style={styles.typeRow}>
            {ITEM_TYPES.map(t => (
              <TouchableOpacity key={t} style={[styles.typeChip, itemType === t && styles.typeChipActive]} onPress={() => setItemType(t)}>
                <Text style={[styles.typeText, itemType === t && styles.typeTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Términos financieros */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>💰 Términos del financiamiento</Text>
          <Text style={styles.label}>Capital financiado *</Text>
          <TextInput style={styles.input} placeholder="0" placeholderTextColor={COLORS.textLight} value={capital} onChangeText={(v) => { setCapital(v); setPreview(null); }} keyboardType="numeric" />
          <Text style={styles.label}>Tasa de interés mensual (%) *</Text>
          <TextInput style={styles.input} placeholder="10" placeholderTextColor={COLORS.textLight} value={interestRate} onChangeText={(v) => { setInterestRate(v); setPreview(null); }} keyboardType="numeric" />
          <Text style={styles.label}>Número de cuotas *</Text>
          <TextInput style={styles.input} placeholder="6" placeholderTextColor={COLORS.textLight} value={installments} onChangeText={(v) => { setInstallments(v); setPreview(null); }} keyboardType="numeric" />

          <TouchableOpacity style={styles.calcBtn} onPress={handleCalculate} disabled={calculating}>
            {calculating ? <ActivityIndicator color={COLORS.primary} /> : <Text style={styles.calcBtnText}>🧮 Calcular cuotas</Text>}
          </TouchableOpacity>
        </View>

        {/* Preview */}
        {preview && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>📊 Resumen del financiamiento</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Valor cuota</Text>
              <Text style={styles.previewValue}>{formatCurrency(preview.installmentAmount)}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Total a recibir</Text>
              <Text style={styles.previewValue}>{formatCurrency(preview.totalAmount)}</Text>
            </View>
            <View style={[styles.previewRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.previewLabel}>Tu ganancia 🎉</Text>
              <Text style={[styles.previewValue, { color: COLORS.secondary, fontSize: FONTS.size.lg }]}>{formatCurrency(preview.totalInterest)}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={[styles.saveBtn, !preview && { opacity: 0.6 }]} onPress={handleSave} disabled={loading || !preview}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>Crear financiamiento</Text>}
        </TouchableOpacity>
        {!preview && <Text style={styles.hint}>Calcula primero para habilitar el botón de guardar</Text>}
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56 },
  back: { color: COLORS.primary, fontSize: FONTS.size.sm, width: 60 },
  title: { fontSize: FONTS.size.md, fontWeight: 'bold', color: COLORS.text },
  card: { marginHorizontal: 16, backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: FONTS.size.md, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  label: { fontSize: FONTS.size.sm, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 8 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, fontSize: FONTS.size.md, color: COLORS.text },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeText: { fontSize: FONTS.size.xs, color: COLORS.textLight },
  typeTextActive: { color: COLORS.white, fontWeight: 'bold' },
  calcBtn: { marginTop: 16, backgroundColor: COLORS.primary + '15', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary },
  calcBtnText: { color: COLORS.primary, fontWeight: 'bold', fontSize: FONTS.size.sm },
  previewCard: { marginHorizontal: 16, backgroundColor: '#ECFDF5', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.secondary + '40' },
  previewTitle: { fontSize: FONTS.size.md, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.secondary + '20' },
  previewLabel: { fontSize: FONTS.size.sm, color: COLORS.textLight },
  previewValue: { fontSize: FONTS.size.md, fontWeight: 'bold', color: COLORS.text },
  saveBtn: { marginHorizontal: 16, backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  saveBtnText: { color: COLORS.white, fontSize: FONTS.size.md, fontWeight: 'bold' },
  hint: { textAlign: 'center', color: COLORS.textLight, fontSize: FONTS.size.xs, marginTop: 8 },
});
