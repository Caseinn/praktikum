import { redis } from "@/lib/core/redis";

const memoryStore = new Map<string, number>();
const NONCE_TTL_SECONDS = 60;

function getNonceKey(userId: string, sessionId: string, nonce: string): string {
  return `checkin:nonce:${userId}:${sessionId}:${nonce}`;
}

export async function issueCheckinNonce(
  userId: string,
  sessionId: string
): Promise<string> {
  const nonce = crypto.randomUUID();
  const key = getNonceKey(userId, sessionId, nonce);

  if (redis) {
    await redis.set(key, "1", { ex: NONCE_TTL_SECONDS });
    return nonce;
  }

  memoryStore.set(key, Date.now() + NONCE_TTL_SECONDS * 1000);
  return nonce;
}

export async function consumeCheckinNonce(
  userId: string,
  sessionId: string,
  nonce: string
): Promise<boolean> {
  const key = getNonceKey(userId, sessionId, nonce);

  if (redis) {
    const exists = await redis.get<string>(key);
    if (!exists) return false;
    await redis.del(key);
    return true;
  }

  const expiresAt = memoryStore.get(key);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    memoryStore.delete(key);
    return false;
  }

  memoryStore.delete(key);
  return true;
}
