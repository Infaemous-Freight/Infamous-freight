/**
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Automated Sign-Off Workflow System
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireScope } = require('../middleware/security');
const { prisma } = require('../config/database');

// Sign-off types
const SIGNOFF_TYPES = {
    DEPLOYMENT: 'deployment',
    FEATURE_RELEASE: 'feature_release',
    SECURITY_AUDIT: 'security_audit',
    PERFORMANCE_VALIDATION: 'performance_validation',
    INCIDENT_POSTMORTEM: 'incident_postmortem',
    TRACK_COMPLETION: 'track_completion',
};

// Stakeholder roles
const STAKEHOLDER_ROLES = {
    ENGINEERING_LEAD: { name: 'Engineering Lead', required: true },
    OPERATIONS_MANAGER: { name: 'Operations Manager', required: true },
    PRODUCT_OWNER: { name: 'Product Owner', required: true },
    SECURITY_OFFICER: { name: 'Security Officer', required: true },
    QA_LEAD: { name: 'QA Lead', required: false },
    CTO: { name: 'CTO', required: true },
};

// Create new sign-off request
router.post('/', authenticate, requireScope('signoff:create'), async (req, res, next) => {
    try {
        const {
            type,
            title,
            description,
            related_entity_id,
            required_stakeholders,
            deadline,
            metadata,
        } = req.body;

        // Validate type
        if (!Object.values(SIGNOFF_TYPES).includes(type)) {
            return res.status(400).json({
                error: 'Invalid sign-off type',
                allowed: Object.values(SIGNOFF_TYPES),
            });
        }

        // Create sign-off request
        const signoff = await prisma.signOffRequest.create({
            data: {
                type,
                title,
                description,
                related_entity_id,
                required_stakeholders: required_stakeholders || Object.keys(STAKEHOLDER_ROLES).filter(
                    role => STAKEHOLDER_ROLES[role].required
                ),
                deadline: deadline ? new Date(deadline) : null,
                metadata: metadata || {},
                status: 'pending',
                created_by: req.user.sub,
                created_at: new Date(),
            },
        });

        // Send notifications to required stakeholders
        await sendSignOffNotifications(signoff);

        res.status(201).json({
            success: true,
            data: signoff,
            message: 'Sign-off request created successfully',
        });
    } catch (err) {
        next(err);
    }
});

// Get all sign-off requests
router.get('/', authenticate, requireScope('signoff:read'), async (req, res, next) => {
    try {
        const { status, type, stakeholder } = req.query;

        const where = {};
        if (status) where.status = status;
        if (type) where.type = type;
        if (stakeholder) {
            where.required_stakeholders = {
                has: stakeholder,
            };
        }

        const signoffs = await prisma.signOffRequest.findMany({
            where,
            include: {
                signatures: true,
            },
            orderBy: { created_at: 'desc' },
        });

        // Enrich with progress
        const enriched = signoffs.map(signoff => ({
            ...signoff,
            progress: {
                signed: signoff.signatures.length,
                required: signoff.required_stakeholders.length,
                percentage: (signoff.signatures.length / signoff.required_stakeholders.length) * 100,
            },
            missing_signatures: signoff.required_stakeholders.filter(
                role => !signoff.signatures.find(sig => sig.stakeholder_role === role)
            ),
        }));

        res.json({
            success: true,
            data: enriched,
            count: enriched.length,
        });
    } catch (err) {
        next(err);
    }
});

// Get specific sign-off request
router.get('/:id', authenticate, requireScope('signoff:read'), async (req, res, next) => {
    try {
        const signoff = await prisma.signOffRequest.findUnique({
            where: { id: req.params.id },
            include: {
                signatures: {
                    include: {
                        user: {
                            select: { id: true, email: true, name: true },
                        },
                    },
                },
            },
        });

        if (!signoff) {
            return res.status(404).json({ error: 'Sign-off request not found' });
        }

        // Calculate status
        const progress = {
            signed: signoff.signatures.length,
            required: signoff.required_stakeholders.length,
            percentage: (signoff.signatures.length / signoff.required_stakeholders.length) * 100,
        };

        const missing = signoff.required_stakeholders.filter(
            role => !signoff.signatures.find(sig => sig.stakeholder_role === role)
        );

        res.json({
            success: true,
            data: {
                ...signoff,
                progress,
                missing_signatures: missing,
                is_complete: missing.length === 0,
            },
        });
    } catch (err) {
        next(err);
    }
});

// Sign off on a request
router.post('/:id/sign', authenticate, requireScope('signoff:sign'), async (req, res, next) => {
    try {
        const { stakeholder_role, comments, conditions } = req.body;

        // Get sign-off request
        const signoff = await prisma.signOffRequest.findUnique({
            where: { id: req.params.id },
            include: { signatures: true },
        });

        if (!signoff) {
            return res.status(404).json({ error: 'Sign-off request not found' });
        }

        if (signoff.status === 'completed') {
            return res.status(400).json({ error: 'Sign-off already completed' });
        }

        if (signoff.status === 'cancelled') {
            return res.status(400).json({ error: 'Sign-off has been cancelled' });
        }

        // Check if stakeholder already signed
        const existingSignature = signoff.signatures.find(
            sig => sig.stakeholder_role === stakeholder_role
        );

        if (existingSignature) {
            return res.status(400).json({
                error: 'Stakeholder has already signed off',
                signature: existingSignature,
            });
        }

        // Verify user has authority for this role
        if (!await verifyStakeholderAuthority(req.user, stakeholder_role)) {
            return res.status(403).json({
                error: 'User does not have authority for this stakeholder role',
            });
        }

        // Create signature
        const signature = await prisma.signOffSignature.create({
            data: {
                sign_off_request_id: signoff.id,
                stakeholder_role,
                user_id: req.user.sub,
                signed_at: new Date(),
                comments: comments || null,
                conditions: conditions || null,
                ip_address: req.ip,
            },
        });

        // Check if all required stakeholders have signed
        const allSignatures = [...signoff.signatures, signature];
        const allSigned = signoff.required_stakeholders.every(role =>
            allSignatures.find(sig => sig.stakeholder_role === role)
        );

        // Update sign-off status if complete
        if (allSigned) {
            await prisma.signOffRequest.update({
                where: { id: signoff.id },
                data: {
                    status: 'completed',
                    completed_at: new Date(),
                },
            });

            // Trigger completion actions
            await handleSignOffCompletion(signoff);
        }

        res.json({
            success: true,
            data: signature,
            message: allSigned
                ? 'Sign-off completed! All stakeholders have signed.'
                : 'Signature recorded. Awaiting remaining stakeholders.',
            sign_off_complete: allSigned,
        });
    } catch (err) {
        next(err);
    }
});

// Reject/decline sign-off
router.post('/:id/reject', authenticate, requireScope('signoff:sign'), async (req, res, next) => {
    try {
        const { stakeholder_role, reason } = req.body;

        if (!reason || reason.trim().length < 10) {
            return res.status(400).json({
                error: 'Rejection reason required (min 10 characters)',
            });
        }

        const signoff = await prisma.signOffRequest.findUnique({
            where: { id: req.params.id },
        });

        if (!signoff) {
            return res.status(404).json({ error: 'Sign-off request not found' });
        }

        // Verify authority
        if (!await verifyStakeholderAuthority(req.user, stakeholder_role)) {
            return res.status(403).json({
                error: 'User does not have authority for this stakeholder role',
            });
        }

        // Record rejection
        await prisma.signOffRejection.create({
            data: {
                sign_off_request_id: signoff.id,
                stakeholder_role,
                user_id: req.user.sub,
                rejected_at: new Date(),
                reason,
                ip_address: req.ip,
            },
        });

        // Update sign-off status
        await prisma.signOffRequest.update({
            where: { id: signoff.id },
            data: {
                status: 'rejected',
                rejected_at: new Date(),
                rejection_reason: reason,
            },
        });

        // Notify requester and stakeholders
        await sendRejectionNotifications(signoff, stakeholder_role, reason);

        res.json({
            success: true,
            message: 'Sign-off rejected',
            data: { status: 'rejected', reason },
        });
    } catch (err) {
        next(err);
    }
});

// Cancel sign-off request
router.post('/:id/cancel', authenticate, requireScope('signoff:manage'), async (req, res, next) => {
    try {
        const { reason } = req.body;

        const signoff = await prisma.signOffRequest.update({
            where: { id: req.params.id },
            data: {
                status: 'cancelled',
                cancelled_at: new Date(),
                cancellation_reason: reason || 'Cancelled by requester',
            },
        });

        res.json({
            success: true,
            message: 'Sign-off request cancelled',
            data: signoff,
        });
    } catch (err) {
        next(err);
    }
});

// Get sign-off statistics
router.get('/stats/overview', authenticate, requireScope('signoff:read'), async (req, res, next) => {
    try {
        const [pending, completed, rejected, overdue] = await Promise.all([
            prisma.signOffRequest.count({ where: { status: 'pending' } }),
            prisma.signOffRequest.count({ where: { status: 'completed' } }),
            prisma.signOffRequest.count({ where: { status: 'rejected' } }),
            prisma.signOffRequest.count({
                where: {
                    status: 'pending',
                    deadline: { lt: new Date() },
                },
            }),
        ]);

        // Average time to complete
        const completedSignoffs = await prisma.signOffRequest.findMany({
            where: { status: 'completed' },
            select: {
                created_at: true,
                completed_at: true,
            },
        });

        const avgTimeToComplete = completedSignoffs.length > 0
            ? completedSignoffs.reduce((sum, s) => {
                return sum + (s.completed_at.getTime() - s.created_at.getTime());
            }, 0) / completedSignoffs.length / 1000 / 3600 // Convert to hours
            : 0;

        res.json({
            success: true,
            data: {
                pending,
                completed,
                rejected,
                overdue,
                total: pending + completed + rejected,
                avg_time_to_complete_hours: Math.round(avgTimeToComplete * 10) / 10,
                completion_rate: completed / (completed + rejected) * 100,
            },
        });
    } catch (err) {
        next(err);
    }
});

// Helper functions

async function sendSignOffNotifications(signoff) {
    // Send notifications via configured channels
    try {
        const notifications = [];
        // Email notification (when SMTP configured)
        if (process.env.SMTP_HOST) {
            notifications.push({ channel: 'email', status: 'pending' });
        }
        // Slack notification (when webhook configured)
        if (process.env.SLACK_WEBHOOK_URL) {
            notifications.push({ channel: 'slack', status: 'pending' });
        }
        // TODO: Send actual notifications once integration credentials are configured
        console.log('Signoff created - notifications queued:', notifications);
    } catch (notifyErr) {
        console.warn('Notification failed (non-blocking):', notifyErr.message);
    }
    console.log(`📧 Sending sign-off notifications for: ${signoff.title}`);
    console.log(`   Required stakeholders: ${signoff.required_stakeholders.join(', ')}`);

    // In production, this would send emails/Slack messages to each stakeholder
}

async function verifyStakeholderAuthority(user, role) {
    // Verify user role authorization
    const userRole = user?.role || 'user';
    const authorizedRoles = ['admin', 'manager', 'lead'];
    const isAuthorized = authorizedRoles.includes(userRole);
    const isKnownStakeholderRole = Object.prototype.hasOwnProperty.call(STAKEHOLDER_ROLES, role);
    // TODO: Enhance with database-backed role permissions when user management is expanded
    if (!isAuthorized) {
        console.warn(`User ${user?.sub} attempted signoff without authorization`);
    }
    if (!isKnownStakeholderRole) {
        console.warn(`Unknown stakeholder role provided for signoff: ${role}`);
    }
    // For now, accept if user has 'signoff:sign' scope
    return isAuthorized && isKnownStakeholderRole && user?.scopes?.includes('signoff:sign');
}

async function handleSignOffCompletion(signoff) {
    console.log(`✅ Sign-off completed: ${signoff.title}`);

    // Trigger automated actions based on sign-off type
    switch (signoff.type) {
        case SIGNOFF_TYPES.DEPLOYMENT:
            // Trigger production deployment
            console.log('🚀 Triggering production deployment...');
            break;
        case SIGNOFF_TYPES.FEATURE_RELEASE:
            // Enable feature flag
            console.log('🚩 Enabling feature flag...');
            break;
        case SIGNOFF_TYPES.TRACK_COMPLETION:
            // Update project status
            console.log('📊 Updating track completion status...');
            break;
        default:
            console.log('No automated action for this sign-off type');
    }

    // Send completion notifications
    await sendCompletionNotifications(signoff);
}

async function sendRejectionNotifications(signoff, role, reason) {
    console.log(`❌ Sign-off rejected by ${role}`);
    console.log(`   Reason: ${reason}`);
    // TODO: Send notifications to requester and stakeholders
}

async function sendCompletionNotifications(signoff) {
    console.log(`✅ Sending completion notifications for: ${signoff.title}`);
    // TODO: Send success notifications
}

module.exports = {
    router,
    SIGNOFF_TYPES,
    STAKEHOLDER_ROLES,
};
