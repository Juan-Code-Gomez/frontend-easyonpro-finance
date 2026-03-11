import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert, ScrollView,
} from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';
import { authService } from '../../services/authService';
import useAuthStore from '../../store/authStore';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      return Alert.alert('Campos requeridos', 'Por favor completa todos los campos');
    }
    if (password !== confirmPassword) {
      return Alert.alert('Error', 'Las contraseñas no coinciden');
    }
    if (password.length < 6) {
      return Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
    }
    try {
      setLoading(true);
      const data = await authService.register(name.trim(), email.trim().toLowerCase(), password);
      setAuth(data.user, data.token);
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al crear la cuenta';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>💰</Text>
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>Empieza a manejar tus finanzas</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Nombre completo</Text>
          <TextInput
            style={styles.input}
            placeholder="Juan Pérez"
            placeholderTextColor={COLORS.textLight}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={styles.input}
            placeholder="tu@correo.com"
            placeholderTextColor={COLORS.textLight}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={COLORS.textLight}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={styles.label}>Confirmar contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Repite tu contraseña"
            placeholderTextColor={COLORS.textLight}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Crear cuenta</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>
              ¿Ya tienes cuenta? <Text style={styles.linkBold}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: { fontSize: 56, marginBottom: 8 },
  title: { fontSize: FONTS.size.xl, fontWeight: 'bold', color: COLORS.primary, marginBottom: 4 },
  subtitle: { fontSize: FONTS.size.sm, color: COLORS.textLight, marginBottom: 32 },
  form: { width: '100%', maxWidth: 400 },
  label: { fontSize: FONTS.size.sm, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14,
    fontSize: FONTS.size.md,
    color: COLORS.text,
    marginBottom: 16,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  buttonText: { color: COLORS.white, fontSize: FONTS.size.md, fontWeight: 'bold' },
  linkText: { textAlign: 'center', color: COLORS.textLight, fontSize: FONTS.size.sm },
  linkBold: { color: COLORS.primary, fontWeight: 'bold' },
});
