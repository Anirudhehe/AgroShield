import { openDB } from "idb";

const DB_NAME = "agroshield-i18n";
const STORE_NAME = "locales";

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function cacheLocaleBundle(lng, bundle) {
  try {
    const db = await getDB();
    await db.put(STORE_NAME, bundle, lng);
    return true;
  } catch (e) {
    console.warn("cacheLocaleBundle error", e);
    return false;
  }
}

export async function getCachedLocale(lng) {
  try {
    const db = await getDB();
    const v = await db.get(STORE_NAME, lng);
    return v || null;
  } catch (e) {
    console.warn("getCachedLocale error", e);
    return null;
  }
}

// store per-disease long descriptions keyed by `disease:{lng}:{id}`
const DESC_STORE = "disease_descs";
async function ensureDescStore(db) {
  if (!db.objectStoreNames.contains(DESC_STORE))
    db.createObjectStore(DESC_STORE);
}

export async function cacheDiseaseDescription(lng, id, payload) {
  try {
    const db = await openDB(DB_NAME, 2, {
      upgrade(upDb) {
        ensureDescStore(upDb);
      },
    });
    await db.put(DESC_STORE, payload, `${lng}:${id}`);
    return true;
  } catch (e) {
    console.warn("cacheDiseaseDescription error", e);
    return false;
  }
}

export async function getCachedDiseaseDescription(lng, id) {
  try {
    const db = await openDB(DB_NAME, 2, {
      upgrade(upDb) {
        ensureDescStore(upDb);
      },
    });
    const v = await db.get(DESC_STORE, `${lng}:${id}`);
    return v || null;
  } catch (e) {
    console.warn("getCachedDiseaseDescription error", e);
    return null;
  }
}
