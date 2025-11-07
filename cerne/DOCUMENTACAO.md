# 📚 Documentação Técnica - CERNE

**Aplicativo de notas com desenho em React Native / Expo**

---

## 🎯 Visão Geral

CERNE é um aplicativo de anotações que permite criar notas de texto e desenhos à mão livre, com funcionalidades de edição, exclusão e sincronização via Firebase. O design utiliza tons de marrom inspirados em madeira, refletindo o nome "Cerne" (parte interna do tronco).

### Tecnologias Principais
- **React Native** + **Expo Router** (navegação baseada em arquivos)
- **Firebase** (Authentication, Firestore, Storage)
- **React Native SVG** (renderização de desenhos)
- **AsyncStorage** (persistência local)

---

## 📁 Estrutura de Arquivos

```
cerne/
├── app/
│   ├── _layout.js          # Layout raiz com Stack Navigator
│   ├── index.js            # Tela de boas-vindas
│   ├── login.js            # Tela de login
│   ├── register.js         # Tela de cadastro
│   ├── home.js             # Tela principal com lista de notas
│   ├── theme.js            # Paleta de cores centralizada
│   └── components/
│       ├── AnimatedInput.js    # Input com label animado
│       ├── DrawingCanvas.js    # Canvas de desenho (COMPLEXO)
│       └── LogoWood.js         # Logo SVG do tronco
├── firebase.js             # Configuração e helpers do Firebase
└── app.json               # Configuração do Expo
```

---

## 🔥 firebase.js - Configuração Firebase

### Inicialização Segura

```javascript
let app;
try {
  app = getApp();
} catch {
  app = initializeApp(firebaseConfig);
}
```

**Explicação:** Evita erro ao tentar inicializar o Firebase múltiplas vezes. Se já existe uma instância (`getApp()` funciona), reutiliza; caso contrário, cria uma nova.

### Serviços Exportados

```javascript
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
```

- `auth`: gerencia autenticação
- `db`: acesso ao Firestore (banco NoSQL)
- `storage`: armazenamento de arquivos (futuramente para imagens)

### Função registerWithEmail

```javascript
export async function registerWithEmail(name, email, password) {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    await addDoc(collection(db, 'users'), {
      uid: user.uid,
      name,
      email,
      createdAt: new Date().toISOString()
    });
    
    return user;
  } catch (error) {
    // Tratamento de erros específicos
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Este e-mail já está em uso');
    }
    // ...outros códigos de erro
  }
}
```

**Fluxo:**
1. Cria usuário no Firebase Authentication
2. Salva dados adicionais (nome) no Firestore na coleção `users`
3. Lança erros traduzidos para o usuário

### Função loginWithEmail

```javascript
export async function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
    .then(result => result.user)
    .catch(error => {
      console.error('Erro no login:', error);
      throw error;
    });
}
```

**Simplificada:** apenas autentica e retorna o objeto `user`.

---

## 🎨 app/theme.js - Paleta de Cores

```javascript
export const colors = {
  primary: '#5D4037',       // Marrom principal (Material Brown 700)
  primaryDark: '#4E342E',   // Marrom escuro para sombras/contraste
  primaryLight: '#8D6E63',  // Marrom claro para destaques
  secondary: '#A1887F',     // Tom complementar
  background: '#FAF6F1',    // Off-white quente (fundo geral)
  surface: '#FFFDF9',       // Cartões e superfícies
  border: '#D7CCC8',        // Bordas suaves
  text: '#2D221B',          // Texto principal (alto contraste)
  textMuted: '#6D5A4F',     // Texto secundário
  success: '#6D9E70',       // Verde amadeirado
  danger: '#B71C1C',        // Vermelho para exclusão
  white: '#FFFFFF',
  black: '#000000',
};
```

**Centralização:** todas as telas importam este arquivo, garantindo consistência visual.

---

## 🚪 app/_layout.js - Navegador Raiz

```javascript
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="register" />
      <Stack.Screen name="login" />
      <Stack.Screen name="home" />
    </Stack>
  );
}
```

**Expo Router:** usa estrutura de arquivos para definir rotas. Cada arquivo em `app/` vira uma rota automaticamente. O Stack Navigator gerencia a pilha de navegação.

---

## 🏠 app/index.js - Tela Inicial

### Estrutura Visual

```javascript
<View style={styles.header}>
  <Text style={styles.title}>Cerne</Text>
  <Text style={styles.subtitle}>Suas ideias, anotações e desenhos em um só lugar</Text>
</View>

<View style={styles.imageContainer}>
  <LogoWood size={220} />
</View>

<View style={styles.buttonContainer}>
  <Pressable onPress={() => router.push('/login')}>
    <Text>Fazer Login</Text>
  </Pressable>
  <Pressable onPress={() => router.push('/register')}>
    <Text>Criar Conta</Text>
  </Pressable>
</View>
```

**Navegação:** `router.push('/login')` navega para `app/login.js` (Expo Router infere o caminho).

---

## 🔐 app/login.js - Autenticação

### Guard de Navegação com AsyncStorage

```javascript
const [remember, setRemember] = useState(true);

const handleLogin = async () => {
  // ...validações
  const result = await loginWithEmail(email.trim(), password);
  if (result) {
    await AsyncStorage.setItem('@cerne_remember', remember ? '1' : '0');
    router.replace('/home');
  }
};
```

**AsyncStorage:** salva a preferência de "lembrar-me" localmente (não expira ao fechar o app).

**`router.replace`:** substitui a tela atual na pilha, impedindo voltar para login após autenticado.

---

## 📝 app/register.js - Cadastro

### Redirecionamento Automático se Autenticado

```javascript
React.useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      router.replace('/home');
    }
  });
  return unsubscribe;
}, [router]);
```

**onAuthStateChanged:** listener do Firebase que dispara sempre que o estado de autenticação muda. Se o usuário já está logado, redireciona para Home.

---

## 🏡 app/home.js - Tela Principal (COMPLEXA)

### Guard de Autenticação

```javascript
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
```

**Proteção:** se não houver usuário autenticado, volta para a tela inicial.

### Carregamento de Notas com Ordenação Local

```javascript
async function loadNotes(uid) {
  try {
    const q = query(collection(db, "notes"), where("uid", "==", uid));
    const querySnapshot = await getDocs(q);
    const loadedNotes = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Ordenação local por createdAt
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
```

**Por que ordenação local?** 
- Usar `where + orderBy` no Firestore exige índice composto.
- Fazendo sort no cliente, evitamos configuração extra no Firebase.
- Suporta múltiplos formatos de `createdAt`: número (timestamp), string ISO, ou Timestamp do Firestore.

### Salvar Nota (Criar vs Editar)

```javascript
async function saveText() {
  // ...validações
  try {
    if (selectedNote && selectedNote.type === "text") {
      // EDIÇÃO: atualiza documento existente
      const ref = doc(db, "notes", selectedNote.id);
      const payload = {
        title: title.trim(),
        text: textBody.trim(),
        updatedAt: Date.now(),
      };
      await updateDoc(ref, payload);
    } else {
      // CRIAÇÃO: adiciona novo documento
      const noteData = {
        uid: user.uid,
        type: "text",
        title: title.trim(),
        text: textBody.trim(),
        createdAt: Date.now(),
      };
      await addDoc(collection(db, "notes"), noteData);
    }
    // Limpa estado e recarrega lista
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
```

**Dual-mode:** mesma função para criar e editar, diferenciada pela presença de `selectedNote`.

### Exclusão com Confirmação (Web-friendly)

```javascript
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
      { text: "Excluir", style: "destructive", onPress: () => performDelete(note) },
    ],
    { cancelable: true }
  );
}

async function performDelete(note) {
  try {
    await deleteDoc(doc(db, "notes", note.id));
    if (selectedNote && selectedNote.id === note.id) {
      // Se estava editando a nota excluída, fecha o modal
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
```

**Diferenciação web/mobile:** `Alert.alert` com múltiplos botões não funciona bem na web; usamos `window.confirm` nativamente.

### Renderização de Notas (Texto e Desenho)

```javascript
function renderItem({ item }) {
  if (item.type === "text") {
    return (
      <View style={{ backgroundColor: colors.surface, ... }}>
        <TouchableOpacity onPress={() => confirmDelete(item)} style={{ position: "absolute", right: 10, top: 10, zIndex: 2 }}>
          <Ionicons name="trash-outline" size={20} color="#c00" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openForEdit(item)} style={{ padding: 16 }}>
          <Text style={{ color: colors.text }}>{item.title}</Text>
          <Text style={{ color: colors.textMuted }}>{item.text}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (item.type === "drawing") {
    return (
      <View style={{ backgroundColor: colors.surface, ... }}>
        <TouchableOpacity onPress={() => confirmDelete(item)} style={{ position: "absolute", right: 10, top: 10, zIndex: 2 }}>
          <Ionicons name="trash-outline" size={20} color="#c00" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openForEdit(item)}>
          <Text style={{ color: colors.text }}>{item.title}</Text>
          <Svg height="150" width="100%">
            {Array.isArray(item.strokes) && item.strokes.map((s, i) => (
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
        </TouchableOpacity>
      </View>
    );
  }
}
```

**Estrutura aninhada:**
- `View` externo com botão de excluir posicionado absolutamente (evita conflito de toque).
- `TouchableOpacity` interno cobre toda a área para abrir edição.
- Desenhos renderizam miniatura com `<Svg>` e `<Path>` para cada traço.

**SVG Path syntax:** `M x y L x1 y1 L x2 y2 ...` desenha uma polilinha conectando pontos.

---

## 🎨 app/components/DrawingCanvas.js - Canvas de Desenho (MUITO COMPLEXO)

### Estrutura de Dados

```javascript
const [strokes, setStrokes] = useState([]);  // Array de traços
const [mode, setMode] = useState("draw");    // "draw" ou "erase"

// Refs para evitar closures stales no PanResponder
const strokesRef = useRef([]);
const currentRef = useRef(null);
const modeRef = useRef("draw");
const loadedInitialRef = useRef(false);
```

**Stroke (traço):**
```javascript
{
  points: [{ x: 10, y: 20 }, { x: 15, y: 25 }, ...],
  mode: "draw",
  strokeWidth: 3
}
```

### Problema de Closures Stales

```javascript
// ❌ ERRADO: mode fica "congelado" no valor da criação do PanResponder
onPanResponderGrant: (e) => {
  if (mode === "erase") { /* sempre falso se mode mudou depois */ }
}

// ✅ CORRETO: usar ref atualizado
onPanResponderGrant: (e) => {
  if (modeRef.current === "erase") { /* sempre atual */ }
}
```

**Explicação:** PanResponder é criado uma vez e suas funções fecham sobre os valores iniciais de `mode`. Ao usar `useRef`, o valor é sempre o mais recente.

### Sincronização Mode + ModeRef

```javascript
useEffect(() => {
  modeRef.current = mode;
}, [mode]);
```

Sempre que `mode` muda, atualiza o ref.

### Carregamento de Traços Iniciais (Edição)

```javascript
useEffect(() => {
  if (!loadedInitialRef.current && Array.isArray(initialStrokes)) {
    loadedInitialRef.current = true;
    strokesRef.current = initialStrokes.map(s => ({ ...s }));
    setStrokes(strokesRef.current);
    updateParent();
  }
}, []);
```

**Uma vez só:** carrega os traços apenas no mount, evitando reset durante edição. O `loadedInitialRef` impede recarregamento se o componente re-renderizar.

### PanResponder - Detecção de Gestos

```javascript
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
```

**Fases:**
1. **Grant (toque inicial):**
   - Modo desenho: cria novo traço com ponto inicial
   - Modo apagar: remove traços no ponto
2. **Move (arrasto):**
   - Modo desenho: adiciona pontos ao traço atual
   - Modo apagar: continua removendo traços
3. **Release/Terminate:** finaliza traço

### Função eraseAt - Borracha Inteligente

```javascript
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

    // Remove pontos dentro do raio e separa em fragmentos
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

    // Cada fragmento com 2+ pontos vira um novo traço
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
  setStrokes(strokesRef.current);
  updateParent();
};
```

**Algoritmo:**
1. Para cada traço, percorre seus pontos
2. Se o ponto está próximo do cursor (dentro do raio da borracha), marca para remoção
3. Agrupa pontos "fora do raio" em fragmentos
4. Cada fragmento com 2+ pontos vira um novo traço
5. Resultado: o traço é "cortado" onde a borracha passou

**Threshold dinâmico:** soma do raio da borracha + metade da espessura do traço (para apagar traços grossos completamente).

### Renderização SVG

```javascript
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
```

**`{...pan.panHandlers}`:** espalha os event handlers do PanResponder no View, capturando toques/arrasto.

**SVG Path:** `d="M x y L x1 y1 L x2 y2"` desenha uma polilinha. `strokeLinecap="round"` arredonda as pontas para parecer mais natural.

---

## 🎨 app/components/AnimatedInput.js - Input com Label Flutuante

### Animação de Label

```javascript
const [isFocused, setIsFocused] = useState(false);
const animated = useRef(new Animated.Value(value && value.toString().length ? 1 : 0)).current;

useEffect(() => {
  Animated.timing(animated, { 
    toValue: isFocused || (value && value.toString().length ? 1 : 0) ? 1 : 0, 
    duration: 180, 
    useNativeDriver: true 
  }).start();
}, [isFocused, value, animated]);

const labelStyle = {
  transform: [
    { translateY: animated.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) },
    { scale: animated.interpolate({ inputRange: [0, 1], outputRange: [1, 0.85] }) },
  ],
  opacity: animated.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }),
};
```

**Fluxo:**
- Quando vazio e sem foco: label fica no meio (translateY=0, scale=1)
- Quando focado ou com texto: label sobe e diminui (translateY=-20, scale=0.85)

**useNativeDriver: true:** anima via thread nativa (60fps garantidos).

---

## 🪵 app/components/LogoWood.js - Logo SVG

### Desenho Vetorial Complexo

```javascript
export default function LogoWood({ size = 220, tone = 'primary' }) {
  const stroke = colors.primaryDark;
  const fillMain = colors[tone] || colors.primary;
  const fillLight = colors.primaryLight;
  const fillShadow = '#3E2E28';
  const width = size;
  const height = Math.round(size * 0.8);

  const trunkWidth = Math.round(width * 0.62);
  const trunkHeight = Math.round(height * 0.62);
  const trunkX = Math.round((width - trunkWidth) / 2);
  const trunkY = Math.round(height * 0.22);
  const radius = Math.round(trunkWidth / 2);

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <G>
        {/* Sombra */}
        <Ellipse cx={width/2} cy={height*0.92} rx={trunkWidth*0.54} ry={height*0.06} fill={'rgba(0,0,0,0.08)'} />
        
        {/* Topo do tronco com anéis de crescimento */}
        <Ellipse cx={width/2} cy={trunkY} rx={radius} ry={Math.round(radius*0.32)} fill={fillLight} stroke={stroke} strokeWidth={2} />
        <Ellipse cx={width/2} cy={trunkY} rx={radius*0.65} ry={Math.round(radius*0.21)} fill={'none'} stroke={stroke} strokeWidth={1.5} opacity={0.6} />
        <Ellipse cx={width/2} cy={trunkY} rx={radius*0.35} ry={Math.round(radius*0.12)} fill={'none'} stroke={stroke} strokeWidth={1.25} opacity={0.6} />
        
        {/* Tronco principal */}
        <Rect x={trunkX} y={trunkY} width={trunkWidth} height={trunkHeight} rx={10} fill={fillMain} stroke={stroke} strokeWidth={2} />
        
        {/* Veios da madeira (linhas verticais) */}
        <Path d={`M ${trunkX + trunkWidth*0.25} ${trunkY+12} v ${trunkHeight-24}`} stroke={stroke} strokeWidth={2} strokeLinecap="round" opacity={0.45} />
        <Path d={`M ${trunkX + trunkWidth*0.52} ${trunkY+20} v ${trunkHeight-40}`} stroke={stroke} strokeWidth={2} strokeLinecap="round" opacity={0.45} />
        <Path d={`M ${trunkX + trunkWidth*0.78} ${trunkY+30} v ${trunkHeight-64}`} stroke={stroke} strokeWidth={2} strokeLinecap="round" opacity={0.45} />
        
        {/* Galho e folhas */}
        <Path d={`M ${trunkX+trunkWidth*0.18} ${trunkY+trunkHeight*0.32} c -20 -8 -26 -8 -42 0`} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
        <Path d={`M ${trunkX+trunkWidth*0.18} ${trunkY+trunkHeight*0.32} c -8 -18 -10 -26 -10 -40`} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
        <Path d={`M ${trunkX-16} ${trunkY+trunkHeight*0.18} c 10 -12 24 -12 34 0 c -12 6 -22 6 -34 0 z`} fill={fillLight} stroke={stroke} strokeWidth={1.5} />
        
        {/* Brilho sutil */}
        <Path d={`M ${trunkX+8} ${trunkY+10} v ${trunkHeight-20}`} stroke={'rgba(255,255,255,0.18)'} strokeWidth={3} strokeLinecap="round" />
      </G>
    </Svg>
  );
}
```

**Técnicas:**
- **Elipses concêntricas:** anéis de crescimento
- **Paths com curvas Bézier:** `c x1 y1 x2 y2 x y` para galhos orgânicos
- **Opacidade e sombras:** profundidade visual
- **Props dinâmicos:** `size` e `tone` permitem variações

---

## 🔧 Padrões e Boas Práticas

### 1. Centralização de Tema
Todas as cores vêm de `theme.js`, facilitando redesign futuro.

### 2. Guard de Autenticação
`onAuthStateChanged` em Home e Register protege rotas privadas.

### 3. Refs vs State
- **State:** UI reativa (rerender quando muda)
- **Refs:** valores mutáveis sem rerender (ideal para PanResponder)

### 4. Ordenação Local vs Servidor
Evita índices compostos complexos no Firestore; ordena no cliente.

### 5. Confirmações Web-Friendly
`window.confirm` na web, `Alert.alert` no mobile.

### 6. Componentes Reutilizáveis
`AnimatedInput`, `LogoWood`, `DrawingCanvas` isolados e testáveis.

---

## 🚀 Funcionalidades Implementadas

✅ Autenticação (login/registro)  
✅ Criação de notas de texto  
✅ Criação de desenhos à mão livre  
✅ Edição de notas e desenhos  
✅ Exclusão com confirmação  
✅ Borracha inteligente (corta traços)  
✅ Persistência no Firestore  
✅ Ordenação por data de criação  
✅ Tema marrom consistente  
✅ Logo SVG personalizado  
✅ Responsivo web e mobile  

---

## 🔮 Possíveis Melhorias Futuras

- [ ] Upload de imagens nas notas
- [ ] Pastas/categorias
- [ ] Busca por texto
- [ ] Compartilhamento de notas
- [ ] Modo offline (sync quando conectar)
- [ ] Paleta de cores para desenhos
- [ ] Espessura ajustável do lápis
- [ ] Desfazer/Refazer (undo/redo stack)
- [ ] Exportar desenho como imagem PNG
- [ ] Autenticação com Google/Apple

---

## 📦 Dependências Principais

```json
{
  "expo": "~54.0.20",
  "expo-router": "~6.0.13",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "react-native-svg": "^15.14.0",
  "firebase": "^12.5.0",
  "@react-native-async-storage/async-storage": "^1.24.0"
}
```

---

## 🎓 Conceitos Avançados Utilizados

### 1. **Closures e Refs no PanResponder**
Problema clássico de eventos capturando estado desatualizado.

### 2. **SVG Path Commands**
Desenho vetorial programático com comandos M (move), L (line), C (curve).

### 3. **Firestore Queries e Ordenação**
Otimização de queries evitando índices compostos.

### 4. **Animated API do React Native**
Animações nativas performáticas com interpolação.

### 5. **Expo Router (File-based Routing)**
Navegação declarativa baseada em estrutura de arquivos.

---

## 🏁 Conclusão

O projeto CERNE demonstra integração completa de autenticação, banco de dados em tempo real, desenho vetorial e navegação moderna em React Native. A parte mais complexa é o **DrawingCanvas**, que combina gestão de gestos, renderização SVG e manipulação de estado com refs para performance.

O uso de **temas centralizados**, **guards de autenticação** e **componentes reutilizáveis** garante código limpo e manutenível.

---

**Desenvolvido por:** Igor Gianeri, Eduardo Romanini e Lucas Cruz
**Repositório:** projeto-blocodenotas  
**Branch:** igor  
**Data:** Novembro 2025
