import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import TransactionsScreen from '../screens/Transactions/TransactionsScreen';
import FinancingsScreen from '../screens/Financing/FinancingsScreen';
import DebtsScreen from '../screens/Debts/DebtsScreen';
import SavingsScreen from '../screens/Savings/SavingsScreen';
import ReportsScreen from '../screens/Reports/ReportsScreen';

const Tab = createBottomTabNavigator();

const TabIcon = ({ emoji, focused }) => (
  <Text style={{ fontSize: focused ? 24 : 20 }}>{emoji}</Text>
);

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          paddingBottom: 8,
          paddingTop: 6,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: FONTS.size.xs,
          fontWeight: '600',
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen}
        options={{ tabBarLabel: 'Inicio', tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} /> }} />
      <Tab.Screen name="Transactions" component={TransactionsScreen}
        options={{ tabBarLabel: 'Gastos', tabBarIcon: ({ focused }) => <TabIcon emoji="💳" focused={focused} /> }} />
      <Tab.Screen name="Debts" component={DebtsScreen}
        options={{ tabBarLabel: 'Deudas', tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} /> }} />
      <Tab.Screen name="Financings" component={FinancingsScreen}
        options={{ tabBarLabel: 'Financiam.', tabBarIcon: ({ focused }) => <TabIcon emoji="📦" focused={focused} /> }} />
      <Tab.Screen name="Savings" component={SavingsScreen}
        options={{ tabBarLabel: 'Ahorros', tabBarIcon: ({ focused }) => <TabIcon emoji="🏦" focused={focused} /> }} />
      <Tab.Screen name="Reports" component={ReportsScreen}
        options={{ tabBarLabel: 'Reportes', tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

