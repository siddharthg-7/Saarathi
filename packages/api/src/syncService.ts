import {
  DocumentReference,
  runTransaction,
  serverTimestamp,
  SnapshotMetadata,
} from 'firebase/firestore';
import { db } from './firebase';
import { ConflictResolutionStrategy, SyncMetadata } from '@saarathi/types';

/**
 * Parses snapshot metadata into standard Saarathi SyncMetadata.
 */
export function extractSyncMetadata(metadata: SnapshotMetadata): SyncMetadata {
  return {
    hasPendingWrites: metadata.hasPendingWrites,
    fromCache: metadata.fromCache,
    lastSyncedAt: new Date().toISOString(),
  };
}

/**
 * Field-level merge and conflict resolution for entities with versioning.
 */
export function resolveConflict<T extends Record<string, any> & { version?: number; updatedAt?: string }>(
  localDoc: T,
  remoteDoc: T,
  strategy: ConflictResolutionStrategy = 'field_merge'
): T {
  if (strategy === 'server_wins') {
    return { ...remoteDoc, syncStatus: 'synced' };
  }

  if (strategy === 'client_wins') {
    const nextVersion = Math.max(localDoc.version || 0, remoteDoc.version || 0) + 1;
    return { ...localDoc, version: nextVersion, syncStatus: 'pending' };
  }

  // Field-level merge: combine fields, prioritizing local non-null modifications,
  // incrementing version to ensure deterministic state across clients.
  const merged: Record<string, any> = { ...remoteDoc };

  Object.keys(localDoc).forEach((key) => {
    if (key === 'id' || key === 'uid' || key === 'createdAt') return;
    
    const localVal = localDoc[key];
    const remoteVal = remoteDoc[key];

    if (localVal !== undefined && localVal !== null && localVal !== remoteVal) {
      // If local value is empty string but remote has content, preserve remote value
      if (typeof localVal === 'string' && localVal === '' && typeof remoteVal === 'string' && remoteVal !== '') {
        merged[key] = remoteVal;
      } else if (Array.isArray(localVal) && Array.isArray(remoteVal)) {
        merged[key] = localVal.length ? localVal : remoteVal;
      } else {
        merged[key] = localVal;
      }
    }
  });

  const nextVersion = Math.max(localDoc.version || 1, remoteDoc.version || 1) + 1;
  merged.version = nextVersion;
  merged.syncStatus = 'pending';

  return merged as T;
}

/**
 * Runs a Firestore transaction with version check and optimistic concurrency control (OCC).
 */
export async function executeVersionedTransaction<T extends Record<string, any> & { version?: number }>(
  docRef: DocumentReference,
  updates: Partial<T>,
  expectedBaseVersion?: number
): Promise<{ success: boolean; version: number }> {
  let finalVersion = 1;

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(docRef);

    if (!snap.exists()) {
      finalVersion = updates.version || 1;
      transaction.set(docRef, {
        ...updates,
        version: finalVersion,
        createdAt: updates.createdAt || new Date().toISOString(),
        updatedAt: serverTimestamp(),
      });
      return;
    }

    const remoteData = snap.data();
    const currentRemoteVersion = remoteData.version || 1;

    // Check for version conflict
    if (expectedBaseVersion !== undefined && currentRemoteVersion > expectedBaseVersion) {
      // Conflict detected! Perform field-level resolution inside transaction
      const resolved = resolveConflict(
        { ...remoteData, ...updates } as T,
        remoteData as T,
        'field_merge'
      );
      finalVersion = resolved.version || currentRemoteVersion + 1;
      transaction.update(docRef, {
        ...resolved,
        version: finalVersion,
        updatedAt: serverTimestamp(),
      });
      return;
    }

    finalVersion = currentRemoteVersion + 1;
    transaction.update(docRef, {
      ...updates,
      version: finalVersion,
      updatedAt: serverTimestamp(),
    });
  });

  return { success: true, version: finalVersion };
}
