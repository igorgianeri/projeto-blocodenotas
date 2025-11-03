import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from './theme';
import LogoWood from './components/LogoWood';

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cerne</Text>
        <Text style={styles.subtitle}>Suas ideias, anotações e desenhos em um só lugar</Text>
      </View>

      <View style={styles.imageContainer}>
        <LogoWood size={220} />
      </View>

      <View style={styles.buttonContainer}>
        <Pressable 
          style={[styles.button, styles.loginButton]} 
          onPress={() => router.push('/login')}
        >
          <Text style={[styles.buttonText, styles.loginText]}>Fazer Login</Text>
        </Pressable>

        <Pressable 
          style={[styles.button, styles.registerButton]} 
          onPress={() => router.push('/register')}
        >
          <Text style={[styles.buttonText, styles.registerText]}>Criar Conta</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  backgroundColor: colors.background,
    padding: 20,
  },
  header: {
    marginTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
  color: colors.primary,
  },
  subtitle: {
    fontSize: 16,
  color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    marginHorizontal: 20,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 40,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
  backgroundColor: colors.primary,
  },
  loginText: {
  color: colors.white,
  },
  registerButton: {
  backgroundColor: colors.surface,
  borderWidth: 2,
  borderColor: colors.primary,
  },
  registerText: {
  color: colors.primary,
  },
});