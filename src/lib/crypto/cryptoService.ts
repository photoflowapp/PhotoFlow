import { EncryptionEnvelope, WrappedKeyBundle } from '../../types';

const PBKDF2_ITERATIONS = 250000;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveKekFromPassphrase(
  passphrase: string,
  salt: Uint8Array,
  iterations: number = PBKDF2_ITERATIONS
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase) as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['wrapKey', 'unwrapKey', 'encrypt', 'decrypt']
  );
}

export async function generateUserDataKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function createWrappedKeyBundle(
  dek: CryptoKey,
  passphrase: string
): Promise<WrappedKeyBundle> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const wrapIv = crypto.getRandomValues(new Uint8Array(12));
  const kek = await deriveKekFromPassphrase(passphrase, salt, PBKDF2_ITERATIONS);

  const rawDek = await crypto.subtle.exportKey('raw', dek);
  const wrappedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: wrapIv as BufferSource },
    kek,
    rawDek
  );

  const verifyIv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const verificationBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: verifyIv as BufferSource },
    dek,
    encoder.encode('PHOTOFLOW_KEY_VERIFIED_V1') as BufferSource
  );

  return {
    version: 1,
    kdf: 'PBKDF2-SHA256',
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToBase64(salt),
    wrapIv: bytesToBase64(wrapIv),
    wrappedKey: bytesToBase64(new Uint8Array(wrappedBuffer)),
    verificationCiphertext: `${bytesToBase64(verifyIv)}:${bytesToBase64(new Uint8Array(verificationBuffer))}`,
    createdAt: new Date().toISOString(),
  };
}

export async function unwrapKeyBundle(
  bundle: WrappedKeyBundle,
  passphrase: string
): Promise<CryptoKey> {
  const salt = base64ToBytes(bundle.salt);
  const wrapIv = base64ToBytes(bundle.wrapIv);
  const wrappedBytes = base64ToBytes(bundle.wrappedKey);

  const kek = await deriveKekFromPassphrase(passphrase, salt, bundle.iterations || PBKDF2_ITERATIONS);

  let rawDekBuffer: ArrayBuffer;
  try {
    rawDekBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: wrapIv as BufferSource },
      kek,
      wrappedBytes as BufferSource
    );
  } catch {
    throw new Error('Incorrect encryption passphrase.');
  }

  const dek = await crypto.subtle.importKey(
    'raw',
    rawDekBuffer,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  if (bundle.verificationCiphertext) {
    const [verifyIvB64, verifyCipherB64] = bundle.verificationCiphertext.split(':');
    const verifyIv = base64ToBytes(verifyIvB64);
    const verifyCipher = base64ToBytes(verifyCipherB64);
    const decryptedVerify = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: verifyIv as BufferSource },
      dek,
      verifyCipher as BufferSource
    );
    const verifyText = new TextDecoder().decode(decryptedVerify);
    if (verifyText !== 'PHOTOFLOW_KEY_VERIFIED_V1') {
      throw new Error('Key verification failed.');
    }
  }

  return dek;
}

export async function encryptPayload<T>(
  payload: T,
  dek: CryptoKey
): Promise<EncryptionEnvelope> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    dek,
    encoded as BufferSource
  );

  return {
    version: 1,
    algorithm: 'AES-GCM',
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encryptedBuffer)),
    encryptedAt: new Date().toISOString(),
  };
}

export async function decryptEnvelope<T>(
  envelope: EncryptionEnvelope,
  dek: CryptoKey
): Promise<T> {
  if (!envelope || envelope.algorithm !== 'AES-GCM' || !envelope.iv || !envelope.ciphertext) {
    throw new Error('Malformed encrypted object.');
  }

  const iv = base64ToBytes(envelope.iv);
  const cipherBytes = base64ToBytes(envelope.ciphertext);

  try {
    const plainBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      dek,
      cipherBytes as BufferSource
    );
    const jsonString = new TextDecoder().decode(plainBuffer);
    return JSON.parse(jsonString) as T;
  } catch {
    throw new Error('Failed to decrypt Storage object.');
  }
}
