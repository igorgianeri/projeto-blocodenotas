import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import AnimatedInput from './components/AnimatedInput';
import { useRouter } from 'expo-router';
import { colors } from './theme';
import { loginWithEmail } from '../firebase.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    try {
      setLoading(true);
      const result = await loginWithEmail(email.trim(), password);
      if (result) {
        await AsyncStorage.setItem('@cerne_remember', remember ? '1' : '0');
        router.replace('/home');
      }
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Entrar</Text>
      <AnimatedInput 
        label="E-mail" 
        value={email} 
        onChangeText={setEmail} 
        keyboardType="email-address"
        style={{ textAlignVertical: 'center' }}
      />

      <View style={{ width: '100%', position: 'relative' }}>
        <AnimatedInput 
          label="Senha" 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry={!showPassword} 
          style={{ textAlignVertical: 'center' }}
        />
        <Pressable style={styles.eye} onPress={() => setShowPassword(s => !s)}>
          <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={20} color="#333" />
        </Pressable>
      </View>

      <View style={styles.row}>
        <Pressable onPress={() => setRemember(r => !r)}>
          <Text>{remember ? '☑' : '☐'}</Text>
        </Pressable>
        <Text style={{ marginLeft: 8 }}>Manter-me Conectado</Text>
      </View>

      <Pressable 
        style={[
          styles.button, 
          loading && styles.buttonDisabled
        ]} 
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center', backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  eye: { position: 'absolute', right: 12, top: 14, height: 20, justifyContent: 'center' },
  button: { 
    marginTop: 18, 
    backgroundColor: colors.primary, 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  buttonDisabled: {
    opacity: 0.7
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    textAlignVertical: 'center',
  },
});