import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';
import { savingsService } from '../../services/savingsService';

const ICONS = ['🎯', '🏠', '✈️', '🚗', '📱', '💻', '🎓', '💍', '🏖️', '🏋️', '🎮', '💰'];

export default function NewSavingsScreen({ navigation, route }) {
  const onCreated = route.params?.onCreated;
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [initialDeposit, setInitialDeposit] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !targetAmount) return Alert.alert('Error', 'Nombre y monto objetivo son requeridos');
    try {
      setLoading(true);
      await savingsService.createGoal({ name, icon, targetAmount, targetDate: targetDate || null, initialDeposit: initialDeposit || null });
      onCreated?.();
      Alert.alert('✅', '¡Meta de ahorro creada!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo guardar');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Volver</Text></TouchableOpacity>
          <Text style={styles.title}>Nueva Meta de Ahorro</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Ícono */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Elige un ícono para tu meta</Text>
          <View style={styles.iconGrid}>
            {ICONS.map(ic => (
              <TouchableOpacity key={ic} style={[styles.iconOption, icon === ic && styles.iconOptionActive]} onPress={() => setIcon(ic)}>
                <Text style={styles.iconText}>{ic}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Detalles */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📝 Detalles de la meta</Text>

          <Text style={styles.label}>¿Para qué estás ahorrando? *</Text>
          <TextInput style={styles.input} placeholder="Vacaciones, carro, emergencias..." placeholderTextColor={COLORS.textLight} value={name} onChangeText={setName} />

          <Text style={styles.label}>¿Cuánto necesitas? *</Text>
          <TextInput style={styles.input} placeholder="0" placeholderTextColor={COLORS.textLight} value={targetAmount} onChangeText={setTargetAmount} keyboardType="numeric" />

          <Text style={styles.label}>¿Cuándo lo quieres lograr? (opcional, YYYY-MM-DD)</Text>
          <TextInput style={styles.input} placeholder="2026-12-31" placeholderTextColor={COLORS.textLight} value={targetDate} onChangeText={setTargetDate} />

          <Text style={styles.label}>Depósito inicial (opcional)</Text>
          <TextInput style={styles.input} placeholder="0" placeholderTextColor={COLORS.textLight} value={initialDeposit} onChangeText={setInitialDeposit} keyboardType="numeric" />
        </View>

        {/* Preview */}
        {targetAmount ? (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>{icon} {name || 'Mi meta'}</Text>
            {initialDeposit ? (
              <Text style={styles.previewSub}>
                Empezarás con {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(parseFloat(initialDeposit) || 0)} de {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(parseFloat(targetAmount) || 0)} ({Math.round((parseFloat(initialDeposit) / parseFloat(targetAmount)) * 100)}%)
              </Text>
            ) : (
              <Text style={styles.previewSub}>Objetivo: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(parseFloat(targetAmount) || 0)}</Text>
            )}
          </View>
        ) : null}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>Crear meta de ahorro</Text>}
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
  title: { fontSize: FONTS.size.md, fontWeight: 'bold', color: COLORS.text },
  card: { marginHorizontal: 16, backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: FONTS.size.md, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconOption: { width: 52, height: 52, borderRadius: 14, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  iconOptionActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '15' },
  iconText: { fontSize: 26 },
  label: { fontSize: FONTS.size.sm, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 8 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, fontSize: FONTS.size.md, color: COLORS.text },
  previewCard: { marginHorizontal: 16, backgroundColor: '#EFF6FF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.primary + '40' },
  previewTitle: { fontSize: FONTS.size.lg, fontWeight: 'bold', color: COLORS.text },
  previewSub: { fontSize: FONTS.size.sm, color: COLORS.textLight, marginTop: 4 },
  saveBtn: { marginHorizontal: 16, backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  saveBtnText: { color: COLORS.white, fontSize: FONTS.size.md, fontWeight: 'bold' },
});
