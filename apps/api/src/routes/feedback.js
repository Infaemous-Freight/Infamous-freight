/**
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * User Feedback Collection System
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/security');
const { validateString, handleValidationErrors } = require('../middleware/validation');
const { body } = require('express-validator');

// Feedback categories
const FEEDBACK_CATEGORIES = {
    FEATURE_REQUEST: 'feature_request',
    BUG_REPORT: 'bug_report',
    PERFORMANCE: 'performance',
    UI_UX: 'ui_ux',
    GENERAL: 'general',
    TRACK_VALIDATION: 'track_validation',
};

// Feedback ratings
const RATINGS = {
    VERY_POOR: 1,
    POOR: 2,
    AVERAGE: 3,
    GOOD: 4,
    EXCELLENT: 5,
};

// Submit feedback
router.post(
    '/',
    authenticate,
    [
        validateString('category'),
        validateString('title', { maxLength: 200 }),
        validateString('description', { maxLength: 5000 }),
        body('rating').optional().isInt({ min: 1, max: 5 }),
        body('metadata').optional().isObject(),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { category, title, description, rating, metadata, screenshot_url } = req.body;

            // Validate category
            if (!Object.values(FEEDBACK_CATEGORIES).includes(category)) {
                return res.status(400).json({
                    error: 'Invalid category',
                    allowed: Object.values(FEEDBACK_CATEGORIES),
                });
            }

            // Create feedback entry
            const feedback = {
                id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                category,
                title,
                description,
                rating: rating || null,
                user_id: req.user.sub,
                user_email: req.user.email,
                metadata: {
                    ...metadata,
                    user_agent: req.headers['user-agent'],
                    ip_address: req.ip,
                    timestamp: new Date().toISOString(),
                },
                screenshot_url: screenshot_url || null,
                status: 'new',
                created_at: new Date().toISOString(),
            };

            // Store feedback (in production, this would go to database)
            // For now, log to file for manual review
            const fs = require('fs');
            const path = require('path');
            const feedbackDir = path.join(__dirname, '../../feedback-data');

            if (!fs.existsSync(feedbackDir)) {
                fs.mkdirSync(feedbackDir, { recursive: true });
            }

            const feedbackFile = path.join(feedbackDir, `${feedback.id}.json`);
            fs.writeFileSync(feedbackFile, JSON.stringify(feedback, null, 2));

            // Append to master feedback log
            const logFile = path.join(feedbackDir, 'all_feedback.jsonl');
            fs.appendFileSync(logFile, JSON.stringify(feedback) + '\n');

            // Send notification for critical feedback
            if (category === FEEDBACK_CATEGORIES.BUG_REPORT || rating === RATINGS.VERY_POOR) {
                await sendCriticalFeedbackAlert(feedback);
            }

            res.status(201).json({
                success: true,
                data: feedback,
                message: 'Thank you for your feedback!',
            });
        } catch (err) {
            next(err);
        }
    }
);

// Get feedback (admin only)
router.get('/', authenticate, async (req, res, next) => {
    try {
        const { category, status, rating, user_id } = req.query;

        const fs = require('fs');
        const path = require('path');
        const feedbackDir = path.join(__dirname, '../../feedback-data');
        const logFile = path.join(feedbackDir, 'all_feedback.jsonl');

        if (!fs.existsSync(logFile)) {
            return res.json({ success: true, data: [], count: 0 });
        }

        // Read all feedback
        const lines = fs.readFileSync(logFile, 'utf-8').split('\n').filter(l => l.trim());
        let feedback = lines.map(line => JSON.parse(line));

        // Apply filters
        if (category) {
            feedback = feedback.filter(f => f.category === category);
        }
        if (status) {
            feedback = feedback.filter(f => f.status === status);
        }
        if (rating) {
            feedback = feedback.filter(f => f.rating === parseInt(rating));
        }
        if (user_id) {
            feedback = feedback.filter(f => f.user_id === user_id);
        }

        // Sort by date (newest first)
        feedback.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        res.json({
            success: true,
            data: feedback,
            count: feedback.length,
        });
    } catch (err) {
        next(err);
    }
});

// Get feedback statistics
router.get('/stats', authenticate, async (req, res, next) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const feedbackDir = path.join(__dirname, '../../feedback-data');
        const logFile = path.join(feedbackDir, 'all_feedback.jsonl');

        if (!fs.existsSync(logFile)) {
            return res.json({
                success: true,
                data: {
                    total: 0,
                    by_category: {},
                    by_rating: {},
                    avg_rating: 0,
                },
            });
        }

        const lines = fs.readFileSync(logFile, 'utf-8').split('\n').filter(l => l.trim());
        const feedback = lines.map(line => JSON.parse(line));

        // Count by category
        const by_category = {};
        feedback.forEach(f => {
            by_category[f.category] = (by_category[f.category] || 0) + 1;
        });

        // Count by rating
        const by_rating = {};
        let total_rating = 0;
        let rating_count = 0;
        feedback.forEach(f => {
            if (f.rating) {
                by_rating[f.rating] = (by_rating[f.rating] || 0) + 1;
                total_rating += f.rating;
                rating_count++;
            }
        });

        const avg_rating = rating_count > 0 ? total_rating / rating_count : 0;

        // Recent trends (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recent = feedback.filter(f => new Date(f.created_at) > sevenDaysAgo);

        // Most common issues
        const issues = {};
        feedback
            .filter(f => f.category === FEEDBACK_CATEGORIES.BUG_REPORT)
            .forEach(f => {
                const key = f.title.toLowerCase();
                issues[key] = (issues[key] || 0) + 1;
            });

        const top_issues = Object.entries(issues)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([issue, count]) => ({ issue, count }));

        res.json({
            success: true,
            data: {
                total: feedback.length,
                by_category,
                by_rating,
                avg_rating: Math.round(avg_rating * 10) / 10,
                recent_7_days: recent.length,
                top_issues,
                satisfaction_rate: rating_count > 0
                    ? (feedback.filter(f => f.rating >= 4).length / rating_count * 100).toFixed(1) + '%'
                    : 'N/A',
            },
        });
    } catch (err) {
        next(err);
    }
});

// Update feedback status (admin only)
router.patch('/:id/status', authenticate, async (req, res, next) => {
    try {
        const { status } = req.body;
        const feedbackId = req.params.id;

        const validStatuses = ['new', 'in_review', 'planned', 'in_progress', 'resolved', 'closed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                error: 'Invalid status',
                allowed: validStatuses,
            });
        }

        const fs = require('fs');
        const path = require('path');
        const feedbackDir = path.join(__dirname, '../../feedback-data');
        const feedbackFile = path.join(feedbackDir, `${feedbackId}.json`);

        if (!fs.existsSync(feedbackFile)) {
            return res.status(404).json({ error: 'Feedback not found' });
        }

        const feedback = JSON.parse(fs.readFileSync(feedbackFile, 'utf-8'));
        feedback.status = status;
        feedback.updated_at = new Date().toISOString();
        feedback.updated_by = req.user.sub;

        fs.writeFileSync(feedbackFile, JSON.stringify(feedback, null, 2));

        res.json({
            success: true,
            data: feedback,
            message: `Feedback status updated to: ${status}`,
        });
    } catch (err) {
        next(err);
    }
});

// Track 1 Validation Feedback
router.post('/track1-validation', authenticate, async (req, res, next) => {
    try {
        const {
            performance_rating,
            security_rating,
            reliability_rating,
            comments,
            concerns,
            recommendations,
        } = req.body;

        const validation_feedback = {
            id: `track1_${Date.now()}`,
            type: 'track1_validation',
            user_id: req.user.sub,
            user_email: req.user.email,
            ratings: {
                performance: performance_rating,
                security: security_rating,
                reliability: reliability_rating,
                overall: ((performance_rating + security_rating + reliability_rating) / 3).toFixed(1),
            },
            comments: comments || null,
            concerns: concerns || [],
            recommendations: recommendations || [],
            submitted_at: new Date().toISOString(),
        };

        // Save to validation feedback directory
        const fs = require('fs');
        const path = require('path');
        const validationDir = path.join(__dirname, '../../validation-data/feedback');

        if (!fs.existsSync(validationDir)) {
            fs.mkdirSync(validationDir, { recursive: true });
        }

        const file = path.join(validationDir, `${validation_feedback.id}.json`);
        fs.writeFileSync(file, JSON.stringify(validation_feedback, null, 2));

        // Append to log
        const logFile = path.join(validationDir, 'track1_feedback.jsonl');
        fs.appendFileSync(logFile, JSON.stringify(validation_feedback) + '\n');

        res.json({
            success: true,
            data: validation_feedback,
            message: 'Track 1 validation feedback recorded. Thank you!',
        });
    } catch (err) {
        next(err);
    }
});

// Helper functions

async function sendCriticalFeedbackAlert(feedback) {
    console.log('🚨 CRITICAL FEEDBACK RECEIVED:');
    console.log(`   Category: ${feedback.category}`);
    console.log(`   Title: ${feedback.title}`);
    console.log(`   Rating: ${feedback.rating}/5`);
    console.log(`   User: ${feedback.user_email}`);
    // Alert team for urgent negative feedback
    if (process.env.SLACK_ALERTS_WEBHOOK) {
        try {
            await fetch(process.env.SLACK_ALERTS_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: `⚠️ Urgent Feedback Alert`,
                    blocks: [
                        {
                            type: 'section',
                            text: { type: 'mrkdwn', text: `*Rating:* ${rating}/5\n*User:* ${req.user?.sub}\n*Comment:* ${comment}` }
                        }
                    ]
                })
            });
        } catch (err) {
            console.warn('Alert notification failed:', err.message);
        }
    }
    // TODO: Add email alerting when SMTP is configured
}

module.exports = router;
