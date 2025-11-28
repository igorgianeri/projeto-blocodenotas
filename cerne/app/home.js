import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../firebase.js";
import { collection, addDoc, query, where, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import DrawingCanvas from "./components/DrawingCanvas";
import { colors } from "./theme";
import Svg, { Path } from "react-native-svg";
import { useRouter } from "expo-router";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [drawingModalOpen, setDrawingModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [textBody, setTextBody] = useState("");
  const [drawingStrokes, setDrawingStrokes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        loadNotes(u.uid);
      } else {
        router.replace("/");
      }
    });
    return unsubscribe;
  }, [router]);

  async function loadNotes(uid) {
    try {
      const q = query(collection(db, "notes"), where("uid", "==", uid));
      const querySnapshot = await getDocs(q);
      const loadedNotes = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const getCreatedAt = (n) => {
        const v = n.createdAt;
        if (!v) return 0;
        if (typeof v === "number") return v;
        if (typeof v === "string") return Date.parse(v) || 0;
        if (v && typeof v === "object") {
          if (typeof v.toDate === "function") return v.toDate().getTime();
          if (typeof v.seconds === "number") return v.seconds * 1000;
        }
        return 0;
      };
      loadedNotes.sort((a, b) => getCreatedAt(b) - getCreatedAt(a));
      setNotes(loadedNotes);
    } catch (err) {
      console.error("Erro ao carregar notas:", err);
    }
  }

  async function saveText() {
    if (!title.trim() && !textBody.trim()) {
      Alert.alert("Aviso", "Adicione um título ou escreva algo.");
      return;
    }
    if (!user) {
      Alert.alert("Erro", "Usuário não autenticado.");
      return;
    }
    try {
      if (selectedNote && selectedNote.type === "text") {
        const ref = doc(db, "notes", selectedNote.id);
        const payload = {
          title: title.trim(),
          text: textBody.trim(),
          updatedAt: Date.now(),
        };
        await updateDoc(ref, payload);
      } else {
        const noteData = {
          uid: user.uid,
          type: "text",
          title: title.trim(),
          text: textBody.trim(),
          createdAt: Date.now(),
        };
        await addDoc(collection(db, "notes"), noteData);
      }
      setTitle("");
      setTextBody("");
      setSelectedNote(null);
      setTextModalOpen(false);
      await loadNotes(user.uid);
    } catch (err) {
      console.error("Erro ao salvar nota:", err);
      Alert.alert("Erro", "Não foi possível salvar a nota. Tente novamente.");
    }
  }

  async function saveDrawing() {
    if (!drawingStrokes.length) {
      Alert.alert("Aviso", "Nenhum desenho criado.");
      return;
    }
    if (!title.trim()) {
      Alert.alert("Aviso", "Adicione um título para o desenho.");
      return;
    }
    if (!user) {
      Alert.alert("Erro", "Usuário não autenticado.");
      return;
    }
    try {
      if (selectedNote && selectedNote.type === "drawing") {
        const ref = doc(db, "notes", selectedNote.id);
        const payload = {
          title: title.trim(),
          strokes: drawingStrokes,
          updatedAt: Date.now(),
        };
        await updateDoc(ref, payload);
      } else {
        const drawingData = {
          uid: user.uid,
          type: "drawing",
          title: title.trim(),
          strokes: drawingStrokes,
          createdAt: Date.now(),
        };
        await addDoc(collection(db, "notes"), drawingData);
      }
      setTitle("");
      setDrawingStrokes([]);
      setSelectedNote(null);
      setDrawingModalOpen(false);
      await loadNotes(user.uid);
    } catch (err) {
      console.error("Erro ao salvar desenho:", err);
      Alert.alert("Erro", "Não foi possível salvar o desenho. Tente novamente.");
    }
  }

  function handleLogout() {
    signOut(auth);
  }

  function openForEdit(item) {
    setSelectedNote(item);
    if (item.type === "text") {
      setTitle(item.title || "");
      setTextBody(item.text || "");
      setTextModalOpen(true);
    } else if (item.type === "drawing") {
      setTitle(item.title || "");
      setDrawingStrokes(Array.isArray(item.strokes) ? item.strokes : []);
      setDrawingModalOpen(true);
    }
  }

  function confirmDelete(note) {
    if (Platform.OS === 'web') {
      if (window.confirm('Deseja realmente excluir esta nota?')) {
        performDelete(note);
      }
      return;
    }
    Alert.alert(
      "Excluir nota",
      "Deseja realmente excluir esta nota?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => performDelete(note),
        },
      ],
      { cancelable: true }
    );
  }

  async function performDelete(note) {
    try {
      await deleteDoc(doc(db, "notes", note.id));
      if (selectedNote && selectedNote.id === note.id) {
        setSelectedNote(null);
        setTitle("");
        setTextBody("");
        setDrawingStrokes([]);
        setTextModalOpen(false);
        setDrawingModalOpen(false);
      }
      if (user) await loadNotes(user.uid);
    } catch (err) {
      console.error("Erro ao excluir nota:", err);
      Alert.alert("Erro", "Não foi possível excluir a nota. Tente novamente.");
    }
  }

  function renderItem({ item }) {
    if (item.type === "text") {
      return (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 10,
            marginBottom: 10,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 4,
            position: "relative",
          }}
        >
          <TouchableOpacity
            onPress={() => confirmDelete(item)}
            style={{ position: "absolute", right: 10, top: 10, padding: 6, zIndex: 2 }}
          >
            <Ionicons name="trash-outline" size={20} color="#c00" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openForEdit(item)} style={{ padding: 16 }}>
            {item.title ? (
              <Text style={{ fontWeight: "bold", fontSize: 16, color: colors.text }}>
                {item.title}
              </Text>
            ) : null}
            {item.text ? (
              <Text style={{ color: colors.textMuted, marginTop: 4 }}>{item.text}</Text>
            ) : null}
          </TouchableOpacity>
        </View>
      );
    }

    if (item.type === "drawing") {
      const strokes = Array.isArray(item.strokes) ? item.strokes : [];
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      strokes.forEach(stroke => {
        if (Array.isArray(stroke.points)) {
          stroke.points.forEach(p => {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
          });
        }
      });

      if (minX === Infinity) {
        minX = 0; minY = 0; maxX = 100; maxY = 100;
      }

      const margin = 20;
      minX -= margin;
      minY -= margin;
      maxX += margin;
      maxY += margin;

      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;
      
      return (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 10,
            marginBottom: 10,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <TouchableOpacity
            onPress={() => confirmDelete(item)}
            style={{ position: "absolute", right: 10, top: 10, padding: 6, zIndex: 2, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 5 }}
          >
            <Ionicons name="trash-outline" size={20} color="#c00" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openForEdit(item)} activeOpacity={0.8}>
            {item.title ? (
              <Text style={{ fontWeight: "bold", fontSize: 16, paddingHorizontal: 12, paddingTop: 12, color: colors.text }}>
                {item.title}
              </Text>
            ) : null}
            <View style={{ padding: 10 }}>
              <Svg height="150" width="100%" viewBox={`${minX} ${minY} ${contentWidth} ${contentHeight}`} preserveAspectRatio="xMidYMid meet">
                {strokes.map((s, i) => (
                  <Path
                    key={i}
                    d={`M ${s.points.map((p) => `${p.x} ${p.y}`).join(" L ")}`}
                    stroke={s.mode === "erase" ? "#fff" : "#000"}
                    strokeWidth={s.strokeWidth || 3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                ))}
              </Svg>
            </View>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  }

  function confirmCloseTextModal() {
    const isEditing = selectedNote && selectedNote.type === "text";
    const hasChanges = isEditing 
      ? (title.trim() !== (selectedNote.title || "").trim() || textBody.trim() !== (selectedNote.text || "").trim())
      : (title.trim() || textBody.trim());

    if (hasChanges) {
      if (Platform.OS === 'web') {
        if (window.confirm('Deseja descartar as alterações?')) {
          setTitle("");
          setTextBody("");
          setSelectedNote(null);
          setTextModalOpen(false);
        }
      } else {
        Alert.alert(
          "Descartar alterações?",
          "Deseja descartar as alterações?",
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Descartar",
              style: "destructive",
              onPress: () => {
                setTitle("");
                setTextBody("");
                setSelectedNote(null);
                setTextModalOpen(false);
              },
            },
          ],
          { cancelable: true }
        );
      }
    } else {
      setTitle("");
      setTextBody("");
      setSelectedNote(null);
      setTextModalOpen(false);
    }
  }

  function confirmCloseDrawingModal() {
    const isEditing = selectedNote && selectedNote.type === "drawing";
    const hasChanges = isEditing
      ? (title.trim() !== (selectedNote.title || "").trim() || JSON.stringify(drawingStrokes) !== JSON.stringify(selectedNote.strokes || []))
      : (drawingStrokes.length > 0);

    if (hasChanges) {
      if (Platform.OS === 'web') {
        if (window.confirm('Deseja descartar as alterações?')) {
          setTitle("");
          setDrawingStrokes([]);
          setSelectedNote(null);
          setDrawingModalOpen(false);
        }
      } else {
        Alert.alert(
          "Descartar alterações?",
          "Deseja descartar as alterações?",
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Descartar",
              style: "destructive",
              onPress: () => {
                setTitle("");
                setDrawingStrokes([]);
                setSelectedNote(null);
                setDrawingModalOpen(false);
              },
            },
          ],
          { cancelable: true }
        );
      }
    } else {
      setTitle("");
      setDrawingStrokes([]);
      setSelectedNote(null);
      setDrawingModalOpen(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 20,
          backgroundColor: colors.primary,
        }}
      >
        <Text style={{ color: colors.white, fontSize: 22, fontWeight: "bold" }}>
          Minhas Notas
        </Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20 }}
      />

      <View
        style={{
          position: "absolute",
          bottom: 30,
          right: 30,
          flexDirection: "column",
        }}
      >
        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            padding: 16,
            borderRadius: 50,
            marginBottom: 10,
          }}
          onPress={() => setTextModalOpen(true)}
        >
          <Ionicons name="create-outline" size={24} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor: colors.primaryDark,
            padding: 16,
            borderRadius: 50,
          }}
          onPress={() => setDrawingModalOpen(true)}
        >
          <Ionicons name="brush-outline" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <Modal visible={textModalOpen} animationType="slide">
        <SafeAreaView style={{ flex: 1, padding: 20 }}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <TouchableOpacity onPress={confirmCloseTextModal}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            {selectedNote && selectedNote.type === "text" ? (
              <TouchableOpacity onPress={() => confirmDelete(selectedNote)}>
                <Ionicons name="trash-outline" size={28} color={colors.danger} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 28 }} />
            )}
            <TouchableOpacity onPress={saveText}>
              <Ionicons name="save-outline" size={28} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            <TextInput
              placeholder="Título"
              value={title}
              onChangeText={setTitle}
              style={{
                fontSize: 20,
                fontWeight: "bold",
                marginTop: 20,
                borderBottomWidth: 1,
                borderColor: colors.border,
              }}
            />
            <TextInput
              placeholder="Escreva sua nota..."
              value={textBody}
              onChangeText={setTextBody}
              multiline
              style={{
                fontSize: 16,
                marginTop: 20,
                height: 400,
                textAlignVertical: "top",
              }}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={drawingModalOpen} animationType="slide">
        <SafeAreaView style={{ flex: 1 }}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between", padding: 20 }}
          >
            <TouchableOpacity onPress={confirmCloseDrawingModal}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            {selectedNote && selectedNote.type === "drawing" ? (
              <TouchableOpacity onPress={() => confirmDelete(selectedNote)}>
                <Ionicons name="trash-outline" size={28} color={colors.danger} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 28 }} />
            )}
            <TouchableOpacity onPress={saveDrawing}>
              <Ionicons name="save-outline" size={28} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
            <TextInput
              placeholder="Título do desenho"
              value={title}
              onChangeText={setTitle}
              style={{
                fontSize: 18,
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderColor: colors.border
              }}
            />
          </View>
          <DrawingCanvas onStrokesChange={setDrawingStrokes} initialStrokes={selectedNote?.strokes || []} />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
