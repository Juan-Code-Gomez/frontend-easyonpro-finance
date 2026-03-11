import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert, ScrollView,
} from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';
import { authService } from '../../services/authService';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      return Alert.alert('Campo requerido', 'Ingresa tu correo electrónico');
    }
    try {
      setLoading(true);
      await authService.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch {
      Alert.alert('Error', 'No se pudo enviar el correo. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <Text style={styles.logo}>📧</Text>
        <Text style={styles.title}>Revisa tu correo</Text>
        <Text style={styles.description}>
          Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña.
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.buttonText}>Volver al inicio de sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>🔐</Text>
        <Text style={styles.title}>Olvidé mi contraseña</Text>
        <Text style={styles.description}>
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </Text>

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

          <TouchableOpacity style={styles.button} onPress={handleSend} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Enviar enlace</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>← Volver al inicio de sesión</Text>
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
  title: { fontSize: FONTS.size.xl, fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 },
  description: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
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
  },
  buttonText: { color: COLORS.white, fontSize: FONTS.size.md, fontWeight: 'bold' },
  linkText: { textAlign: 'center', color: COLORS.primary, fontSize: FONTS.size.sm },
});
