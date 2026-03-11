import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert, ScrollView,
} from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';
import { authService } from '../../services/authService';
import useAuthStore from '../../store/authStore';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return Alert.alert('Campos requeridos', 'Ingresa tu correo y contraseña');
    }
    try {
      setLoading(true);
      const data = await authService.login(email.trim().toLowerCase(), password);
      setAuth(data.user, data.token);
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al iniciar sesión';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>💰</Text>
        <Text style={styles.title}>EasyOnPro Finance</Text>
        <Text style={styles.subtitle}>Inicia sesión en tu cuenta</Text>

        <View style={styles.form}>
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
            placeholder="••••••••"
            placeholderTextColor={COLORS.textLight}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>
              ¿No tienes cuenta? <Text style={styles.linkBold}>Regístrate</Text>
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
  forgotText: {
    color: COLORS.primary,
    fontSize: FONTS.size.sm,
    textAlign: 'right',
    marginBottom: 24,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: { color: COLORS.white, fontSize: FONTS.size.md, fontWeight: 'bold' },
  linkText: { textAlign: 'center', color: COLORS.textLight, fontSize: FONTS.size.sm },
  linkBold: { color: COLORS.primary, fontWeight: 'bold' },
});
