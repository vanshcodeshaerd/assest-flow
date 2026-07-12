import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, errorResponse } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await ctx.params;

    const asset = await prisma.asset.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, assetId: true, name: true, category: { select: { name: true } } },
    });
    if (!asset) return errorResponse("Asset not found", 404);

    const assetUrl = `${req.headers.get("x-forwarded-proto") || "https"}://${req.headers.get("host")}/admin/assets/${asset.id}`;
    const qrData = JSON.stringify({
      assetId: asset.assetId,
      url: assetUrl,
      name: asset.name,
    });

    const qrSvg = generateQRSvg(assetUrl, asset.assetId, asset.name);

    return new Response(qrSvg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `inline; filename="${asset.assetId}-qr.svg"`,
      },
    });
  } catch (error) {
    console.error("QR generation error:", error);
    return errorResponse("Internal server error", 500);
  }
}

function generateQRSvg(data: string, assetId: string, name: string): string {
  const matrix = generateQRMatrix(data);
  const moduleSize = 8;
  const padding = 40;
  const labelHeight = 60;
  const qrSize = matrix.length * moduleSize;
  const width = qrSize + padding * 2;
  const height = qrSize + padding * 2 + labelHeight;

  let modules = "";
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (matrix[row][col]) {
        modules += `<rect x="${padding + col * moduleSize}" y="${padding + row * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="#000"/>`;
      }
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="white"/>
  ${modules}
  <text x="${width / 2}" y="${padding + qrSize + 25}" text-anchor="middle" font-family="monospace" font-size="14" font-weight="bold" fill="#333">${assetId}</text>
  <text x="${width / 2}" y="${padding + qrSize + 45}" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#666">${escapeXml(name.slice(0, 30))}</text>
</svg>`;
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function generateQRMatrix(data: string): boolean[][] {
  const size = Math.max(21, Math.min(41, 21 + Math.floor(data.length / 10) * 4));
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  addFinderPattern(matrix, 0, 0);
  addFinderPattern(matrix, size - 7, 0);
  addFinderPattern(matrix, 0, size - 7);

  let bitIndex = 0;
  const bytes = new TextEncoder().encode(data);
  for (let col = size - 1; col >= 1; col -= 2) {
    if (col === 6) col = 5;
    for (let row = 0; row < size; row++) {
      for (let c = 0; c < 2; c++) {
        const x = col - c;
        const y = row;
        if (isReserved(x, y, size)) continue;
        const byteIdx = Math.floor(bitIndex / 8);
        const bitIdx = 7 - (bitIndex % 8);
        if (byteIdx < bytes.length) {
          matrix[y][x] = ((bytes[byteIdx] >> bitIdx) & 1) === 1;
        } else {
          matrix[y][x] = (bitIndex % 3) === 0;
        }
        bitIndex++;
      }
    }
  }

  return matrix;
}

function addFinderPattern(matrix: boolean[][], startRow: number, startCol: number) {
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      if (startRow + r < matrix.length && startCol + c < matrix[0].length) {
        matrix[startRow + r][startCol + c] =
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4);
      }
    }
  }
}

function isReserved(x: number, y: number, size: number): boolean {
  if (x < 8 && y < 8) return true;
  if (x >= size - 8 && y < 8) return true;
  if (x < 8 && y >= size - 8) return true;
  if (x === 6 || y === 6) return true;
  return false;
}
