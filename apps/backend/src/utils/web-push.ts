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

async function hmacSha256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, data) as ArrayBuffer);
}

async function hkdfExpand(prk: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const blocks = Math.ceil(length / 32);
  const result = new Uint8Array(blocks * 32);
  let prev: Uint8Array = new Uint8Array(0);
  for (let i = 0; i < blocks; i++) {
    const input = new Uint8Array(prev.length + info.length + 1);
    input.set(prev);
    input.set(info, prev.length);
    input[prev.length + info.length] = i + 1;
    const block = await hmacSha256(prk, input);
    result.set(block, i * 32);
    prev = block;
  }
  return result.slice(0, length);
}

async function encryptWebPushPayload(
  plaintext: Uint8Array,
  p256dhBase64: string,
  authBase64: string
): Promise<Uint8Array> {
  const clientPublicKey = base64UrlDecode(p256dhBase64);
  const authSecret = base64UrlDecode(authBase64);
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const serverKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']
  ) as CryptoKeyPair;
  const serverPublicKey = new Uint8Array(
    await crypto.subtle.exportKey('raw', serverKeyPair.publicKey) as ArrayBuffer
  );
  const clientKey = await crypto.subtle.importKey(
    'raw', clientPublicKey, { name: 'ECDH', namedCurve: 'P-256' }, false, []
  );
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'ECDH', $public: clientKey },
      serverKeyPair.privateKey,
      256
    )
  );

  const prkKey = await hmacSha256(authSecret, sharedSecret);

  const keyInfoLabel = new TextEncoder().encode('WebPush: info\x00');
  const keyInfo = new Uint8Array(keyInfoLabel.length + clientPublicKey.length + serverPublicKey.length);
  keyInfo.set(keyInfoLabel);
  keyInfo.set(clientPublicKey, keyInfoLabel.length);
  keyInfo.set(serverPublicKey, keyInfoLabel.length + clientPublicKey.length);
  const ikm = await hkdfExpand(prkKey, keyInfo, 32);

  const prk = await hmacSha256(salt, ikm);
  const cek = await hkdfExpand(prk, new TextEncoder().encode('Content-Encoding: aes128gcm\x00'), 16);
  const nonce = await hkdfExpand(prk, new TextEncoder().encode('Content-Encoding: nonce\x00'), 12);

  const aesKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const padded = new Uint8Array(plaintext.length + 1);
  padded.set(plaintext);
  padded[plaintext.length] = 0x02;
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, padded)
  );

  const header = new Uint8Array(16 + 4 + 1 + 65);
  header.set(salt);
  new DataView(header.buffer).setUint32(16, 4096, false);
  header[20] = 65;
  header.set(serverPublicKey, 21);

  const body = new Uint8Array(header.length + ciphertext.length);
  body.set(header);
  body.set(ciphertext, header.length);
  return body;
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
      kty: 'EC', crv: 'P-256',
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

export interface PushPayload {
  title: string;
  body: string;
  url: string;
}

export async function sendPushNotification(
  subscription: PushSubscriptionData,
  vapidPrivateKey: string,
  vapidPublicKey: string,
  vapidSubject: string,
  payload: PushPayload
): Promise<boolean> {
  const privateKey = await importVapidPrivateKey(vapidPrivateKey, vapidPublicKey);
  const authHeader = await buildVapidJwt(
    subscription.endpoint, privateKey, vapidPublicKey, vapidSubject
  );

  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const encryptedBody = await encryptWebPushPayload(plaintext, subscription.p256dh, subscription.auth);

  const res = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      TTL: '86400',
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'Content-Length': String(encryptedBody.length),
    },
    body: encryptedBody,
  });

  return res.status === 201 || res.status === 200 || res.status === 202;
}
