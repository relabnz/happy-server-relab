import { BlobServiceClient } from "@azure/storage-blob";

const azureStorageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || "";
const azureStorageContainer = process.env.AZURE_STORAGE_CONTAINER || "";
const azureStoragePublicUrl = process.env.AZURE_STORAGE_PUBLIC_URL || "";

export const isFileStorageEnabled = azureStorageConnectionString.length > 0 && azureStorageContainer.length > 0;
export const azureBlobServiceClient = isFileStorageEnabled
    ? BlobServiceClient.fromConnectionString(azureStorageConnectionString)
    : null;
export const azureContainerClient = isFileStorageEnabled && azureBlobServiceClient
    ? azureBlobServiceClient.getContainerClient(azureStorageContainer)
    : null;

export async function loadFiles() {
    if (!isFileStorageEnabled || !azureContainerClient) {
        return;
    }
    const doesContainerExist = await azureContainerClient.exists();
    if (!doesContainerExist) {
        throw new Error(`Azure Blob container "${azureStorageContainer}" does not exist or is not accessible`);
    }
}

export function getPublicUrl(path: string) {
    const normalizedPath = path.replace(/^\/+/, "");
    if (azureStoragePublicUrl.length > 0) {
        return `${azureStoragePublicUrl.replace(/\/+$/, "")}/${normalizedPath}`;
    }
    return normalizedPath;
}

export type ImageRef = {
    width: number;
    height: number;
    thumbhash: string;
    path: string;
}
