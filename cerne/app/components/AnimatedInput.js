import React, { useState, useRef, useEffect } from 'react';
import { Animated, TextInput, View, StyleSheet, Platform } from 'react-native';
import { colors } from '../theme';

const INPUT_HEIGHT = 48; // manter consistente com os outros estilos
const FONT_SIZE = 16;

export default function AnimatedInput({ label, value, onFocus, onBlur, style, placeholder, ...rest }) {
  const [isFocused, setIsFocused] = useState(false);
  const animated = useRef(new Animated.Value(value && value.toString().length ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animated, { toValue: isFocused || (value && value.toString().length ? 1 : 0) ? 1 : 0, duration: 180, useNativeDriver: true }).start();
  }, [isFocused, value, animated]);

  const labelStyle = {
    transform: [
      { translateY: animated.interpolate({ inputRange: [0, 1], outputRange: [0, -28] }) },
      { scale: animated.interpolate({ inputRange: [0, 1], outputRange: [1, 0.85] }) },
    ],
    opacity: animated.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }),
  };

  return (
    <View style={styles.container}>
      <Animated.Text pointerEvents="none" style={[styles.label, labelStyle]}>{label}</Animated.Text>
      <TextInput
        {...rest}
        value={value}
        placeholder={isFocused ? placeholder : ''}
        onFocus={(e) => { setIsFocused(true); onFocus && onFocus(e); }}
        onBlur={(e) => { setIsFocused(false); onBlur && onBlur(e); }}
        // centralização vertical confiável:
        includeFontPadding={false}
        textAlignVertical="center"
        style={[styles.input, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // define altura fixa e centraliza conteúdo verticalmente
  container: { width: '100%', marginBottom: 20, position: 'relative', height: INPUT_HEIGHT, justifyContent: 'center' },
  label: { position: 'absolute', left: 16, top: Platform.OS === 'web' ? 14 : 14, color: colors.textMuted, fontSize: 14, backgroundColor: colors.background, paddingHorizontal: 4, zIndex: 1 },
  input: {
    height: INPUT_HEIGHT,
    fontSize: FONT_SIZE,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: colors.surface,
    color: colors.text,
  },
});
