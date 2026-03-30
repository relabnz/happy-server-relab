import { KeyTree, crypto, type Bytes } from "privacy-kit";

let keyTree: KeyTree | null = null;

function normalizeBytes(bytes: Uint8Array<ArrayBufferLike>): Bytes {
    return new Uint8Array(bytes);
}

export async function initEncrypt() {
    keyTree = new KeyTree(await crypto.deriveSecureKey({
        key: process.env.HANDY_MASTER_SECRET!,
        usage: 'happy-server-tokens'
    }));
}

export function encryptString(path: string[], string: string) {
    return keyTree!.symmetricEncrypt(path, string);
}

export function encryptBytes(path: string[], bytes: Uint8Array<ArrayBufferLike>) {
    return keyTree!.symmetricEncrypt(path, normalizeBytes(bytes));
}

export function decryptString(path: string[], encrypted: Uint8Array<ArrayBufferLike>) {
    return keyTree!.symmetricDecryptString(path, normalizeBytes(encrypted));
}

export function decryptBytes(path: string[], encrypted: Uint8Array<ArrayBufferLike>) {
    return keyTree!.symmetricDecryptBuffer(path, normalizeBytes(encrypted));
}
