import { KeyTree, crypto, decodeBase64 as privacyDecodeBase64, encodeBase64 as privacyEncodeBase64, type Bytes } from "privacy-kit";

let keyTree: KeyTree | null = null;

export function asBytes(bytes: Uint8Array<ArrayBufferLike>): Bytes {
    if (bytes.buffer instanceof ArrayBuffer) {
        return bytes as Bytes;
    }
    return new Uint8Array(bytes) as Bytes;
}

export function encodeBase64(bytes: Uint8Array<ArrayBufferLike>) {
    return privacyEncodeBase64(asBytes(bytes));
}

export function decodeBase64(base64: string) {
    return privacyDecodeBase64(base64);
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
    return keyTree!.symmetricEncrypt(path, asBytes(bytes));
}

export function decryptString(path: string[], encrypted: Uint8Array<ArrayBufferLike>) {
    return keyTree!.symmetricDecryptString(path, asBytes(encrypted));
}

export function decryptBytes(path: string[], encrypted: Uint8Array<ArrayBufferLike>) {
    return keyTree!.symmetricDecryptBuffer(path, asBytes(encrypted));
}
