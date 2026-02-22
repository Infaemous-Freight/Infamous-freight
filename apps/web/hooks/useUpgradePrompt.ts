import { useEffect, useState } from "react";

/**
 * Hook to trigger upgrade prompts at optimal moments
 * Target: 30% Free→Pro, 15% Pro→Enterprise
 */

export function useUpgradePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptType, setPromptType] = useState<"free-to-pro" | "pro-to-enterprise" | null>(null);

  type UpgradeUsage = {
    api_calls?: number;
    shipments_created?: number;
  };

  type UpgradeUser = {
    created_at: string;
    team_members_count?: number;
  };

  type UpgradeSubscription = {
    tier: "free" | "pro" | string;
    created_at: string;
  };

  type UpgradeData = {
    subscription?: UpgradeSubscription;
    usage?: UpgradeUsage;
    user: UpgradeUser;
  };

  useEffect(() => {
    // Check if user qualifies for upgrade prompt
    checkUpgradeEligibility();
  }, []);

  const checkUpgradeEligibility = async () => {
    try {
      // Get user's tier and usage
      const response = await fetch("/api/user/subscription");
      const data = (await response.json()) as UpgradeData;

      if (!data.subscription) return;

      if (data.subscription.tier === "free") {
        checkFreeTierUpgrade(data);
      } else if (data.subscription.tier === "pro") {
        checkProTierUpgrade(data);
      }
    } catch (err) {
      console.error("Error checking upgrade eligibility:", err);
    }
  };

  const checkFreeTierUpgrade = (data: UpgradeData) => {
    // Trigger upgrade if:
    // 1. Used 80%+ of limits
    // 2. 14+ days since signup
    // 3. Had positive experience (shipments created, features used)

    const usagePercent = ((data.usage?.api_calls || 0) / 100) * 100;
    const daysSinceSignup = Math.floor(
      (Date.now() - new Date(data.user.created_at).getTime()) / (1000 * 60 * 60 * 24),
    );
    const isActivated = (data.usage?.shipments_created || 0) > 0;

    if ((usagePercent > 80 || daysSinceSignup >= 14) && isActivated) {
      setPromptType("free-to-pro");
      setShowPrompt(true);
    }
  };

  const checkProTierUpgrade = (data: UpgradeData) => {
    // Trigger if:
    // 1. Using 70%+ of Pro tier limits
    // 2. On Pro for 30+ days
    // 3. Has 5+ team members

    const shipmentUsagePercent = ((data.usage?.shipments_created || 0) / 1000) * 100;
    const teamSize = data.user?.team_members_count || 0;
    const daysOnPro = data.subscription
      ? Math.floor(
          (Date.now() - new Date(data.subscription.created_at).getTime()) / (1000 * 60 * 60 * 24),
        )
      : 0;

    if ((shipmentUsagePercent > 70 || teamSize >= 5 || daysOnPro >= 30) && teamSize >= 2) {
      setPromptType("pro-to-enterprise");
      setShowPrompt(true);
    }
  };

  return { showPrompt, promptType, dismiss: () => setShowPrompt(false) };
}
