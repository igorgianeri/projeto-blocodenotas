import { initializeApp, getApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as fbSignOut
} from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, getDocs, serverTimestamp, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBvqMCKI4_fIfu6NG7MJkhg8EvpRNpXvK4",
  authDomain: "cerne-5eb0b.firebaseapp.com",
  projectId: "cerne-5eb0b",
  storageBucket: "cerne-5eb0b.appspot.com",
  messagingSenderId: "569956541263",
  appId: "1:569956541263:web:68ce13b25be8dc3d1b1b3a"
};

let app;
try {
  app = getApp();
} catch {
  app = initializeApp(firebaseConfig);
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

auth.useDeviceLanguage();

if (process.env.NODE_ENV === 'development') {
  console.log('Firebase inicializado com config:', { 
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain
  });
}

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
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Este e-mail já está em uso');
    }
    if (error.code === 'auth/invalid-email') {
      throw new Error('E-mail inválido');
    }
    if (error.code === 'auth/weak-password') {
      throw new Error('A senha é muito fraca');
    }
    throw error;
  }
}

export async function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
    .then(result => result.user)
    .catch(error => {
      console.error('Erro no login:', error);
      throw error;
    });
}

export async function signOut() {
  return fbSignOut(auth);
}

export async function saveTextNote(uid, title, text) {
  const doc = await addDoc(collection(db, 'notes'), {
    uid,
    type: 'text',
    title,
    text,
    createdAt: serverTimestamp(),
  });
  return doc.id;
}

export async function saveDrawingNote(uid, title, blob, mime = 'image/png') {
  const storageRef = ref(storage, `notes/${uid}/${Date.now()}.png`);
  const snapshot = await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(snapshot.ref);
  const doc = await addDoc(collection(db, 'notes'), {
    uid,
    type: 'drawing',
    title,
    imageUrl: url,
    createdAt: serverTimestamp(),
  });
  return { id: doc.id, url };
}

export async function fetchNotes(uid) {
  const q = query(collection(db, 'notes'), where('uid', '==', uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export { auth, db, storage };
