import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'minio';

const dataDir = process.env.DATA_DIR || './data';
const localFilesDir = path.join(dataDir, 'files');

interface S3Config {
    host: string;
    accessKey: string;
    secretKey: string;
    bucket: string;
    publicUrl: string;
}

const s3Config: S3Config | null =
    process.env.S3_HOST &&
    process.env.S3_ACCESS_KEY &&
    process.env.S3_SECRET_KEY &&
    process.env.S3_BUCKET &&
    process.env.S3_PUBLIC_URL
        ? {
            host: process.env.S3_HOST,
            accessKey: process.env.S3_ACCESS_KEY,
            secretKey: process.env.S3_SECRET_KEY,
            bucket: process.env.S3_BUCKET,
            publicUrl: process.env.S3_PUBLIC_URL,
        }
        : null;

let useLocalStorage = !s3Config;
let s3client: Client | null = null;
let s3bucket: string = '';
let s3host: string = '';
let s3public: string = '';

if (s3Config) {
    const s3Port = process.env.S3_PORT ? parseInt(process.env.S3_PORT, 10) : undefined;
    const s3UseSSL = process.env.S3_USE_SSL ? process.env.S3_USE_SSL === 'true' : true;
    const s3Region = process.env.S3_REGION || 'us-east-1';
    s3client = new Client({
        endPoint: s3Config.host,
        port: s3Port,
        useSSL: s3UseSSL,
        accessKey: s3Config.accessKey,
        secretKey: s3Config.secretKey,
        region: s3Region,
    });
    s3bucket = s3Config.bucket;
    s3host = s3Config.host;
    s3public = s3Config.publicUrl;
}

export { s3client, s3bucket, s3host };

export async function loadFiles() {
    if (useLocalStorage) {
        fs.mkdirSync(localFilesDir, { recursive: true });
        return;
    }

    try {
        await s3client!.bucketExists(s3bucket);
    } catch {
        useLocalStorage = true;
        fs.mkdirSync(localFilesDir, { recursive: true });
    }
}

export function getPublicUrl(filePath: string) {
    if (useLocalStorage) {
        const baseUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || '3005'}`;
        return `${baseUrl}/files/${filePath}`;
    }
    return `${s3public}/${filePath}`;
}

export function isLocalStorage() {
    return useLocalStorage;
}

export function getLocalFilesDir() {
    return localFilesDir;
}

export async function putLocalFile(filePath: string, data: Buffer) {
    const fullPath = path.join(localFilesDir, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, data);
}

export type ImageRef = {
    width: number;
    height: number;
    thumbhash: string;
    path: string;
}
