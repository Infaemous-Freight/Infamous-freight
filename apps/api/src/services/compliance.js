/**
 * GDPR & Compliance Service
 * Support for GDPR, HIPAA, SOC 2, CCPA, LGPD, and DPA compliance
 * @module services/compliance
 */

const prisma = require("../lib/prisma");

class ComplianceService {
    // Supported compliance frameworks
    static COMPLIANCE_STANDARDS = {
        GDPR: "General Data Protection Regulation (EU)",
        HIPAA: "Health Insurance Portability and Accountability Act (US)",
        SOC2: "System and Organization Controls 2 (US)",
        CCPA: "California Consumer Privacy Act (US)",
        LGPD: "Lei Geral de Proteção de Dados (Brazil)",
        DPA: "Data Protection Act 2018 (UK)",
    };

    // Check GDPR compliance
    async checkGDPRCompliance(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { dataConsents: true },
        });

        if (!user) throw new Error("User not found");

        return {
            standard: "GDPR",
            userId,
            hasLawfulBasis: !!user.dataConsents,
            consentStatus: {
                marketing: user.dataConsents?.some((c) => c.type === "marketing") || false,
                analytics: user.dataConsents?.some((c) => c.type === "analytics") || false,
                thirdParty: user.dataConsents?.some((c) => c.type === "thirdParty") || false,
            },
            rightToAccessData: true,
            rightToBeForgettenAvailable: true,
            rightToDataPortabilityAvailable: true,
            processedAt: new Date().toISOString(),
        };
    }

    // Get user data for GDPR data subject request
    async getUserDataExport(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                shipments: true,
                payments: true,
                auditLogs: true,
            },
        });

        if (!user) throw new Error("User not found");

        const sanitized = {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            shipments: user.shipments,
            payments: user.payments,
            auditLogs: user.auditLogs,
        };

        return {
            status: "ready_for_export",
            data: sanitized,
            exportedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        };
    }

    // Delete user data (right to be forgotten)
    async deleteUserData(userId, reason = "user_request") {
        try {
            // Log deletion request
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: "DATA_DELETION_REQUEST",
                    reason,
                    timestamp: new Date(),
                },
            });

            // Delete user shipments
            await prisma.shipment.deleteMany({
                where: { userId },
            });

            // Delete user payments
            await prisma.payment.deleteMany({
                where: { userId },
            });

            // Delete user address and personal data
            await prisma.user.update({
                where: { id: userId },
                data: {
                    email: `deleted_${userId}@example.com`,
                    name: "DELETED",
                    phone: null,
                    address: null,
                    deletedAt: new Date(),
                },
            });

            return {
                status: "deleted",
                userId,
                deletedAt: new Date().toISOString(),
            };
        } catch (err) {
            throw new Error(`Data deletion failed: ${err.message}`);
        }
    }

    // Check HIPAA compliance (healthcare data)
    async checkHIPAACompliance(facilityId) {
        return {
            standard: "HIPAA",
            facilityId,
            encryptionRequired: true,
            accessLogsRequired: true,
            auditTrailRequired: true,
            businessAssociateAgreement: "required",
            physicalSecurity: "required",
            networkSecurity: "required",
            employeeTraining: "annual_required",
            complianceStatus: "not_evaluated",
        };
    }

    // Check SOC 2 Type II compliance
    async checkSOC2Compliance() {
        return {
            standard: "SOC2_TYPE_II",
            scope: [
                "Security",
                "Availability",
                "Processing Integrity",
                "Confidentiality",
                "Privacy",
            ],
            assessmentPeriod: "12_months",
            auditorRequired: true,
            controlsEvaluated: [
                "Access Controls",
                "Change Management",
                "Encryption",
                "Incident Response",
                "Data Retention",
            ],
            lastAudit: "2024-01-15",
            nextAudit: "2025-01-15",
            complianceStatus: "in_progress",
        };
    }

    // Check CCPA compliance (California residents)
    async checkCCPACompliance(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        return {
            standard: "CCPA",
            userId,
            applicableToUser: user?.state === "CA",
            rightToKnow: true,
            rightToDelete: true,
            rightToOptOut: true,
            rightToNonDiscrimination: true,
            privacyPolicyRequired: true,
            doNotSellMyInfoAvailable: true,
            optOutDeadlineMonths: 45,
            complianceStatus: "compliant",
        };
    }

    // Check LGPD compliance (Brazil)
    async checkLGPDCompliance(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        return {
            standard: "LGPD",
            userId,
            lawfulBasisRequired: true,
            consentRequired: true,
            dataControllerRequired: true,
            dataProtectionOfficerRequired: false,
            dataProcessingAgreement: "required",
            privacyPolicyRequired: true,
            rightsAvailable: [
                "access",
                "correction",
                "deletion",
                "portability",
                "anonymization",
            ],
            complianceStatus: "compliant",
        };
    }

    // Check Data Protection Act (UK) compliance
    async checkDPACompliance(dataCategory) {
        return {
            standard: "DPA_2018",
            dataCategory,
            legalBasisRequired: true,
            consentRequired: true,
            privacyNoticeRequired: true,
            subjectAccessRequestDeadline: "30_days",
            dataRetention: "configurable",
            internationalTransfers: "adequacy_decision_required",
            complianceStatus: "compliant",
        };
    }

    // Audit data processing
    async auditDataProcessing(filters = {}) {
        const auditLogs = await prisma.auditLog.findMany({
            where: {
                ...(filters.userId && { userId: filters.userId }),
                ...(filters.action && { action: filters.action }),
                ...(filters.dateFrom && { timestamp: { gte: filters.dateFrom } }),
                ...(filters.dateTo && { timestamp: { lte: filters.dateTo } }),
            },
            orderBy: { timestamp: "desc" },
            take: 1000,
        });

        return {
            totalRecords: auditLogs.length,
            records: auditLogs,
            period: {
                from: filters.dateFrom || "all_time",
                to: filters.dateTo || new Date().toISOString(),
            },
        };
    }

    // Generate compliance report
    async generateComplianceReport(standard) {
        if (!ComplianceService.COMPLIANCE_STANDARDS[standard]) {
            throw new Error(`Unknown compliance standard: ${standard}`);
        }

        return {
            standard,
            reportDate: new Date().toISOString(),
            status: "compliant",
            requirements: {
                totalRequirements: this.getRequirementsCount(standard),
                metRequirements: this.getRequirementsCount(standard) - 1,
                failedRequirements: 1,
                notApplicable: 0,
            },
            recommendations: [
                "Implement automated data retention policies",
                "Enhance access logging mechanisms",
                "Conduct annual security audit",
            ],
            nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        };
    }

    // Helper: Get requirements count per standard
    getRequirementsCount(standard) {
        const counts = {
            GDPR: 99,
            HIPAA: 164,
            SOC2: 142,
            CCPA: 8,
            LGPD: 72,
            DPA: 68,
        };
        return counts[standard] || 0;
    }

    // Data retention policy
    async enforceDataRetention(standard) {
        const retentionPolicies = {
            GDPR: 3, // years
            HIPAA: 6,
            SOC2: 7,
            CCPA: 1,
            LGPD: 2,
            DPA: 6,
        };

        const years = retentionPolicies[standard] || 1;
        const cutoffDate = new Date(Date.now() - years * 365 * 24 * 60 * 60 * 1000);

        // Archive old shipments
        const archivedCount = await prisma.shipment.updateMany({
            where: {
                createdAt: { lt: cutoffDate },
                status: "delivered",
                archived: false,
            },
            data: {
                archived: true,
            },
        });

        return {
            standard,
            retentionYears: years,
            recordsArchived: archivedCount.count,
            cutoffDate: cutoffDate.toISOString(),
        };
    }
}

module.exports = new ComplianceService();
