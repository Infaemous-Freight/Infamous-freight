export interface LoadCandidate {
  id: string;
  ratePerMileCents?: number;
  deadheadMi?: number;
}

export interface RankedLoad extends LoadCandidate {
  score: number;
  reasons: string[];
}

export function rankLoads(
  loads: LoadCandidate[],
  opts?: { minRatePerMileCents?: number; avoidDeadheadOverMi?: number },
  topN = 10,
): RankedLoad[] {
  const ranked = loads.map((l) => {
    let score = (l.ratePerMileCents ?? 0) - (l.deadheadMi ?? 0) * 20;
    const reasons: string[] = [];
    if (opts?.minRatePerMileCents && (l.ratePerMileCents ?? 0) >= opts.minRatePerMileCents) {
      score += 200;
      reasons.push("Meets min rate/mi");
    }
    if (opts?.avoidDeadheadOverMi && (l.deadheadMi ?? 0) <= opts.avoidDeadheadOverMi) {
      score += 100;
      reasons.push("Low deadhead");
    }
    return { ...l, score, reasons };
  });

  return ranked.sort((a, b) => b.score - a.score).slice(0, topN);
}
