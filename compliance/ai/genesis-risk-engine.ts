export function calculateRisk(transaction: any, user: any) {
  let score = 0;

  if (transaction.amount > 5000) score += 30;
  if (!user.kycVerified) score += 50;
  if (transaction.ipMismatch) score += 20;

  return {
    score,
    level: score > 70 ? "HIGH" : score > 40 ? "MEDIUM" : "LOW",
  };
}
