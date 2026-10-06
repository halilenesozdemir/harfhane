// Hashing both sides first gives equal-length inputs, so the comparison leaks
// neither the content nor the length of the secret.
async function sha256(value: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
}

export async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const [left, right] = await Promise.all([sha256(a), sha256(b)]);
  return crypto.subtle.timingSafeEqual(left, right);
}
