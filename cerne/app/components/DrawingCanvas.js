import React, { useEffect, useRef, useState } from "react";
import { View, PanResponder, TouchableOpacity, Text } from "react-native";
import Svg, { Path } from "react-native-svg";

export default function DrawingCanvas({ onStrokesChange, initialStrokes = [] }) {
  const [strokes, setStrokes] = useState([]);
  const [mode, setMode] = useState("draw");
  const [canvasLayout, setCanvasLayout] = useState({ width: 0, height: 0 });

  const strokesRef = useRef([]);
  const currentRef = useRef(null);
  const modeRef = useRef("draw");
  const loadedInitialRef = useRef(false);

  const updateParent = () => {
    if (onStrokesChange) {
      onStrokesChange(strokesRef.current);
    }
  };

  useEffect(() => {
    if (!loadedInitialRef.current && Array.isArray(initialStrokes) && initialStrokes.length > 0) {
      loadedInitialRef.current = true;
      strokesRef.current = initialStrokes.map(s => ({ ...s }));
      setStrokes([...strokesRef.current]);
      updateParent();
    }
  }, [initialStrokes]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const distance = (p1, p2) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.hypot(dx, dy);
  };

  const ERASER_DIAMETER = 20;
  
  const eraseAt = (x, y) => {
    const hitPoint = { x, y };
    const fragments = [];

    for (const s of strokesRef.current) {
      const pts = Array.isArray(s.points) ? s.points : [];
      if (pts.length < 2) {
        const thr = ERASER_DIAMETER / 2 + (s.strokeWidth || 3) / 2;
        if (pts[0] && distance(pts[0], hitPoint) > thr) {
          fragments.push(s);
        }
        continue;
      }

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

      for (const g of groups) {
        if (g.length >= 2) {
          fragments.push({
            ...s,
            mode: 'draw',
            points: g,
          });
        }
      }
    }

    strokesRef.current = fragments;
    setStrokes([...strokesRef.current]);
    updateParent();
  };

  const clampCoordinates = (x, y) => {
    if (canvasLayout.width === 0 || canvasLayout.height === 0) {
      return { x, y };
    }
    const clampedX = Math.max(0, Math.min(x, canvasLayout.width));
    const clampedY = Math.max(0, Math.min(y, canvasLayout.height));
    return { x: clampedX, y: clampedY };
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        const { x, y } = clampCoordinates(locationX, locationY);
        
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
          setStrokes([...strokesRef.current]);
          updateParent();
        }
      },
      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        const { x, y } = clampCoordinates(locationX, locationY);
        
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
        setStrokes([...strokesRef.current]);
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

  const handleLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    setCanvasLayout({ width, height });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flexDirection: "row", padding: 10, borderBottomWidth: 1, borderColor: "#eee" }}>
        <TouchableOpacity
          style={{
            padding: 10,
            borderRadius: 5,
            backgroundColor: mode === "draw" ? "#e3f2fd" : "#fff",
            marginRight: 10,
            borderWidth: 1,
            borderColor: mode === "draw" ? "#2196F3" : "#ddd",
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
            borderWidth: 1,
            borderColor: mode === "erase" ? "#2196F3" : "#ddd",
          }}
          onPress={() => setMode("erase")}
        >
          <Text>🧽 Borracha</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1 }} {...pan.panHandlers} onLayout={handleLayout}>
        <Svg height="100%" width="100%">
          {strokes.map((s, i) => {
            if (!s.points || s.points.length === 0) return null;
            return (
              <Path
                key={i}
                d={`M ${s.points.map((p) => `${p.x} ${p.y}`).join(" L ")}`}
                stroke={s.mode === "erase" ? "#fff" : "#000"}
                strokeWidth={s.strokeWidth || (s.mode === "erase" ? 20 : 3)}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            );
          })}
        </Svg>
      </View>
    </View>
  );
}
