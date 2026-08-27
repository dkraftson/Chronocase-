import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { Watch, WatchCollection, CaseSettings } from "../types";
import { DEFAULT_WATCHES, DEFAULT_COLLECTIONS } from "../data/defaultWatches";

export interface UserCloudData {
  collections: WatchCollection[];
  watches: Watch[];
  caseSettings: CaseSettings | null;
}

/**
 * Load all user collections, watches, and settings from Firestore.
 * If user has no existing watches in cloud, initializes with default grails.
 */
export async function loadUserDataFromFirestore(userId: string): Promise<UserCloudData> {
  try {
    // 1. Fetch Collections
    const collectionsRef = collection(db, "users", userId, "collections");
    const collectionsSnap = await getDocs(collectionsRef);
    let loadedCollections: WatchCollection[] = [];
    collectionsSnap.forEach((docSnap) => {
      loadedCollections.push(docSnap.data() as WatchCollection);
    });

    // 2. Fetch Watches
    const watchesRef = collection(db, "users", userId, "watches");
    const watchesSnap = await getDocs(watchesRef);
    let loadedWatches: Watch[] = [];
    watchesSnap.forEach((docSnap) => {
      loadedWatches.push(docSnap.data() as Watch);
    });

    // 3. Fetch Case Settings
    const settingsRef = doc(db, "users", userId, "settings", "caseSettings");
    const settingsSnap = await getDoc(settingsRef);
    let loadedSettings: CaseSettings | null = null;
    if (settingsSnap.exists()) {
      loadedSettings = settingsSnap.data() as CaseSettings;
    }

    // If fresh user account (no data in cloud yet), initialize cloud with defaults
    if (loadedWatches.length === 0 && loadedCollections.length === 0) {
      await initializeNewUserCloudData(userId, DEFAULT_WATCHES, DEFAULT_COLLECTIONS);
      return {
        collections: DEFAULT_COLLECTIONS,
        watches: DEFAULT_WATCHES,
        caseSettings: loadedSettings,
      };
    }

    return {
      collections: loadedCollections.length > 0 ? loadedCollections : DEFAULT_COLLECTIONS,
      watches: loadedWatches,
      caseSettings: loadedSettings,
    };
  } catch (error) {
    console.error("Error loading user data from Firestore:", error);
    throw error;
  }
}

/**
 * Initialize a newly registered user's cloud vault with seed watches and collections
 */
export async function initializeNewUserCloudData(
  userId: string,
  initialWatches: Watch[],
  initialCollections: WatchCollection[]
): Promise<void> {
  try {
    const batch = writeBatch(db);

    // Save profile metadata
    const userDocRef = doc(db, "users", userId);
    batch.set(userDocRef, {
      userId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // Save collections
    for (const col of initialCollections) {
      const colRef = doc(db, "users", userId, "collections", col.id);
      batch.set(colRef, { ...col, userId, updatedAt: new Date().toISOString() });
    }

    // Save watches
    for (const watch of initialWatches) {
      const watchRef = doc(db, "users", userId, "watches", watch.id);
      batch.set(watchRef, { ...watch, userId, updatedAt: new Date().toISOString() });
    }

    await batch.commit();
  } catch (error) {
    console.error("Error initializing new user cloud data:", error);
  }
}

/**
 * Save / Update a single watch in user's cloud Firestore
 */
export async function saveWatchToFirestore(userId: string, watch: Watch): Promise<void> {
  try {
    const watchRef = doc(db, "users", userId, "watches", watch.id);
    await setDoc(watchRef, {
      ...watch,
      userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving watch to Firestore:", error);
    throw error;
  }
}

/**
 * Delete a watch from user's cloud Firestore
 */
export async function deleteWatchFromFirestore(userId: string, watchId: string): Promise<void> {
  try {
    const watchRef = doc(db, "users", userId, "watches", watchId);
    await deleteDoc(watchRef);
  } catch (error) {
    console.error("Error deleting watch from Firestore:", error);
    throw error;
  }
}

/**
 * Save / Update a collection in user's cloud Firestore
 */
export async function saveCollectionToFirestore(
  userId: string,
  collectionItem: WatchCollection
): Promise<void> {
  try {
    const colRef = doc(db, "users", userId, "collections", collectionItem.id);
    await setDoc(colRef, {
      ...collectionItem,
      userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving collection to Firestore:", error);
    throw error;
  }
}

/**
 * Delete a collection from user's cloud Firestore
 */
export async function deleteCollectionFromFirestore(
  userId: string,
  collectionId: string
): Promise<void> {
  try {
    const colRef = doc(db, "users", userId, "collections", collectionId);
    await deleteDoc(colRef);
  } catch (error) {
    console.error("Error deleting collection from Firestore:", error);
    throw error;
  }
}

/**
 * Save Case & Lighting settings to user's cloud Firestore
 */
export async function saveCaseSettingsToFirestore(
  userId: string,
  settings: CaseSettings
): Promise<void> {
  try {
    const settingsRef = doc(db, "users", userId, "settings", "caseSettings");
    await setDoc(settingsRef, {
      ...settings,
      userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving settings to Firestore:", error);
  }
}

/**
 * Sync entire local workspace into cloud Firestore (for one-click Cloud Backup / Sync)
 */
export async function syncLocalWorkspaceToCloud(
  userId: string,
  watches: Watch[],
  collections: WatchCollection[],
  settings: CaseSettings
): Promise<void> {
  try {
    const batch = writeBatch(db);

    // Save profile update
    const userDocRef = doc(db, "users", userId);
    batch.set(userDocRef, { userId, updatedAt: new Date().toISOString() }, { merge: true });

    // Save settings
    const settingsRef = doc(db, "users", userId, "settings", "caseSettings");
    batch.set(settingsRef, { ...settings, userId, updatedAt: new Date().toISOString() });

    // Save collections
    for (const col of collections) {
      const colRef = doc(db, "users", userId, "collections", col.id);
      batch.set(colRef, { ...col, userId, updatedAt: new Date().toISOString() });
    }

    // Save watches
    for (const w of watches) {
      const watchRef = doc(db, "users", userId, "watches", w.id);
      batch.set(watchRef, { ...w, userId, updatedAt: new Date().toISOString() });
    }

    await batch.commit();
  } catch (error) {
    console.error("Error syncing local workspace to cloud:", error);
    throw error;
  }
}
