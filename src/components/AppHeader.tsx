import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface AppHeaderProps {
  onMenuPress: () => void;
  userName?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onMenuPress, userName }) => (
  <View style={styles.header}>
    <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
      <Text style={styles.menuButtonText}>☰</Text>
    </TouchableOpacity>
    <View style={styles.headerContent}>
      <Text style={styles.headerTitle}>RoofRoot</Text>
      {userName && (
        <Text style={styles.userName}>{userName}</Text>
      )}
    </View>
    <View style={{ width: 40 }} />
  </View>
);

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuButtonText: {
    fontSize: 18,
    color: '#374151',
    fontWeight: 'bold',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  userName: {
    fontSize: 14,
    color: '#1E293B',
    opacity: 0.5,
    marginTop: 0,
    fontWeight: '500',
  },
});

export default AppHeader; 