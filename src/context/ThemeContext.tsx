import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  colors: typeof lightColors | typeof darkColors;
}

const lightColors = {
  // Backgrounds
  primary: '#F8FAFC',
  secondary: '#FFFFFF',
  tertiary: '#F1F5F9',
  
  // Text
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  
  // Borders
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  
  // Buttons
  buttonPrimary: '#6366F1',
  buttonSecondary: '#F1F5F9',
  buttonDanger: '#EF4444',
  buttonSuccess: '#10B981',
  
  // Cards
  card: '#FFFFFF',
  cardShadow: 'rgba(0, 0, 0, 0.1)',
  
  // Status
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#6366F1',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.3)',
  
  // Icons
  icon: '#64748B',
  iconPrimary: '#6366F1',
};

const darkColors = {
  // Backgrounds
  primary: '#0F172A',
  secondary: '#1E293B',
  tertiary: '#334155',
  
  // Text
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  
  // Borders
  border: '#334155',
  borderLight: '#475569',
  
  // Buttons
  buttonPrimary: '#6366F1',
  buttonSecondary: '#334155',
  buttonDanger: '#EF4444',
  buttonSuccess: '#10B981',
  
  // Cards
  card: '#1E293B',
  cardShadow: 'rgba(0, 0, 0, 0.3)',
  
  // Status
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#6366F1',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Icons
  icon: '#CBD5E1',
  iconPrimary: '#6366F1',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const colors = theme === 'dark' ? darkColors : lightColors;
  const isDark = theme === 'dark';

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    isDark,
    colors,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 