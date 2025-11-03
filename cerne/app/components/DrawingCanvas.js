import React, { useEffect, useRef, useState } from "react";
import { View, PanResponder, TouchableOpacity, Text } from "react-native";
import Svg, { Path } from "react-native-svg";

export default function DrawingCanvas({ onStrokesChange, initialStrokes = [] }) {
  const [strokes, setStrokes] = useState([]);
  const [mode, setMode] = useState("draw");

  // Refs para evitar estados "stale" dentro do PanResponder
  const strokesRef = useRef([]);
  const currentRef = useRef(null);
  const modeRef = useRef("draw");
  const loadedInitialRef = useRef(false);

  const updateParent = () => {
    onStrokesChange && onStrokesChange(strokesRef.current);
  };

  // Carregar traços iniciais somente no mount (ou quando o componente remontar ao abrir o modal)
  useEffect(() => {
    if (!loadedInitialRef.current && Array.isArray(initialStrokes)) {
      loadedInitialRef.current = true;
      strokesRef.current = initialStrokes.map(s => ({ ...s }));
      setStrokes(strokesRef.current);
      updateParent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manter o ref do modo sincronizado
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const distance = (p1, p2) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.hypot(dx, dy);
  };

  const ERASER_DIAMETER = 20; // px visual aproximado
  const eraseAt = (x, y) => {
    const hitPoint = { x, y };
    const fragments = [];

    for (const s of strokesRef.current) {
      const pts = Array.isArray(s.points) ? s.points : [];
      if (pts.length < 2) {
        // Um ponto só: apaga se próximo; senão mantém
        const thr = ERASER_DIAMETER / 2 + (s.strokeWidth || 3) / 2;
        if (pts[0] && distance(pts[0], hitPoint) > thr) {
          fragments.push(s);
        }
        continue;
      }

      // Remove pontos próximos ao apagador e divide em grupos "fora do raio"
      const thr = ERASER_DIAMETER / 2 + (s.strokeWidth || 3) / 2;
      let group = [];
      const groups = [];
      for (let i = 0; i < pts.length; i++) {
        const pt = pts[i];
        if (distance(pt, hitPoint) > thr) {
          group.push(pt);
        } else {
          if (group.length > 0) {
            groups.push(group);
            group = [];
          }
        }
      }
      if (group.length > 0) groups.push(group);

      // Transformar cada grupo com 2+ pontos em um novo traço
      for (const g of groups) {
        if (g.length >= 2) {
          fragments.push({
            ...s,
            mode: 'draw', // traços resultantes continuam sendo desenho
            points: g,
          });
        }
      }
    }

    strokesRef.current = fragments;
    setStrokes(strokesRef.current);
    updateParent();
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent;
        if (modeRef.current === "erase") {
          eraseAt(x, y);
          currentRef.current = null;
        } else {
          const stroke = {
            points: [{ x, y }],
            mode: "draw",
            strokeWidth: 3,
          };
          currentRef.current = stroke;
          strokesRef.current = [...strokesRef.current, stroke];
          setStrokes(strokesRef.current);
          updateParent();
        }
      },
      onPanResponderMove: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent;
        if (modeRef.current === "erase") {
          eraseAt(x, y);
          return;
        }
        if (!currentRef.current) return;
        currentRef.current = {
          ...currentRef.current,
          points: [...currentRef.current.points, { x, y }],
        };
        const list = strokesRef.current.slice();
        list[list.length - 1] = currentRef.current;
        strokesRef.current = list;
        setStrokes(strokesRef.current);
        updateParent();
      },
      onPanResponderRelease: () => {
        currentRef.current = null;
      },
      onPanResponderTerminate: () => {
        currentRef.current = null;
      },
    })
  ).current;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flexDirection: "row", padding: 10, borderBottomWidth: 1, borderColor: "#eee" }}>
        <TouchableOpacity
          style={{
            padding: 10,
            borderRadius: 5,
            backgroundColor: mode === "draw" ? "#e3f2fd" : "#fff",
            marginRight: 10,
          }}
          onPress={() => setMode("draw")}
        >
          <Text>✏️ Lápis</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            padding: 10,
            borderRadius: 5,
            backgroundColor: mode === "erase" ? "#e3f2fd" : "#fff",
          }}
          onPress={() => setMode("erase")}
        >
          <Text>🧽 Borracha</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1 }} {...pan.panHandlers}>
        <Svg height="100%" width="100%">
          {strokes.map((s, i) => (
            <Path
              key={i}
              d={`M ${s.points.map((p) => `${p.x} ${p.y}`).join(" L ")}`}
              stroke={s.mode === "erase" ? "#fff" : "#000"}
              strokeWidth={s.strokeWidth || (s.mode === "erase" ? 20 : 3)}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
        </Svg>
      </View>
    </View>
  );
}
