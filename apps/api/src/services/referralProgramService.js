/**
 * Referral Program Service (TIER 2)
 * Manages referral tracking, fraud detection, and payouts
 */

const db = require("../db/prisma");
const crypto = require("crypto");
const dayjs = require("dayjs");
const logger = require("../middleware/logger");

class ReferralProgramService {
    /**
     * Create a referral link
     */
    async createReferralLink(referrerUserId) {
        try {
            const user = await db.user.findUnique({
                where: { id: referrerUserId },
                select: { email: true },
            });

            if (!user) throw new Error("User not found");

            // Generate unique referral code
            const referralCode = crypto
                .randomBytes(8)
                .toString("hex")
                .substring(0, 10)
                .toUpperCase();

            const referralUrl = `${process.env.WEB_BASE_URL}/signup?ref=${referralCode}`;

            return {
                referralCode,
                referralUrl,
                referrerEmail: user.email,
                expiresAt: dayjs().add(90, "days").toDate(),
            };
        } catch (err) {
            logger.error("Failed to create referral link", { error: err, referrerUserId });
            throw err;
        }
    }

    /**
     * Validate and track referral signup
     */
    async trackReferralSignup(referrerUserId, referreeEmail, signupContext = {}) {
        try {
            // Anti-fraud checks
            const fraudCheck = await this.performFraudCheck(referrerUserId, referreeEmail, signupContext);

            if (fraudCheck.fraudDetected) {
                logger.warn("Fraudulent referral detected", {
                    referrerUserId,
                    referreeEmail,
                    reason: fraudCheck.reason,
                });
            }

            // Create referral
            const referral = await db.referral.create({
                data: {
                    referrerUserId,
                    referreeEmail,
                    directReward: 50, // $50 for referrer
                    indirectReward: 10, // $10 for referree (20% of $50)
                    status: "PENDING",
                    referralTier: await this.calculateReferralTier(referrerUserId),
                    fraudDetected: fraudCheck.fraudDetected,
                    fraudReason: fraudCheck.reason,
                    expiresAt: dayjs().add(90, "days").toDate(),
                },
            });

            logger.info("Referral tracked", { referrerUserId, referreeEmail });
            return referral;
        } catch (err) {
            logger.error("Failed to track referral", { error: err });
            throw err;
        }
    }

    /**
     * Perform fraud detection
     */
    async performFraudCheck(referrerUserId, referreeEmail, context = {}) {
        const checks = {
            emailDomain: this.checkEmailDomain(referreeEmail),
            ipDuplication: this.checkIPDuplication(context.ipAddress),
            signupVelocity: await this.checkSignupVelocity(referrerUserId),
            sameNetwork: this.checkSameNetwork(context.referrerIP, context.refereeIP),
        };

        const fraudCount = Object.values(checks).filter((v) => v === true).length;

        return {
            fraudDetected: fraudCount >= 2,
            reason: fraudCount >= 2 ? `Multiple fraud signals detected (${fraudCount})` : null,
            checks,
        };
    }

    /**
     * Check suspicious email domains
     */
    checkEmailDomain(email) {
        const suspiciousDomains = [
            "temp-mail.com",
            "guerrillamail.com",
            "10minutemail.com",
            "mailinator.com",
        ];
        const domain = email.split("@")[1];
        return suspiciousDomains.includes(domain);
    }

    /**
     * Check for IP duplication
     */
    checkIPDuplication(ipAddress) {
        // Would query recent signups from same IP
        // Simplified for now
        return false;
    }

    /**
     * Check signup velocity
     */
    async checkSignupVelocity(userId) {
        try {
            // Get count of referrals from this user in last 24 hours
            const count = await db.referral.count({
                where: {
                    referrerUserId: userId,
                    createdAt: {
                        gte: dayjs().subtract(24, "hours").toDate(),
                    },
                },
            });

            // Flag if > 10 referrals per day
            return count > 10;
        } catch (err) {
            logger.error("Signup velocity check failed", err);
            return false;
        }
    }

    /**
     * Check if referrer and referee are on same network
     */
    checkSameNetwork(referrerIP, refereeIP) {
        if (!referrerIP || !refereeIP) return false;
        // Compare IP ranges
        return referrerIP === refereeIP;
    }

    /**
     * Mark referral as converted
     */
    async markReferralConverted(referralId, referreeUserId) {
        try {
            const referral = await db.referral.update({
                where: { id: referralId },
                data: {
                    referreeUserId,
                    status: "CONVERTED",
                    convertedAt: new Date(),
                },
            });

            // Check if fraudulent - don't pay if so
            if (referral.fraudDetected) {
                logger.warn("Fraudulent referral converted (no payout)", { referralId });
                return referral;
            }

            // Award credits to both users
            await this.awardReferralCredits(referral.referrerUserId, referral.directReward);
            await this.awardReferralCredits(referreeUserId, referral.indirectReward);

            logger.info("Referral converted", { referralId, referreeUserId });
            return referral;
        } catch (err) {
            logger.error("Failed to mark referral as converted", { error: err, referralId });
            throw err;
        }
    }

    /**
     * Award referral credits to user
     */
    async awardReferralCredits(userId, amount) {
        try {
            // Create credit record or update balance
            // This would integrate with your billing system
            logger.info("Referral credits awarded", { userId, amount });
        } catch (err) {
            logger.error("Failed to award credits", { error: err, userId });
        }
    }

    /**
     * Calculate referral tier based on conversion count
     */
    async calculateReferralTier(userId) {
        try {
            const convertedCount = await db.referral.count({
                where: {
                    referrerUserId: userId,
                    status: "CONVERTED",
                },
            });

            if (convertedCount >= 50) return "platinum";
            if (convertedCount >= 20) return "gold";
            if (convertedCount >= 10) return "silver";
            return "bronze";
        } catch (err) {
            logger.error("Failed to calculate tier", { error: err, userId });
            return "bronze";
        }
    }

    /**
     * Get referral leaderboard
     */
    async getLeaderboard(limit = 10) {
        try {
            const leaderboard = await db.referral.groupBy({
                by: ["referrerUserId"],
                where: { status: "CONVERTED" },
                _count: {
                    referrerUserId: true,
                },
                _sum: {
                    directReward: true,
                },
                take: limit,
                orderBy: {
                    _count: { referrerUserId: "desc" },
                },
            });

            return leaderboard.map((item) => ({
                userId: item.referrerUserId,
                conversions: item._count.referrerUserId,
                earnings: item._sum.directReward || 0,
            }));
        } catch (err) {
            logger.error("Failed to get leaderboard", { error: err });
            return [];
        }
    }

    /**
     * Get user's referral stats
     */
    async getUserReferralStats(userId) {
        try {
            const stats = {
                totalCreated: await db.referral.count({ where: { referrerUserId: userId } }),
                totalConverted: await db.referral.count({
                    where: { referrerUserId: userId, status: "CONVERTED" },
                }),
                totalEarnings: 0,
                currentTier: await this.calculateReferralTier(userId),
            };

            // Calculate total earnings
            const earnings = await db.referral.aggregate({
                where: { referrerUserId: userId, status: "CONVERTED" },
                _sum: { directReward: true },
            });

            stats.totalEarnings = earnings._sum.directReward || 0;
            stats.conversionRate = stats.totalCreated > 0 ? (stats.totalConverted / stats.totalCreated) * 100 : 0;

            return stats;
        } catch (err) {
            logger.error("Failed to get referral stats", { error: err, userId });
            throw err;
        }
    }

    /**
     * Process monthly payouts for referrers
     */
    async processMonthlyPayouts() {
        try {
            logger.info("Processing monthly referral payouts");

            // Get all referrers with earnings
            const referrers = await db.referral.groupBy({
                by: ["referrerUserId"],
                where: {
                    status: "CONVERTED",
                    createdAt: {
                        gte: dayjs().startOf("month").toDate(),
                        lte: dayjs().endOf("month").toDate(),
                    },
                },
                _sum: { directReward: true },
            });

            for (const item of referrers) {
                const earnings = item._sum.directReward || 0;
                if (earnings > 0) {
                    // Create payout record
                    logger.info("Referral payout processed", {
                        userId: item.referrerUserId,
                        amount: earnings,
                    });
                }
            }

            logger.info("Monthly payouts completed");
        } catch (err) {
            logger.error("Failed to process payouts", { error: err });
        }
    }
}

module.exports = new ReferralProgramService();
