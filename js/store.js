import { db, isFirebaseConfigured } from './firebase-config.js';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const LS_KEY = 'scent_perfumes';
const DEFAULT_COLLECTION_OWNER_EMAIL = 'fufenju@pku.edu.cn';
const OWNER_COLLECTION_RECOVERY_FLAG = 'ownerDefaultsRecovered';
const PUBLIC_PROFILES_COLLECTION = 'publicProfiles';
export const DEFAULT_VISIBILITY_SETTINGS = Object.freeze({
    publicCollection: false,
    publicCard: false
});

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

function clonePerfumes(perfumes = []) {
    return JSON.parse(JSON.stringify(perfumes));
}

function getUserDisplayName(user) {
    if (!user) return 'Scent Explorer';
    return user.displayName || (user.email ? user.email.split('@')[0] : 'Scent Explorer');
}

function normalizeVisibilitySettings(data = {}) {
    return {
        publicCollection: !!data.publicCollectionEnabled,
        publicCard: !!data.publicCardEnabled
    };
}

function collectUniqueNotes(perfumes = []) {
    const notes = new Set();
    perfumes.forEach((perfume) => {
        perfume.notes?.top?.forEach(note => notes.add(note));
        perfume.notes?.middle?.forEach(note => notes.add(note));
        perfume.notes?.base?.forEach(note => notes.add(note));
    });
    return Array.from(notes);
}

function buildPublicDocFields(user, perfumes = [], settings = DEFAULT_VISIBILITY_SETTINGS) {
    const normalized = normalizeVisibilitySettings({
        publicCollectionEnabled: settings.publicCollection,
        publicCardEnabled: settings.publicCard
    });
    const safePerfumes = clonePerfumes(perfumes);
    const publicNotes = normalized.publicCollection || normalized.publicCard ? collectUniqueNotes(safePerfumes) : [];

    return {
        isPublic: normalized.publicCollection || normalized.publicCard,
        publicDisplayName: getUserDisplayName(user),
        publicPhotoURL: user?.photoURL || '',
        publicCollectionEnabled: normalized.publicCollection,
        publicCardEnabled: normalized.publicCard,
        publicPerfumeCount: safePerfumes.length,
        publicNoteSummary: publicNotes,
        publicCollectionPerfumes: normalized.publicCollection ? safePerfumes : [],
        publicCardPerfumes: normalized.publicCard ? safePerfumes : []
    };
}

async function syncPublicProfileDoc(user, perfumes = [], settings = DEFAULT_VISIBILITY_SETTINGS) {
    if (!isFirebaseConfigured || !user) return;
    await setDoc(doc(db, PUBLIC_PROFILES_COLLECTION, user.uid), buildPublicDocFields(user, perfumes, settings), { merge: true });
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
                const visibilitySettings = normalizeVisibilitySettings(data);
                const shouldRecoverOwnerDefaults =
                    user.email === DEFAULT_COLLECTION_OWNER_EMAIL &&
                    data.perfumes.length === 0 &&
                    !data[OWNER_COLLECTION_RECOVERY_FLAG];

                if (shouldRecoverOwnerDefaults) {
                    await setDoc(ref, {
                        perfumes: defaults,
                        [OWNER_COLLECTION_RECOVERY_FLAG]: true
                    }, { merge: true });
                    await syncPublicProfileDoc(user, defaults, visibilitySettings);
                    return [...defaults];
                }
                await syncPublicProfileDoc(user, data.perfumes, visibilitySettings);
                return data.perfumes;
            }
        }

        const seededPerfumes = user.email === DEFAULT_COLLECTION_OWNER_EMAIL ? defaults : [];
        await setDoc(ref, {
            perfumes: seededPerfumes,
            [OWNER_COLLECTION_RECOVERY_FLAG]: user.email === DEFAULT_COLLECTION_OWNER_EMAIL,
            publicCollectionEnabled: DEFAULT_VISIBILITY_SETTINGS.publicCollection,
            publicCardEnabled: DEFAULT_VISIBILITY_SETTINGS.publicCard
        }, { merge: true });
        return [...seededPerfumes];
    }
    return loadLocal(defaults);
}

export async function loadUserVisibilitySettings(user) {
    if (!isFirebaseConfigured || !user) {
        return { ...DEFAULT_VISIBILITY_SETTINGS };
    }

    const snap = await getDoc(doc(db, 'users', user.uid));
    if (!snap.exists()) return { ...DEFAULT_VISIBILITY_SETTINGS };
    return normalizeVisibilitySettings(snap.data());
}

export async function saveUserVisibilitySettings(user, settings, perfumes) {
    if (!isFirebaseConfigured || !user) {
        return normalizeVisibilitySettings({
            publicCollectionEnabled: settings?.publicCollection,
            publicCardEnabled: settings?.publicCard
        });
    }

    const normalized = normalizeVisibilitySettings({
        publicCollectionEnabled: settings?.publicCollection,
        publicCardEnabled: settings?.publicCard
    });
    await setDoc(doc(db, 'users', user.uid), {
        publicCollectionEnabled: normalized.publicCollection,
        publicCardEnabled: normalized.publicCard
    }, { merge: true });
    await syncPublicProfileDoc(user, perfumes, normalized);
    return normalized;
}

export async function loadPublicUsers(currentUser = null) {
    if (!isFirebaseConfigured) return [];

    const snap = await getDocs(query(collection(db, PUBLIC_PROFILES_COLLECTION), where('isPublic', '==', true)));
    return snap.docs.map((item) => {
        const data = item.data();
        const settings = normalizeVisibilitySettings(data);
        if (!settings.publicCollection && !settings.publicCard) return null;
        if (currentUser && item.id === currentUser.uid) return null;

        return {
            uid: item.id,
            name: data.publicDisplayName || 'Scent Explorer',
            photoURL: data.publicPhotoURL || '',
            publicCollectionEnabled: settings.publicCollection,
            publicCardEnabled: settings.publicCard,
            publicPerfumeCount: Number.isFinite(data.publicPerfumeCount) ? data.publicPerfumeCount : 0,
            publicNoteSummary: Array.isArray(data.publicNoteSummary) ? data.publicNoteSummary : [],
            publicCollectionPerfumes: Array.isArray(data.publicCollectionPerfumes) ? data.publicCollectionPerfumes : [],
            publicCardPerfumes: Array.isArray(data.publicCardPerfumes) ? data.publicCardPerfumes : []
        };
    }).filter(Boolean);
}

export async function savePerfumes(user, perfumes, visibilitySettings = DEFAULT_VISIBILITY_SETTINGS) {
    if (isFirebaseConfigured && user) {
        await setDoc(doc(db, 'users', user.uid), {
            perfumes,
            ...(user.email === DEFAULT_COLLECTION_OWNER_EMAIL ? { [OWNER_COLLECTION_RECOVERY_FLAG]: true } : {}),
            publicCollectionEnabled: !!visibilitySettings.publicCollection,
            publicCardEnabled: !!visibilitySettings.publicCard
        }, { merge: true });
        await syncPublicProfileDoc(user, perfumes, visibilitySettings);
    } else {
        saveLocal(perfumes);
    }
}
