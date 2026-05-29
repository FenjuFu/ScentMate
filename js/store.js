import { db, isFirebaseConfigured } from './firebase-config.js';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const LS_KEY = 'scent_collections';
const LEGACY_LS_KEY = 'scent_perfumes';
const DEFAULT_COLLECTION_OWNER_EMAIL = 'fufenju@pku.edu.cn';
const OWNER_COLLECTION_RECOVERY_FLAG = 'ownerDefaultsRecovered';
const PUBLIC_PROFILES_COLLECTION = 'publicProfiles';

export const DEFAULT_VISIBILITY_SETTINGS = Object.freeze({
    publicCollection: false,
    publicCard: false
});

function cloneValue(value) {
    return JSON.parse(JSON.stringify(value));
}

function getDefaultCollectionName(index = 1, isEn = false) {
    return isEn ? `Collection ${index}` : `收藏夹 ${index}`;
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

export function createCollection(collection = {}, defaultSettings = DEFAULT_VISIBILITY_SETTINGS, index = 1) {
    const normalizedDefaults = normalizeVisibilitySettings({
        publicCollectionEnabled: defaultSettings.publicCollection,
        publicCardEnabled: defaultSettings.publicCard
    });

    return {
        id: String(collection.id || `col-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
        name: String(collection.name || getDefaultCollectionName(index)).trim() || getDefaultCollectionName(index),
        perfumes: Array.isArray(collection.perfumes) ? cloneValue(collection.perfumes) : [],
        publicCollectionEnabled: 'publicCollectionEnabled' in collection ? !!collection.publicCollectionEnabled : normalizedDefaults.publicCollection,
        publicCardEnabled: 'publicCardEnabled' in collection ? !!collection.publicCardEnabled : normalizedDefaults.publicCard,
        cardTitle: String(collection.cardTitle || '').trim(),
        cardQuote: String(collection.cardQuote || '').trim(),
        createdAt: collection.createdAt || new Date().toISOString(),
        updatedAt: collection.updatedAt || new Date().toISOString()
    };
}

function normalizeCollections(rawCollections = [], defaultSettings = DEFAULT_VISIBILITY_SETTINGS) {
    const source = Array.isArray(rawCollections) ? rawCollections : [];
    const normalized = source.map((item, index) => createCollection(item, defaultSettings, index + 1));
    return normalized.length > 0 ? normalized : [createCollection({}, defaultSettings, 1)];
}

function createSeedCollections(defaults = [], defaultSettings = DEFAULT_VISIBILITY_SETTINGS) {
    return normalizeCollections([
        {
            name: defaults.length > 0 ? '默认收藏夹' : getDefaultCollectionName(1),
            perfumes: defaults
        }
    ], defaultSettings);
}

function loadLocal(defaults, defaultSettings = DEFAULT_VISIBILITY_SETTINGS) {
    try {
        const storedCollections = localStorage.getItem(LS_KEY);
        if (storedCollections) {
            const parsed = JSON.parse(storedCollections);
            return normalizeCollections(parsed, defaultSettings);
        }

        const legacyPerfumes = localStorage.getItem(LEGACY_LS_KEY);
        if (legacyPerfumes) {
            const parsedPerfumes = JSON.parse(legacyPerfumes);
            if (Array.isArray(parsedPerfumes)) {
                return createSeedCollections(parsedPerfumes, defaultSettings);
            }
        }
    } catch (error) {
        // corrupted storage
    }

    return createSeedCollections(defaults, defaultSettings);
}

function saveLocal(collections) {
    localStorage.setItem(LS_KEY, JSON.stringify(collections));
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

function buildPublicCollectionFields(collectionData) {
    const collection = createCollection(collectionData);
    const isPublic = collection.publicCollectionEnabled || collection.publicCardEnabled;
    if (!isPublic) return null;

    const publicNotes = collectUniqueNotes(collection.perfumes);
    return {
        collectionId: collection.id,
        collectionName: collection.name,
        publicCollectionEnabled: collection.publicCollectionEnabled,
        publicCardEnabled: collection.publicCardEnabled,
        publicPerfumeCount: collection.perfumes.length,
        publicNoteSummary: publicNotes,
        publicCollectionPerfumes: collection.publicCollectionEnabled ? cloneValue(collection.perfumes) : [],
        publicCardPerfumes: collection.publicCardEnabled ? cloneValue(collection.perfumes) : [],
        cardTitle: collection.cardTitle || '',
        cardQuote: collection.cardQuote || '',
        updatedAt: collection.updatedAt
    };
}

function buildPublicDocFields(user, collections = []) {
    const publicCollections = normalizeCollections(collections).map(buildPublicCollectionFields).filter(Boolean);
    const aggregateNotes = new Set();
    let aggregatePerfumes = 0;

    publicCollections.forEach((item) => {
        item.publicNoteSummary.forEach(note => aggregateNotes.add(note));
        aggregatePerfumes += item.publicPerfumeCount;
    });

    return {
        isPublic: publicCollections.length > 0,
        publicDisplayName: getUserDisplayName(user),
        publicPhotoURL: user?.photoURL || '',
        publicCollectionCount: publicCollections.length,
        publicPerfumeCount: aggregatePerfumes,
        publicNoteSummary: Array.from(aggregateNotes),
        publicCollections
    };
}

async function syncPublicProfileDoc(user, collections = []) {
    if (!isFirebaseConfigured || !user) return;
    await setDoc(doc(db, PUBLIC_PROFILES_COLLECTION, user.uid), buildPublicDocFields(user, collections), { merge: true });
}

export function loadLocalSync(defaults, defaultSettings = DEFAULT_VISIBILITY_SETTINGS) {
    return loadLocal(defaults, defaultSettings);
}

export async function loadPerfumes(user, defaults, defaultSettings = DEFAULT_VISIBILITY_SETTINGS) {
    if (isFirebaseConfigured && user) {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const data = snap.data();
            const visibilitySettings = normalizeVisibilitySettings(data);

            if (Array.isArray(data.collections)) {
                const collections = normalizeCollections(data.collections, visibilitySettings);
                await syncPublicProfileDoc(user, collections);
                return collections;
            }

            if (Array.isArray(data.perfumes)) {
                const shouldRecoverOwnerDefaults =
                    user.email === DEFAULT_COLLECTION_OWNER_EMAIL &&
                    data.perfumes.length === 0 &&
                    !data[OWNER_COLLECTION_RECOVERY_FLAG];
                const migratedPerfumes = shouldRecoverOwnerDefaults ? defaults : data.perfumes;
                const collections = createSeedCollections(migratedPerfumes, visibilitySettings);

                await setDoc(ref, {
                    collections,
                    ...(shouldRecoverOwnerDefaults ? { [OWNER_COLLECTION_RECOVERY_FLAG]: true } : {})
                }, { merge: true });
                await syncPublicProfileDoc(user, collections);
                return collections;
            }
        }

        const seededCollections = user.email === DEFAULT_COLLECTION_OWNER_EMAIL
            ? createSeedCollections(defaults, defaultSettings)
            : createSeedCollections([], defaultSettings);
        await setDoc(ref, {
            collections: seededCollections,
            [OWNER_COLLECTION_RECOVERY_FLAG]: user.email === DEFAULT_COLLECTION_OWNER_EMAIL,
            publicCollectionEnabled: !!defaultSettings.publicCollection,
            publicCardEnabled: !!defaultSettings.publicCard
        }, { merge: true });
        await syncPublicProfileDoc(user, seededCollections);
        return seededCollections;
    }

    return loadLocal(defaults, defaultSettings);
}

export async function loadUserVisibilitySettings(user) {
    if (!isFirebaseConfigured || !user) {
        return { ...DEFAULT_VISIBILITY_SETTINGS };
    }

    const snap = await getDoc(doc(db, 'users', user.uid));
    if (!snap.exists()) return { ...DEFAULT_VISIBILITY_SETTINGS };
    return normalizeVisibilitySettings(snap.data());
}

export async function saveUserVisibilitySettings(user, settings, collections = []) {
    const normalized = normalizeVisibilitySettings({
        publicCollectionEnabled: settings?.publicCollection,
        publicCardEnabled: settings?.publicCard
    });

    if (!isFirebaseConfigured || !user) {
        return normalized;
    }

    await setDoc(doc(db, 'users', user.uid), {
        publicCollectionEnabled: normalized.publicCollection,
        publicCardEnabled: normalized.publicCard
    }, { merge: true });
    await syncPublicProfileDoc(user, collections);
    return normalized;
}

export async function loadPublicUsers(currentUser = null) {
    if (!isFirebaseConfigured) return [];

    const snap = await getDocs(query(collection(db, PUBLIC_PROFILES_COLLECTION), where('isPublic', '==', true)));
    return snap.docs.flatMap((item) => {
        if (currentUser && item.id === currentUser.uid) return [];

        const data = item.data();
        const ownerName = data.publicDisplayName || 'Scent Explorer';
        const ownerPhotoURL = data.publicPhotoURL || '';
        const publicCollections = Array.isArray(data.publicCollections) ? data.publicCollections : [];

        return publicCollections.map((entry) => ({
            uid: item.id,
            ownerName,
            photoURL: ownerPhotoURL,
            name: ownerName,
            collectionId: entry.collectionId,
            collectionName: entry.collectionName || getDefaultCollectionName(1),
            publicCollectionEnabled: !!entry.publicCollectionEnabled,
            publicCardEnabled: !!entry.publicCardEnabled,
            publicPerfumeCount: Number.isFinite(entry.publicPerfumeCount) ? entry.publicPerfumeCount : 0,
            publicNoteSummary: Array.isArray(entry.publicNoteSummary) ? entry.publicNoteSummary : [],
            publicCollectionPerfumes: Array.isArray(entry.publicCollectionPerfumes) ? entry.publicCollectionPerfumes : [],
            publicCardPerfumes: Array.isArray(entry.publicCardPerfumes) ? entry.publicCardPerfumes : [],
            cardTitle: entry.cardTitle || '',
            cardQuote: entry.cardQuote || '',
            updatedAt: entry.updatedAt || ''
        }));
    });
}

export async function savePerfumes(user, collections, visibilitySettings = DEFAULT_VISIBILITY_SETTINGS) {
    const normalizedCollections = normalizeCollections(collections, visibilitySettings);
    if (isFirebaseConfigured && user) {
        await setDoc(doc(db, 'users', user.uid), {
            collections: normalizedCollections,
            ...(user.email === DEFAULT_COLLECTION_OWNER_EMAIL ? { [OWNER_COLLECTION_RECOVERY_FLAG]: true } : {}),
            publicCollectionEnabled: !!visibilitySettings.publicCollection,
            publicCardEnabled: !!visibilitySettings.publicCard
        }, { merge: true });
        await syncPublicProfileDoc(user, normalizedCollections);
    } else {
        saveLocal(normalizedCollections);
    }
}
