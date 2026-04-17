import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';

import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import NewTransactionScreen from '../screens/Transactions/NewTransactionScreen';
import NewDebtScreen from '../screens/Debts/NewDebtScreen';
import NewFinancingScreen from '../screens/Financing/NewFinancingScreen';
import FinancingDetailScreen from '../screens/Financing/FinancingDetailScreen';
import NewSavingsScreen from '../screens/Savings/NewSavingsScreen';
import SavingsDetailScreen from '../screens/Savings/SavingsDetailScreen';
import BudgetsScreen from '../screens/Budgets/BudgetsScreen';
import AlertsScreen from '../screens/Alerts/AlertsScreen';
import MainTabs from './MainTabs';
import { COLORS } from '../constants/theme';
import useAuthStore from '../store/authStore';
import { authService } from '../services/authService';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, setAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { token, user } = await authService.getStoredSession();
        if (token && user) setAuth(user, token);
      } catch {
        // Sin sesión guardada
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="NewTransaction" component={NewTransactionScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="NewDebt" component={NewDebtScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="NewFinancing" component={NewFinancingScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="FinancingDetail" component={FinancingDetailScreen} />
            <Stack.Screen name="NewSavings" component={NewSavingsScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="SavingsDetail" component={SavingsDetailScreen} />
            <Stack.Screen name="Budgets" component={BudgetsScreen} />
            <Stack.Screen name="AlertsStack" component={AlertsScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
