import { db, isFirebaseConfigured } from './firebase-config.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const LS_KEY = 'scent_perfumes';

function loadLocal(defaults) {
    try {
        const stored = localStorage.getItem(LS_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) { /* corrupted storage */ }
    return [...defaults];
}

function saveLocal(perfumes) {
    localStorage.setItem(LS_KEY, JSON.stringify(perfumes));
}

// Synchronous local read, used for instant first paint before auth resolves.
export function loadLocalSync(defaults) {
    return loadLocal(defaults);
}

// Load a user's perfumes. Logged-in → Firestore (seeding new users with
// defaults); guest → localStorage.
export async function loadPerfumes(user, defaults) {
    if (isFirebaseConfigured && user) {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists() && Array.isArray(snap.data().perfumes)) {
            return snap.data().perfumes;
        }
        await setDoc(ref, { perfumes: defaults });
        return [...defaults];
    }
    return loadLocal(defaults);
}

export async function savePerfumes(user, perfumes) {
    if (isFirebaseConfigured && user) {
        await setDoc(doc(db, 'users', user.uid), { perfumes });
    } else {
        saveLocal(perfumes);
    }
}
