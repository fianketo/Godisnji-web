// BIOTEST — Firestore sloj za promocije (kao Temu katalog) i porudžbine/kodove.
// Kod je oblika BIO-DDMMGG-XXXXXX (datum ugrađen u kod, čitljivo osoblju golim okom)
// i čuva se u Firestore-u sa redeemed:false — tek kada osoblje na šalteru klikne
// "Označi kao iskorišćen" kod prestaje da važi, pa isti screenshot ne može dvaput da se iskoristi.
import { firebaseApp } from './firebase-config.js';
import {
  getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, setDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const db = getFirestore(firebaseApp);

export async function listAllPromotions() {
  const snap = await getDocs(collection(db, 'promotions'));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0));
}

export async function listActivePromotions() {
  const all = await listAllPromotions();
  return all.filter((p) => p.active !== false);
}

export async function savePromotion(promo) {
  const { id, ...data } = promo;
  if (id) {
    await updateDoc(doc(db, 'promotions', id), data);
    return id;
  }
  const ref = await addDoc(collection(db, 'promotions'), data);
  return ref.id;
}

export async function deletePromotion(id) {
  await deleteDoc(doc(db, 'promotions', id));
}

function pad(n) {
  return String(n).padStart(2, '0');
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bez 0/O i 1/I da se ne pobrka

function randomSuffix() {
  let out = '';
  for (let i = 0; i < 6; i++) out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return out;
}

export function generateOrderCode(date = new Date()) {
  const datePart = `${pad(date.getDate())}${pad(date.getMonth() + 1)}${String(date.getFullYear()).slice(2)}`;
  return `BIO-${datePart}-${randomSuffix()}`;
}

export async function createOrder({ items, customerName, customerContact }) {
  const totalOld = items.reduce((sum, it) => sum + it.oldPrice * it.qty, 0);
  const totalNew = items.reduce((sum, it) => sum + it.newPrice * it.qty, 0);
  const code = generateOrderCode();
  const order = {
    code,
    items,
    totalOld,
    totalNew,
    totalSavings: totalOld - totalNew,
    customerName: customerName || '',
    customerContact: customerContact || '',
    createdAt: new Date().toISOString(),
    redeemed: false,
    redeemedAt: null,
  };
  await setDoc(doc(db, 'orders', code), order);
  return order;
}

export async function getOrder(code) {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) return null;
  const snap = await getDoc(doc(db, 'orders', cleanCode));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function redeemOrder(code) {
  const cleanCode = (code || '').trim().toUpperCase();
  await updateDoc(doc(db, 'orders', cleanCode), {
    redeemed: true,
    redeemedAt: new Date().toISOString(),
  });
}

export async function listRecentOrders(max = 50) {
  const snap = await getDocs(collection(db, 'orders'));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, max);
}
