import { prisma } from "@/lib/prisma";

export async function generateAssetId(categoryCode: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${categoryCode}-${year}-`;

  const lastAsset = await prisma.asset.findFirst({
    where: { assetId: { startsWith: prefix } },
    orderBy: { assetId: "desc" },
    select: { assetId: true },
  });

  let sequence = 1;
  if (lastAsset) {
    const lastSeq = parseInt(lastAsset.assetId.split("-").pop() || "0", 10);
    sequence = lastSeq + 1;
  }

  return `${prefix}${String(sequence).padStart(6, "0")}`;
}
