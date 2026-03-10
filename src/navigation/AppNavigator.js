import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens (se irán agregando por fase)
// import LoginScreen from '../screens/Auth/LoginScreen';
// import MainTabs from './MainTabs';

import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator();

// Pantalla placeholder hasta la Fase 1
const PlaceholderScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>EasyOnPro Finance 💰</Text>
    <Text style={styles.subtitle}>Setup completado ✅</Text>
    <Text style={styles.subtitle}>Fase 1: Autenticación próximamente...</Text>
  </View>
);

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={PlaceholderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
  },
});
