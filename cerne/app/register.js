import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import AnimatedInput from './components/AnimatedInput';
import { useRouter } from 'expo-router';
import { colors } from './theme';
import { registerWithEmail, signOut } from '../firebase.js';
import { Ionicons } from '@expo/vector-icons';

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    try {
      setLoading(true);
      const result = await registerWithEmail(name.trim(), email.trim(), password);
      if (result) {
        // Faz logout imediatamente após criar a conta
        await signOut();
        Alert.alert('Sucesso', 'Conta criada com sucesso! Faça login para continuar.');
        router.replace('/login');
      }
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar Conta</Text>

      <AnimatedInput 
        label="Nome" 
        value={name} 
        onChangeText={setName}
        placeholder="Seu nome completo"
      />
      <AnimatedInput 
        label="E-mail" 
        value={email} 
        onChangeText={setEmail} 
        keyboardType="email-address"
        placeholder="seu@email.com"
      />

      <View style={{ width: '100%', position: 'relative' }}>
        <AnimatedInput 
          label="Senha" 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry={!showPassword}
          placeholder="Mínimo 6 caracteres"
        />
        <Pressable 
          style={styles.eye} 
          onPress={() => setShowPassword(prev => !prev)}
        >
          <Ionicons 
            name={showPassword ? 'eye' : 'eye-off'} 
            size={20} 
            color="#333" 
          />
        </Pressable>
      </View>

      <Pressable 
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Registrando...' : 'Criar Conta'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    alignItems: 'center', 
    backgroundColor: colors.background,
  },
  title: { 
    fontSize: 22, 
    fontWeight: '700', 
    marginBottom: 24,
    marginTop: 40,
    color: colors.text,
  },
  button: { 
    marginTop: 24,
    backgroundColor: colors.primary, 
    paddingVertical: 14,
    paddingHorizontal: 24, 
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.7,
  },
  buttonText: { 
    color: colors.white, 
    fontWeight: '600',
    fontSize: 16,
  },
  eye: { 
    position: 'absolute', 
    right: 12, 
    top: 18,
    padding: 8,
  },
});