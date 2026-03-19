import { randomKey } from "@/utils/randomKey";
import { processImage } from "@/storage/processImage";
import { db } from "@/storage/db";
import { azureContainerClient, getPublicUrl, ImageRef, isFileStorageEnabled } from "@/storage/files";

export async function uploadImage(userId: string, directory: string, prefix: string, url: string, src: Buffer): Promise<ImageRef | null> {

    // Check if image already exists
    const existing = await db.uploadedFile.findFirst({
        where: {
            reuseKey: 'image-url:' + url
        }
    });

    if (existing && existing.thumbhash && existing.width && existing.height) {
        return {
            path: existing.path,
            thumbhash: existing.thumbhash,
            width: existing.width,
            height: existing.height
        };
    }

    if (!isFileStorageEnabled || !azureContainerClient) {
        return null;
    }

    // Process image
    const processed = await processImage(src);
    const key = randomKey(prefix);
    const filename = `${key}.${processed.format === "png" ? "png" : "jpg"}`;
    const path = `public/users/${userId}/${directory}/${filename}`;
    const blobClient = azureContainerClient.getBlockBlobClient(path);
    await blobClient.uploadData(src, {
        blobHTTPHeaders: {
            blobContentType: processed.format === "png" ? "image/png" : "image/jpeg"
        }
    });
    await db.uploadedFile.create({
        data: {
            accountId: userId,
            path,
            reuseKey: "image-url:" + url,
            width: processed.width,
            height: processed.height,
            thumbhash: processed.thumbhash
        }
    });
    return {
        path,
        thumbhash: processed.thumbhash,
        width: processed.width,
        height: processed.height
    }
}

export function resolveImageUrl(path: string) {
    return getPublicUrl(path);
}
