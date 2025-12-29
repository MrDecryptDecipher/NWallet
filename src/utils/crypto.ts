// Modern Web Crypto API Utility for AES-GCM
// Exponential Improvement: Native Browser Security (No external libs)

// 1. Derive a Key from the User's Password (PBKDF2)
export const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt as any,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
};

// 2. Encrypt Data
export const encryptData = async (data: string, password: string): Promise<{ ciphertext: string; iv: string; salt: string }> => {
    const enc = new TextEncoder();
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM

    const key = await deriveKey(password, salt);
    const encodedData = enc.encode(data);

    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv as any },
        key,
        encodedData
    );

    // Convert raw buffers to Base64 for storage
    return {
        ciphertext: bufferToBase64(encrypted),
        iv: bufferToBase64(iv),
        salt: bufferToBase64(salt)
    };
};

// 3. Decrypt Data
export const decryptData = async (ciphertext: string, ivStr: string, saltStr: string, password: string): Promise<string> => {
    try {
        const salt = base64ToBuffer(saltStr);
        const iv = base64ToBuffer(ivStr);
        const encryptedData = base64ToBuffer(ciphertext);

        // Explicit cast for TS issues with SharedArrayBuffer
        const key = await deriveKey(password, salt);

        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv as any },
            key,
            encryptedData as any
        );

        const dec = new TextDecoder();
        return dec.decode(decrypted);
    } catch (e) {
        console.error("Decryption error details:", e);
        throw new Error("Decryption failed: Incorrect password or corrupted data");
    }
};

// Helper: ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = new Uint8Array(buffer as ArrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// Helper: Base64 to Uint8Array
function base64ToBuffer(base64: string): Uint8Array {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
}
