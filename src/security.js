import crypto from 'node:crypto';
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');
export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
export function safeEqual(a, b) {
  const x = Buffer.from(String(a ?? '')); const y = Buffer.from(String(b ?? ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
export async function hashPassword(password, salt = randomToken(16)) {
  const derived = await new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (e, key) => e ? reject(e) : resolve(key)));
  return { salt, hash: Buffer.from(derived).toString('hex') };
}
export async function verifyPassword(password, stored) {
  const derived = await new Promise((resolve, reject) => crypto.scrypt(password, stored.salt, 64, (e, key) => e ? reject(e) : resolve(key)));
  return safeEqual(Buffer.from(derived).toString('hex'), stored.hash);
}
