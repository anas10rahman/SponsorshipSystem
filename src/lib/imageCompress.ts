/** Kompresi gambar di sisi peramban sebelum disimpan.
 *
 *  Latar belakang: logo & foto disimpan sebagai data URL base64 di basis data,
 *  lalu ikut terkirim pada setiap pemuatan data. Satu logo 1,9 MB pernah
 *  menyumbang 98% dari seluruh muatan /api/state. Gambar diperkecil dan
 *  dikompres dulu supaya ukurannya wajar (puluhan KB), tanpa mengubah cara
 *  penyimpanan.
 *
 *  WebP dipakai lebih dulu karena mendukung transparansi (penting untuk logo)
 *  dengan ukuran jauh lebih kecil; bila peramban tak bisa menyandikannya,
 *  jatuh balik ke PNG. */

export type CompressResult = {
  dataUrl: string;
  /** Ukuran perkiraan data URL (byte) — untuk ditampilkan ke pengguna. */
  bytes: number;
  width: number;
  height: number;
};

const MAX_DIMENSION = 512; // logo terbesar tampil 168px; 512 sudah aman utk layar retina
const QUALITY = 0.85;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gambar tidak dapat dibaca."));
    img.src = src;
  });
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Berkas tidak dapat dibaca."));
    r.readAsDataURL(file);
  });
}

/** Perkiraan ukuran byte dari data URL base64. */
export function dataUrlBytes(dataUrl: string): number {
  const i = dataUrl.indexOf(",");
  const b64 = i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
  const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((b64.length * 3) / 4) - padding);
}

export async function compressImage(
  file: File,
  maxDimension = MAX_DIMENSION,
): Promise<CompressResult> {
  const original = await readAsDataUrl(file);
  const img = await loadImage(original);

  // Perkecil hanya bila melebihi batas; gambar kecil tidak diperbesar.
  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { dataUrl: original, bytes: dataUrlBytes(original), width, height };
  ctx.drawImage(img, 0, 0, width, height);

  let out = canvas.toDataURL("image/webp", QUALITY);
  // Peramban yang tak bisa menyandikan WebP mengembalikan PNG — pakai apa adanya.
  if (!out.startsWith("data:image/webp")) out = canvas.toDataURL("image/png");

  // Bila hasil justru lebih besar (mis. gambar sudah kecil & teroptimasi),
  // pertahankan berkas aslinya.
  const bytes = dataUrlBytes(out);
  if (bytes >= dataUrlBytes(original)) {
    return {
      dataUrl: original,
      bytes: dataUrlBytes(original),
      width: img.width,
      height: img.height,
    };
  }
  return { dataUrl: out, bytes, width, height };
}

/** "1.234.567" → "1,2 MB" */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
