// Web Crypto API client-side End-to-End Encryption (E2EE)
// Secures private notes and medical journals directly inside the user's browser.
// Private keys are never transmitted to the cloud, ensuring Zero-Knowledge security.

const DEFAULT_SALT = "mental-health-salt-protective-2026";

/**
 * Derives a secure cryptographic key from a user passphrase using PBKDF2 (SHA-256).
 */
export async function deriveKey(passphrase: string, saltStr = DEFAULT_SALT): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseBytes = encoder.encode(passphrase);
  const saltBytes = encoder.encode(saltStr);

  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    passphraseBytes,
    { name: "PBKDF2" },
    false,
    ["deriveKey", "deriveBits"]
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 80000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts cleartext into a hex-encoded string payload using AES-GCM 256-bit.
 */
export async function encryptText(text: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder();
  const clearBytes = encoder.encode(text);
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit unique IV

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    clearBytes
  );

  const ciphertextBytes = new Uint8Array(encryptedBuffer);
  const ciphertextHex = Array.from(ciphertextBytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  const ivHex = Array.from(iv)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  return {
    ciphertext: ciphertextHex,
    iv: ivHex,
  };
}

/**
 * Decrypts hex-encoded ciphertext back into raw standard cleartext.
 */
export async function decryptText(ciphertextHex: string, ivHex: string, key: CryptoKey): Promise<string> {
  // If the ciphertext is empty, return empty string quickly
  if (!ciphertextHex || !ivHex) return "";

  const decoder = new TextDecoder();
  
  const ciphertextBytes = new Uint8Array(
    ciphertextHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
  );

  const ivBytes = new Uint8Array(
    ivHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
  );

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ivBytes,
    },
    key,
    ciphertextBytes
  );

  return decoder.decode(decryptedBuffer);
}

/**
 * Local helper to store user passphrase securely in session-only states.
 */
export function getSavedPassphrase(): string | null {
  return sessionStorage.getItem("e2ee_passphrase");
}

export function savePassphrase(passphrase: string): void {
  sessionStorage.setItem("e2ee_passphrase", passphrase);
}

export function clearSavedPassphrase(): void {
  sessionStorage.removeItem("e2ee_passphrase");
}
