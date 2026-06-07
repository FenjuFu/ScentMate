import { db, isFirebaseConfigured } from './firebase-config.js';
import { collection, doc, getDoc, getDocs, query, setDoc, where, addDoc, updateDoc, deleteDoc, serverTimestamp, arrayUnion, increment, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-lite.js";

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
        musicId: String(collection.musicId || '').trim(),
        musicTitle: String(collection.musicTitle || '').trim(),
        musicComposer: String(collection.musicComposer || '').trim(),
        musicUrl: String(collection.musicUrl || '').trim(),
        musicProvider: String(collection.musicProvider || '').trim(),
        musicLinkLabel: String(collection.musicLinkLabel || '').trim(),
        musicReason: String(collection.musicReason || '').trim(),
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
        musicId: collection.musicId || '',
        musicTitle: collection.musicTitle || '',
        musicComposer: collection.musicComposer || '',
        musicUrl: collection.musicUrl || '',
        musicProvider: collection.musicProvider || '',
        musicLinkLabel: collection.musicLinkLabel || '',
        musicReason: collection.musicReason || '',
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

// Wipe the locally cached collections. Called on explicit logout so the next
// guest viewer on this browser starts from an empty collection instead of the
// previous account's perfumes.
export function clearLocal() {
    try {
        localStorage.removeItem(LS_KEY);
        localStorage.removeItem(LEGACY_LS_KEY);
    } catch (e) {
        // Storage access blocked (private mode etc.) — nothing to do.
    }
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

    return createSeedCollections([], defaultSettings);
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
            musicId: entry.musicId || '',
            musicTitle: entry.musicTitle || '',
            musicComposer: entry.musicComposer || '',
            musicUrl: entry.musicUrl || '',
            musicProvider: entry.musicProvider || '',
            musicLinkLabel: entry.musicLinkLabel || '',
            musicReason: entry.musicReason || '',
            updatedAt: entry.updatedAt || ''
        }));
    });
}

const CARD_LIKES_COLLECTION = 'cardLikes';
const CARD_COMMENTS_COLLECTION = 'cardComments';
const MAX_COMMENT_LEN = 500;

function cardSocialId(ownerUid, collectionId) {
    return `${ownerUid}_${collectionId}`;
}

export async function loadCardLikes(ownerUid, collectionId, currentUid = null) {
    if (!isFirebaseConfigured || !ownerUid || !collectionId) return { count: 0, likedByMe: false };
    try {
        const snap = await getDoc(doc(db, CARD_LIKES_COLLECTION, cardSocialId(ownerUid, collectionId)));
        if (!snap.exists()) return { count: 0, likedByMe: false };
        const data = snap.data();
        const likers = Array.isArray(data.likers) ? data.likers : [];
        return {
            count: Number.isFinite(data.count) ? data.count : likers.length,
            likedByMe: currentUid ? likers.includes(currentUid) : false
        };
    } catch (error) {
        return { count: 0, likedByMe: false };
    }
}

export async function toggleCardLike(ownerUid, collectionId, currentUser) {
    if (!isFirebaseConfigured || !currentUser) throw new Error('not-signed-in');
    if (!currentUser.emailVerified) throw new Error('email-not-verified');
    const ref = doc(db, CARD_LIKES_COLLECTION, cardSocialId(ownerUid, collectionId));
    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data() : null;
    const likers = data && Array.isArray(data.likers) ? data.likers : [];
    const alreadyLiked = likers.includes(currentUser.uid);
    if (alreadyLiked) {
        const nextLikers = likers.filter(u => u !== currentUser.uid);
        await setDoc(ref, {
            ownerUid,
            collectionId,
            likers: nextLikers,
            count: nextLikers.length
        }, { merge: true });
        return { count: nextLikers.length, likedByMe: false };
    }
    await setDoc(ref, {
        ownerUid,
        collectionId,
        likers: arrayUnion(currentUser.uid),
        count: increment(1)
    }, { merge: true });
    return { count: (data?.count || likers.length) + 1, likedByMe: true };
}

export async function loadCardComments(ownerUid, collectionId, currentUid = null) {
    if (!isFirebaseConfigured || !ownerUid || !collectionId) return [];
    try {
        const ref = collection(db, CARD_COMMENTS_COLLECTION);
        const snap = await getDocs(query(
            ref,
            where('cardOwnerUid', '==', ownerUid),
            where('collectionId', '==', collectionId),
            orderBy('createdAt', 'desc'),
            limit(80)
        ));
        return snap.docs
            .map(item => {
                const data = item.data() || {};
                const reportedBy = Array.isArray(data.reportedBy) ? data.reportedBy : [];
                const isHidden = !!data.isHidden;
                const isAuthor = currentUid && data.authorUid === currentUid;
                if (isHidden && !isAuthor) return null;
                return {
                    id: item.id,
                    cardOwnerUid: data.cardOwnerUid,
                    collectionId: data.collectionId,
                    authorUid: data.authorUid,
                    authorName: data.authorName || 'Scent Explorer',
                    authorPhotoURL: data.authorPhotoURL || '',
                    text: data.text || '',
                    createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (typeof data.createdAt === 'number' ? data.createdAt : Date.now()),
                    isHidden,
                    reportedByMe: currentUid ? reportedBy.includes(currentUid) : false,
                    isAuthor
                };
            })
            .filter(Boolean);
    } catch (error) {
        return [];
    }
}

export async function postCardComment(ownerUid, collectionId, currentUser, text, displayName, photoURL = '') {
    if (!isFirebaseConfigured || !currentUser) throw new Error('not-signed-in');
    if (!currentUser.emailVerified) throw new Error('email-not-verified');
    const clean = String(text || '').trim().slice(0, MAX_COMMENT_LEN);
    if (clean.length < 2) throw new Error('comment-too-short');
    const ref = collection(db, CARD_COMMENTS_COLLECTION);
    const docRef = await addDoc(ref, {
        cardOwnerUid: ownerUid,
        collectionId,
        authorUid: currentUser.uid,
        authorName: displayName || 'Scent Explorer',
        authorPhotoURL: photoURL || '',
        text: clean,
        createdAt: serverTimestamp(),
        isHidden: false,
        reportedBy: []
    });
    return docRef.id;
}

export async function reportCardComment(commentId, currentUser) {
    if (!isFirebaseConfigured || !currentUser) throw new Error('not-signed-in');
    if (!currentUser.emailVerified) throw new Error('email-not-verified');
    const ref = doc(db, CARD_COMMENTS_COLLECTION, commentId);
    await updateDoc(ref, {
        isHidden: true,
        reportedBy: arrayUnion(currentUser.uid)
    });
}

export async function deleteCardComment(commentId) {
    if (!isFirebaseConfigured) throw new Error('not-configured');
    const ref = doc(db, CARD_COMMENTS_COLLECTION, commentId);
    await deleteDoc(ref);
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
