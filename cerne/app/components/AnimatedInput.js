import { colors } from '../theme';
import React, { useState, useRef, useEffect } from 'react';
import { Animated, TextInput, View, StyleSheet, Platform } from 'react-native';

export default function AnimatedInput({ label, value, onFocus, onBlur, style, ...rest }) {
  const [isFocused, setIsFocused] = useState(false);
  const animated = useRef(new Animated.Value(value && value.toString().length ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animated, { toValue: isFocused || (value && value.toString().length ? 1 : 0) ? 1 : 0, duration: 180, useNativeDriver: true }).start();
  }, [isFocused, value, animated]);

  const labelStyle = {
    transform: [
      { translateY: animated.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) },
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
        onFocus={(e) => { setIsFocused(true); onFocus && onFocus(e); }}
        onBlur={(e) => { setIsFocused(false); onBlur && onBlur(e); }}
        style={[styles.input, style]}
        placeholder={undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', marginBottom: 12, position: 'relative' },
  label: { position: 'absolute', left: 12, top: Platform.OS === 'web' ? 10 : 12, color: colors.textMuted, fontSize: 14, backgroundColor: colors.background, paddingHorizontal: 4 },
  input: { height: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingTop: 18, backgroundColor: colors.surface, color: colors.text },
});
