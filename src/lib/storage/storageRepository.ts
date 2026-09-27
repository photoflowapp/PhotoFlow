import {
  DatasetEnvelope,
  DatasetKey,
  EncryptionEnvelope,
  StorageManifest,
  WrappedKeyBundle,
} from '../../types';
import { decryptEnvelope, encryptPayload } from '../crypto/cryptoService';
import { getSupabaseClient, STORAGE_BUCKET } from '../supabase/client';

function requireSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }
  return supabase;
}

async function writeRawObject(userId: string, relativePath: string, content: string): Promise<void> {
  const supabase = requireSupabase();
  const fullPath = `${userId}/${relativePath}`;

  const blob = new Blob([content], { type: 'application/json' });
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(fullPath, blob, {
    upsert: true,
    contentType: 'application/json',
    cacheControl: '0',
  });
  if (error) {
    throw new Error(`Supabase Storage upload failed (${relativePath}): ${error.message}`);
  }
}

async function readRawObject(userId: string, relativePath: string): Promise<string | null> {
  const supabase = requireSupabase();
  const fullPath = `${userId}/${relativePath}`;

  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(fullPath);
  if (error) {
    if (
      error.message.toLowerCase().includes('not found') ||
      error.message.toLowerCase().includes('object not found') ||
      (error as { status?: number }).status === 400 ||
      (error as { status?: number }).status === 404
    ) {
      return null;
    }
    throw new Error(`Supabase Storage download failed (${relativePath}): ${error.message}`);
  }
  return await data.text();
}

export async function loadWrappedKeyBundle(userId: string): Promise<WrappedKeyBundle | null> {
  const raw = await readRawObject(userId, 'key-bundle.json');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WrappedKeyBundle;
  } catch {
    return null;
  }
}

export async function saveWrappedKeyBundle(
  userId: string,
  bundle: WrappedKeyBundle
): Promise<void> {
  await writeRawObject(userId, 'key-bundle.json', JSON.stringify(bundle, null, 2));
}

export async function loadEncryptedDataset<T>(
  userId: string,
  dataset: DatasetKey,
  dek: CryptoKey,
  fallbackData: T
): Promise<DatasetEnvelope<T>> {
  const raw = await readRawObject(userId, `${dataset}.enc`);
  if (!raw) {
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      data: fallbackData,
    };
  }

  const envelope = JSON.parse(raw) as EncryptionEnvelope;
  return await decryptEnvelope<DatasetEnvelope<T>>(envelope, dek);
}

export async function saveEncryptedDataset<T>(
  userId: string,
  dataset: DatasetKey,
  data: T,
  nextVersion: number,
  dek: CryptoKey
): Promise<{
  version: number;
  updatedAt: string;
  envelopeSample: EncryptionEnvelope;
}> {
  const updatedAt = new Date().toISOString();

  // Conflict check against latest stored version
  const existingRaw = await readRawObject(userId, `${dataset}.enc`);
  if (existingRaw) {
    try {
      const existingEnv = JSON.parse(existingRaw) as EncryptionEnvelope;
      const existingDecrypted = await decryptEnvelope<DatasetEnvelope<T>>(existingEnv, dek);
      if (existingDecrypted.version > nextVersion) {
        nextVersion = existingDecrypted.version + 1;
      }
    } catch {
      // Proceed with current encryption key
    }
  }

  const payload: DatasetEnvelope<T> = {
    version: nextVersion,
    updatedAt,
    data,
  };

  const encryptedEnvelope = await encryptPayload(payload, dek);
  const serialized = JSON.stringify(encryptedEnvelope);

  // Write canonical encrypted object: {userId}/{dataset}.enc
  await writeRawObject(userId, `${dataset}.enc`, serialized);

  // Also write versioned snapshot: {userId}/{dataset}/v-000001.enc
  const paddedVersion = String(nextVersion).padStart(6, '0');
  const versionedPath = `${dataset}/v-${paddedVersion}.enc`;
  try {
    await writeRawObject(userId, versionedPath, serialized);
  } catch {
    // Non-fatal if snapshot write is throttled
  }

  return {
    version: nextVersion,
    updatedAt,
    envelopeSample: encryptedEnvelope,
  };
}

export async function saveManifest(
  userId: string,
  manifest: StorageManifest,
  dek: CryptoKey
): Promise<void> {
  const envelope = await encryptPayload(manifest, dek);
  await writeRawObject(userId, 'manifest.enc', JSON.stringify(envelope));
}

export async function inspectRawEncryptedEnvelope(
  userId: string,
  dataset: DatasetKey
): Promise<EncryptionEnvelope | null> {
  const raw = await readRawObject(userId, `${dataset}.enc`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as EncryptionEnvelope;
  } catch {
    return null;
  }
}

export async function wipeAllUserStorageObjects(userId: string): Promise<void> {
  const supabase = requireSupabase();

  const datasets: DatasetKey[] = [
    'clients',
    'projects',
    'tasks',
    'payments',
    'activities',
    'settings',
  ];

  const pathsToRemove = [
    ...datasets.map((d) => `${userId}/${d}.enc`),
    `${userId}/manifest.enc`,
  ];

  for (const d of datasets) {
    const { data: versionFiles } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(`${userId}/${d}`);
    if (versionFiles && versionFiles.length > 0) {
      for (const vf of versionFiles) {
        pathsToRemove.push(`${userId}/${d}/${vf.name}`);
      }
    }
  }

  await supabase.storage.from(STORAGE_BUCKET).remove(pathsToRemove);
}
