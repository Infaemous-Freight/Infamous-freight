import { Router } from 'express';

/**
 * Referral Program API Routes
 * Tier-based rewards: Free users get $10 credit, Pro users get $50
 */

const router = Router();

// GET /api/referrals/link - Get user's referral link
router.get('/link', (req, res, next) => {
  try {
    const user = req.user;
    const referralCode = user?.referral_code || generateReferralCode();

    res.json({
      success: true,
      referral_link: `https://infamous-freight.com?ref=${referralCode}`,
      referral_code: referralCode,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/referrals/stats - Get referral stats
router.get('/stats', (req, res, next) => {
  try {
    // Mock data for now - will integrate with database
    res.json({
      success: true,
      total_referred: 5,
      converted: 2,
      conversion_rate: 40,
      total_rewards: 120,
      reward_status: 'pending_payout',
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/referrals/redeem - Redeem accumulated referral credits
router.post('/redeem', (req, res, next) => {
  try {
    res.json({
      success: true,
      amount_redeemed: 120,
      applied_to_account: true,
    });
  } catch (err) {
    next(err);
  }
});

function generateReferralCode() {
  return 'ref_' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

export default router;
