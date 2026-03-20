import { PGlite } from "@electric-sql/pglite";
import * as fs from "fs";
import * as path from "path";

type WebAssemblyModuleCtor = new (bytes: Uint8Array<ArrayBuffer>) => WebAssembly.Module;

function readBinaryFile(filePath: string): Uint8Array<ArrayBuffer> {
    return new Uint8Array(fs.readFileSync(filePath));
}

function getWebAssemblyModuleCtor(): WebAssemblyModuleCtor | null {
    const moduleCtor = (globalThis as { WebAssembly?: { Module?: unknown } }).WebAssembly?.Module;
    return typeof moduleCtor === "function"
        ? (moduleCtor as WebAssemblyModuleCtor)
        : null;
}

function findWasmFiles(): { wasmModule: WebAssembly.Module; fsBundle: Blob } | null {
    const wasmModuleCtor = getWebAssemblyModuleCtor();
    if (!wasmModuleCtor) {
        return null;
    }
    const searchPaths = [
        process.cwd(),
        path.dirname(process.execPath),
    ];

    for (const dir of searchPaths) {
        const wasmPath = path.join(dir, "pglite.wasm");
        const dataPath = path.join(dir, "pglite.data");
        if (fs.existsSync(wasmPath) && fs.existsSync(dataPath)) {
            const wasmModule = new wasmModuleCtor(readBinaryFile(wasmPath));
            const fsBundle = new Blob([readBinaryFile(dataPath)]);
            return { wasmModule, fsBundle };
        }
    }
    return null;
}

export function createPGlite(dataDir: string): PGlite {
    const wasmOpts = findWasmFiles();
    if (wasmOpts) {
        return new PGlite({ dataDir, ...wasmOpts });
    }
    return new PGlite(dataDir);
}
