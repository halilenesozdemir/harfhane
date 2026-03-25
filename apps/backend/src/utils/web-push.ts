function base64UrlDecode(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function importVapidPrivateKey(
  privateKeyBase64: string,
  publicKeyBase64: string
): Promise<CryptoKey> {
  const privateBytes = base64UrlDecode(privateKeyBase64);
  const publicBytes = base64UrlDecode(publicKeyBase64);

  return crypto.subtle.importKey(
    'jwk',
    {
      kty: 'EC',
      crv: 'P-256',
      d: base64UrlEncode(privateBytes),
      x: base64UrlEncode(publicBytes.slice(1, 33)),
      y: base64UrlEncode(publicBytes.slice(33, 65)),
    },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
}

async function buildVapidJwt(
  endpoint: string,
  privateKey: CryptoKey,
  publicKeyBase64: string,
  subject: string
): Promise<string> {
  const audience = new URL(endpoint).origin;
  const expiry = Math.floor(Date.now() / 1000) + 12 * 60 * 60;

  const headerB64 = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' }))
  );
  const payloadB64 = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify({ aud: audience, exp: expiry, sub: subject }))
  );

  const signingInput = `${headerB64}.${payloadB64}`;
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(signingInput)
  );

  return `vapid t=${signingInput}.${base64UrlEncode(signature)}, k=${publicKeyBase64}`;
}

export interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function sendPushNotification(
  subscription: PushSubscriptionData,
  vapidPrivateKey: string,
  vapidPublicKey: string,
  vapidSubject: string
): Promise<boolean> {
  const privateKey = await importVapidPrivateKey(vapidPrivateKey, vapidPublicKey);
  const authHeader = await buildVapidJwt(
    subscription.endpoint,
    privateKey,
    vapidPublicKey,
    vapidSubject
  );

  const res = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      TTL: '86400',
      'Content-Length': '0',
    },
  });

  return res.status === 201 || res.status === 200 || res.status === 202;
}
