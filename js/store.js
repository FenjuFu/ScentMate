import { db, isFirebaseConfigured } from './firebase-config.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const LS_KEY = 'scent_perfumes';
const DEFAULT_COLLECTION_OWNER_EMAIL = 'fufenju@pku.edu.cn';
const OWNER_COLLECTION_RECOVERY_FLAG = 'ownerDefaultsRecovered';

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
        if (snap.exists()) {
            const data = snap.data();
            if (Array.isArray(data.perfumes)) {
                const shouldRecoverOwnerDefaults =
                    user.email === DEFAULT_COLLECTION_OWNER_EMAIL &&
                    data.perfumes.length === 0 &&
                    !data[OWNER_COLLECTION_RECOVERY_FLAG];

                if (shouldRecoverOwnerDefaults) {
                    await setDoc(ref, {
                        perfumes: defaults,
                        [OWNER_COLLECTION_RECOVERY_FLAG]: true
                    }, { merge: true });
                    return [...defaults];
                }
                return data.perfumes;
            }
        }

        const seededPerfumes = user.email === DEFAULT_COLLECTION_OWNER_EMAIL ? defaults : [];
        await setDoc(ref, {
            perfumes: seededPerfumes,
            [OWNER_COLLECTION_RECOVERY_FLAG]: user.email === DEFAULT_COLLECTION_OWNER_EMAIL
        }, { merge: true });
        return [...seededPerfumes];
    }
    return loadLocal(defaults);
}

export async function savePerfumes(user, perfumes) {
    if (isFirebaseConfigured && user) {
        await setDoc(doc(db, 'users', user.uid), {
            perfumes,
            ...(user.email === DEFAULT_COLLECTION_OWNER_EMAIL ? { [OWNER_COLLECTION_RECOVERY_FLAG]: true } : {})
        }, { merge: true });
    } else {
        saveLocal(perfumes);
    }
}
