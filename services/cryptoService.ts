
/**
 * MCP Crypto Kernel v1.0
 * Fornece criptografia autenticada AES-GCM (256-bit) para o estado persistente.
 */

const ENCRYPTION_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const SALT = new Uint8Array([10, 55, 99, 120, 4, 88, 201, 42, 11, 7, 33, 90, 44, 101, 2, 19]); // Salt estático para derivação

async function getEncryptionKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: SALT,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(data: any, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await getEncryptionKey(secret);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedData = encoder.encode(JSON.stringify(data));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: ENCRYPTION_ALGORITHM, iv },
    key,
    encodedData
  );

  // Combina IV + Dados Criptografados e converte para Base64
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decryptData(encryptedBase64: string, secret: string): Promise<any> {
  try {
    const combined = new Uint8Array(
      atob(encryptedBase64)
        .split('')
        .map(c => c.charCodeAt(0))
    );

    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const key = await getEncryptionKey(secret);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: ENCRYPTION_ALGORITHM, iv },
      key,
      data
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decryptedBuffer));
  } catch (e) {
    console.error("Crypto Fault: Falha na descriptografia do cofre.", e);
    throw new Error("SECRET_MISMATCH");
  }
}
