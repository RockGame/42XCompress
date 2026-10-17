export type OutputFormat = "original" | "jpeg" | "png" | "webp" | "avif" | "bmp";

export interface ProcessOptions {
  format: OutputFormat;
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface ProcessedImage {
  blob: Blob;
  filename: string;
  outputMime: string;
  originalBytes: number;
  outputBytes: number;
  savingsPercent: number;
  width: number;
  height: number;
  warning?: string;
}

const mimeFor: Record<Exclude<OutputFormat, "original" | "bmp">, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif"
};
const extForMime: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  "image/avif": "avif", "image/bmp": "bmp"
};
const stemOf = (filename: string) => filename.replace(/\.[^.]+$/, "") || "image";
const outputName = (filename: string, mime: string) => `${stemOf(filename)}-42x.${extForMime[mime] ?? "bin"}`;

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error(`Browser could not encode ${mime}.`));
      if (blob.type !== mime && !(mime === "image/jpeg" && blob.type === "image/jpg")) {
        return reject(new Error(`This browser cannot export ${mime}. Choose WebP, JPEG or PNG.`));
      }
      resolve(blob);
    }, mime, quality);
  });
}

function encodeBmp(imageData: ImageData): Blob {
  const { width, height, data } = imageData;
  const rowBytes = Math.ceil((width * 3) / 4) * 4;
  const pixelBytes = rowBytes * height;
  const buffer = new ArrayBuffer(54 + pixelBytes);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  view.setUint8(0, 0x42); view.setUint8(1, 0x4d);
  view.setUint32(2, 54 + pixelBytes, true); view.setUint32(10, 54, true);
  view.setUint32(14, 40, true); view.setInt32(18, width, true);
  view.setInt32(22, height, true); view.setUint16(26, 1, true);
  view.setUint16(28, 24, true); view.setUint32(34, pixelBytes, true);
  for (let y = 0; y < height; y++) {
    const destY = height - 1 - y;
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const dest = 54 + destY * rowBytes + x * 3;
      const a = data[src + 3] / 255;
      bytes[dest] = Math.round(data[src + 2] * a + 255 * (1 - a));
      bytes[dest + 1] = Math.round(data[src + 1] * a + 255 * (1 - a));
      bytes[dest + 2] = Math.round(data[src] * a + 255 * (1 - a));
    }
  }
  return new Blob([buffer], { type: "image/bmp" });
}

export async function processImage(file: File, options: ProcessOptions): Promise<ProcessedImage> {
  if (file.size > 100 * 1024 * 1024) {
    throw new Error(`"${file.name}" exceeds the 100 MB limit.`);
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`Could not decode "${file.name}". The browser may not support this format or the file may be damaged.`);
  }
  try {
    const scale = Math.min(
      1,
      options.maxWidth ? options.maxWidth / bitmap.width : 1,
      options.maxHeight ? options.maxHeight / bitmap.height : 1
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: options.format === "bmp" });
    if (!context) throw new Error("Canvas is unavailable.");
    if (options.format === "jpeg" || (options.format === "original" && file.type === "image/jpeg")) {
      context.fillStyle = "#ffffff"; context.fillRect(0, 0, width, height);
    }
    context.drawImage(bitmap, 0, 0, width, height);

    let blob: Blob;
    let requestedMime: string;
    if (options.format === "bmp") {
      blob = encodeBmp(context.getImageData(0, 0, width, height));
      requestedMime = "image/bmp";
    } else {
      requestedMime = options.format === "original"
        ? (file.type && file.type.startsWith("image/") ? file.type : "image/png")
        : mimeFor[options.format];
      // HTML Canvas cannot encode BMP natively. For BMP input, use PNG.
      if (requestedMime === "image/bmp") requestedMime = "image/png";
      if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(requestedMime)) {
        requestedMime = "image/png";
      }
      blob = await canvasToBlob(canvas, requestedMime, requestedMime === "image/png" ? 1 : Math.min(1, Math.max(0.1, options.quality / 100)));
    }
    const actualMime = blob.type || requestedMime;
    const warnings: string[] = [];
    if (actualMime !== requestedMime) warnings.push(`Browser changed output format to ${actualMime}.`);
    if (options.format === "jpeg" && file.type === "image/png") warnings.push("JPEG does not preserve transparency; transparent areas were flattened onto white.");
    if (options.format === "bmp" && file.type === "image/png") warnings.push("BMP output does not preserve transparency; transparent areas were flattened onto white.");
    if (options.format === "original" && file.type === "image/bmp") warnings.push("The browser cannot natively export BMP; output was saved as PNG.");
    if (blob.size > file.size) warnings.push("Output is larger than the original. Try another format or lower quality.");
    return {
      blob, filename: outputName(file.name, actualMime), outputMime: actualMime,
      originalBytes: file.size, outputBytes: blob.size,
      savingsPercent: file.size ? ((file.size - blob.size) / file.size) * 100 : 0,
      width, height, warning: warnings.join(" ")
    };
  } finally {
    bitmap.close();
  }
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024, i = 0;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${size.toFixed(size >= 100 ? 0 : 1)} ${units[i]}`;
}
export function savingsLabel(percent: number): string {
  if (percent > 0) return `${percent.toFixed(1)}% saved`;
  if (percent < 0) return `${Math.abs(percent).toFixed(1)}% larger`;
  return "0%";
}
