const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const DB_NAME = 'ielts_practice_audio';
const DB_VERSION = 1;
const KEY_STORE = 'keys';
const AUDIO_STORE = 'audio';
const AUDIO_KEY_ID = 'audio-session-key';

export interface PersistedAudio {
  base64: string;
  mimeType: string;
}

interface StoredAudioRecord {
  part: string;
  mimeType: string;
  iv: ArrayBuffer;
  encryptedAudio: ArrayBuffer;
  updatedAt: number;
}

let databasePromise: Promise<IDBDatabase> | null = null;
let encryptionKeyPromise: Promise<CryptoKey> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) {
      reject(new Error('IndexedDB is unavailable'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(KEY_STORE)) {
        database.createObjectStore(KEY_STORE);
      }
      if (!database.objectStoreNames.contains(AUDIO_STORE)) {
        database.createObjectStore(AUDIO_STORE, { keyPath: 'part' });
      }
    };

    request.onerror = () => reject(request.error ?? new Error('Failed to open audio database'));
    request.onsuccess = () => resolve(request.result);
  });

  return databasePromise;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
    request.onsuccess = () => resolve(request.result);
  });
}

async function getStoredKey(database: IDBDatabase): Promise<CryptoKey | undefined> {
  const transaction = database.transaction(KEY_STORE, 'readonly');
  const request = transaction.objectStore(KEY_STORE).get(AUDIO_KEY_ID);
  return requestToPromise<CryptoKey | undefined>(request);
}

async function storeKey(database: IDBDatabase, key: CryptoKey): Promise<void> {
  const transaction = database.transaction(KEY_STORE, 'readwrite');
  await requestToPromise(transaction.objectStore(KEY_STORE).put(key, AUDIO_KEY_ID));
}

async function getOrCreateKey(): Promise<CryptoKey> {
  if (encryptionKeyPromise) return encryptionKeyPromise;

  encryptionKeyPromise = (async () => {
    const database = await openDatabase();
    const storedKey = await getStoredKey(database);
    if (storedKey) return storedKey;

    const key = await crypto.subtle.generateKey(
      { name: ALGORITHM, length: KEY_LENGTH },
      false,
      ['encrypt', 'decrypt'],
    );
    await storeKey(database, key);
    return key;
  })();

  return encryptionKeyPromise;
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  return new Blob([base64ToArrayBuffer(base64)], { type: mimeType });
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

export async function persistEncryptedAudio(
  part: string,
  base64: string,
  mimeType: string,
): Promise<void> {
  const [database, key] = await Promise.all([openDatabase(), getOrCreateKey()]);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encryptedAudio = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    base64ToArrayBuffer(base64),
  );
  const record: StoredAudioRecord = {
    part,
    mimeType,
    iv: iv.buffer.slice(0),
    encryptedAudio,
    updatedAt: Date.now(),
  };
  const transaction = database.transaction(AUDIO_STORE, 'readwrite');
  await requestToPromise(transaction.objectStore(AUDIO_STORE).put(record));
}

export async function readEncryptedAudio(part: string): Promise<PersistedAudio | null> {
  const database = await openDatabase();
  const transaction = database.transaction(AUDIO_STORE, 'readonly');
  const record = await requestToPromise<StoredAudioRecord | undefined>(
    transaction.objectStore(AUDIO_STORE).get(part),
  );

  if (!record) return null;

  const key = await getOrCreateKey();
  const decryptedAudio = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: new Uint8Array(record.iv) },
    key,
    record.encryptedAudio,
  );

  return {
    base64: arrayBufferToBase64(decryptedAudio),
    mimeType: record.mimeType,
  };
}

export async function deleteEncryptedAudio(part: string): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(AUDIO_STORE, 'readwrite');
  await requestToPromise(transaction.objectStore(AUDIO_STORE).delete(part));
}

export async function clearEncryptedAudio(): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(AUDIO_STORE, 'readwrite');
  await requestToPromise(transaction.objectStore(AUDIO_STORE).clear());
}
