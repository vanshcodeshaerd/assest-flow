import { prisma } from "@/lib/prisma";

interface AssetForScoring {
  id: string;
  purchaseDate: Date | null;
  purchaseCost: number | null;
  warrantyExpiry: Date | null;
  condition: string;
  status: string;
  healthScore: number | null;
}

export function calculateHealthScore(asset: AssetForScoring, maintenanceCount: number, totalRepairCost: number): number {
  let score = 100;

  if (asset.purchaseDate) {
    const ageYears = (Date.now() - asset.purchaseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    score -= Math.min(30, ageYears * 6);
  }

  score -= Math.min(20, maintenanceCount * 4);

  if (asset.purchaseCost && asset.purchaseCost > 0) {
    const costRatio = totalRepairCost / asset.purchaseCost;
    score -= Math.min(20, costRatio * 40);
  }

  const conditionPenalty: Record<string, number> = {
    EXCELLENT: 0,
    GOOD: 5,
    FAIR: 15,
    POOR: 25,
    DAMAGED: 40,
  };
  score -= conditionPenalty[asset.condition] || 0;

  if (asset.warrantyExpiry && asset.warrantyExpiry < new Date()) {
    score -= 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function calculateUsageScore(allocationCount: number, transferCount: number): string {
  const total = allocationCount + transferCount;
  if (total >= 5) return "HIGH";
  if (total >= 2) return "MEDIUM";
  return "LOW";
}

export function calculateRiskScore(
  asset: AssetForScoring,
  maintenanceCount: number,
  totalRepairCost: number,
  healthScore: number
): string {
  let riskPoints = 0;

  if (healthScore < 30) riskPoints += 4;
  else if (healthScore < 50) riskPoints += 3;
  else if (healthScore < 70) riskPoints += 1;

  if (asset.purchaseDate) {
    const ageYears = (Date.now() - asset.purchaseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (ageYears > 5) riskPoints += 3;
    else if (ageYears > 3) riskPoints += 2;
    else if (ageYears > 1) riskPoints += 1;
  }

  if (maintenanceCount > 5) riskPoints += 3;
  else if (maintenanceCount > 2) riskPoints += 1;

  if (asset.warrantyExpiry) {
    const daysLeft = (asset.warrantyExpiry.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    if (daysLeft < 0) riskPoints += 2;
    else if (daysLeft < 30) riskPoints += 1;
  }

  if (asset.condition === "DAMAGED") riskPoints += 3;
  else if (asset.condition === "POOR") riskPoints += 2;

  if (riskPoints >= 8) return "CRITICAL";
  if (riskPoints >= 5) return "HIGH";
  if (riskPoints >= 3) return "MEDIUM";
  return "LOW";
}

export function generateRecommendations(
  asset: AssetForScoring,
  healthScore: number,
  riskScore: string,
  usageScore: string,
  maintenanceCount: number,
  totalRepairCost: number
): string[] {
  const recs: string[] = [];

  if (healthScore < 30) {
    recs.push("Asset health is critically low. Consider replacement.");
  } else if (healthScore < 50) {
    recs.push("Asset health is declining. Schedule preventive maintenance.");
  }

  if (asset.purchaseDate) {
    const ageYears = (Date.now() - asset.purchaseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (ageYears > 5) recs.push("Asset is over 5 years old. Evaluate for replacement.");
    if (ageYears > 3 && healthScore < 60) recs.push("Aging asset with declining health. Plan for retirement.");
  }

  if (asset.warrantyExpiry) {
    const daysLeft = (asset.warrantyExpiry.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    if (daysLeft > 0 && daysLeft < 60) recs.push(`Warranty expires in ${Math.ceil(daysLeft)} days. Consider extending.`);
    if (daysLeft < 0) recs.push("Warranty has expired. Review extended warranty options.");
  }

  if (asset.purchaseCost && asset.purchaseCost > 0 && totalRepairCost > asset.purchaseCost * 0.5) {
    recs.push("Maintenance costs exceed 50% of purchase price. Recommend disposal and replacement.");
  }

  if (maintenanceCount > 4) {
    recs.push("High maintenance frequency detected. Schedule comprehensive inspection.");
  }

  if (usageScore === "LOW" && asset.status === "AVAILABLE") {
    recs.push("Asset is underutilized. Consider reassigning to a higher-demand department.");
  }

  if (riskScore === "CRITICAL") {
    recs.push("Critical risk level. Immediate action required.");
  }

  if (asset.condition === "DAMAGED") {
    recs.push("Asset is damaged. Raise a maintenance request or dispose.");
  }

  if (recs.length === 0) {
    recs.push("Asset is in good condition. Continue regular monitoring.");
  }

  return recs;
}

export async function computeAssetScores(assetId: string) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) return null;

  const [maintenanceRecords, allocations, transfers] = await Promise.all([
    prisma.maintenanceRequest.findMany({
      where: { assetId },
      select: { cost: true, status: true },
    }),
    prisma.allocation.count({ where: { assetId } }),
    prisma.assetTransfer.count({ where: { assetId } }),
  ]);

  const maintenanceCount = maintenanceRecords.length;
  const totalRepairCost = maintenanceRecords.reduce((sum, m) => sum + (m.cost || 0), 0);

  const healthScore = calculateHealthScore(asset as AssetForScoring, maintenanceCount, totalRepairCost);
  const usageScore = calculateUsageScore(allocations, transfers);
  const riskScore = calculateRiskScore(asset as AssetForScoring, maintenanceCount, totalRepairCost, healthScore);
  const recommendations = generateRecommendations(
    asset as AssetForScoring,
    healthScore,
    riskScore,
    usageScore,
    maintenanceCount,
    totalRepairCost
  );

  await prisma.asset.update({
    where: { id: assetId },
    data: { healthScore, usageScore, riskScore },
  });

  return { healthScore, usageScore, riskScore, recommendations };
}
