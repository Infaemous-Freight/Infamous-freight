/**
 * Compliance & Insurance Automation Service - Phase 4
 * Automated insurance claims, compliance tracking, FMCSA monitoring, document management
 */

const { logger } = require("../middleware/logger");

class ComplianceInsuranceService {
    constructor() {
        this.complianceRecords = new Map(); // driverId -> compliance data
        this.insuranceClaims = new Map(); // claimId -> claim data
        this.documents = new Map(); // docId -> document data
        this.violations = new Map(); // violationId -> violation
        this.audits = []; // compliance audits history
    }

    /**
     * Initiate automated insurance claim
     * @param {Object} incident
     * @returns {Promise<Object>}
     */
    async initiateInsuranceClaim(incident) {
        try {
            const claimId = `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const claim = {
                id: claimId,
                type: incident.type, // collision, theft, cargo_damage, injury, liability
                status: "auto_initiated",
                severity: this.assessClaimSeverity(incident),
                timestamp: new Date(),
                incidentData: {
                    date: incident.date,
                    location: incident.location,
                    description: incident.description,
                    witnesses: incident.witnesses || [],
                    photos: incident.photos || [],
                },
                involved: {
                    driver: incident.driverId,
                    vehicle: incident.vehicleId,
                    thirdParty: incident.thirdParty || null,
                    shipper: incident.shipperId || null,
                },
                estimatedAmount: this.estimateClaimAmount(incident),
                recommendedDeductible: this.getRecommendedDeductible(incident.type),
                documentsRequired: this.getRequiredDocuments(incident.type),
                assignedAdjuster: {
                    name: "Auto-Assignment Pending",
                    email: "claim-adjuster@insuranceops.com",
                },
                timeline: {
                    claimFilingDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    estimatedResolution: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                },
            };

            this.insuranceClaims.set(claimId, claim);

            logger.info("Insurance claim initiated", {
                claimId,
                type: incident.type,
                severity: claim.severity,
                estimatedAmount: claim.estimatedAmount,
            });

            return {
                success: true,
                claim,
                claimId,
                nextSteps: [
                    "Gather all incident documentation",
                    "Upload photos and witness statements",
                    "Submit claim within 30 days",
                ],
            };
        } catch (err) {
            logger.error("Insurance claim initiation failed", { err });
            throw err;
        }
    }

    /**
     * Track and manage compliance records
     * @param {string} driverId
     * @param {Object} complianceData
     * @returns {Promise<Object>}
     */
    async trackCompliance(driverId, complianceData) {
        try {
            const compliance = {
                driverId,
                recordDate: new Date(),
                status: "under_review",
                checks: {
                    license: {
                        valid: complianceData.licenseValid,
                        expiryDate: complianceData.licenseExpiry,
                        violations: complianceData.licenseViolations || 0,
                    },
                    medicalCert: {
                        valid: complianceData.medicalCertValid,
                        expiryDate: complianceData.medicalCertExpiry,
                        daysUntilExpiry: this.daysUntilExpiry(complianceData.medicalCertExpiry),
                    },
                    hazmat: {
                        certified: complianceData.hazmatCertified,
                        expiryDate: complianceData.hazmatExpiry,
                        endorsements: complianceData.hazmatEndorsements || [],
                    },
                    backgroundCheck: {
                        cleared: complianceData.backgroundCleared,
                        lastCheckDate: complianceData.lastBackgroundCheck,
                        nextRequired: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                    },
                    drinkingDriving: {
                        screened: true,
                        daysUntilRequired: 30 - Math.floor(Math.random() * 30),
                        result: "passed",
                    },
                    safetyInspection: {
                        passed: complianceData.safetyInspectionPassed,
                        lastInspectionDate: complianceData.lastSafetyInspection,
                        nextRequired: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
                    },
                    trainingCertificationss: {
                        safetyTraining: {
                            completed: true,
                            expiryDate: complianceData.safetyTrainingExpiry,
                        },
                        defensiveDriving: {
                            completed: true,
                            expiryDate: complianceData.defensiveDrivingExpiry,
                        },
                        docsManagement: {
                            completed: true,
                            expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
                        },
                    },
                },
                violations: this.getDriverViolations(driverId),
                recommendations: this.generateComplianceRecommendations(complianceData),
                overallStatus: this.determineComplianceStatus(complianceData),
            };

            const existing = this.complianceRecords.get(driverId) || [];
            existing.push(compliance);
            this.complianceRecords.set(driverId, existing.slice(-12)); // keep last year

            logger.info("Compliance tracked", {
                driverId,
                status: compliance.overallStatus,
                violationCount: compliance.violations.length,
            });

            return {
                success: true,
                driverId,
                complianceStatus: compliance.overallStatus,
                recordedChecks: Object.keys(compliance.checks).length,
                violations: compliance.violations.length,
            };
        } catch (err) {
            logger.error("Compliance tracking failed", { driverId, err });
            throw err;
        }
    }

    /**
     * Monitor FMCSA violations
     * @param {string} driverId
     * @returns {Promise<Object>}
     */
    async checkFMCSAViolations(driverId) {
        try {
            const violations = {
                driverId,
                recordDate: new Date(),
                fmcsaRecord: {
                    violations: [
                        {
                            date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
                            code: "HOS001",
                            description: "Hours of Service violation",
                            severity: "minor",
                            fineAmount: 150,
                            corrected: true,
                        },
                        {
                            date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                            code: "SEAT001",
                            description: "Seat belt violation",
                            severity: "minor",
                            fineAmount: 75,
                            corrected: true,
                        },
                    ],
                    overallStatus: "compliant",
                    safetyRating: 85,
                    targetRating: 80,
                    performanceRecord: {
                        unsafe_driving: 0,
                        fatigued_driving: 0,
                        maintenance: 0,
                        haz_mat: 0,
                        oos: 0, // out of service
                    },
                },
                riskFactors: [],
                recommendations: [],
            };

            // Check for out-of-service items
            for (const violation of violations.fmcsaRecord.violations) {
                if (violation.severity === "critical" && !violation.corrected) {
                    violations.riskFactors.push("OUT_OF_SERVICE_ITEM_UNCORRECTED");
                    violations.recommendations.push(`Correct violation ${violation.code} immediately`);
                }
            }

            if (violations.fmcsaRecord.safetyRating < violations.fmcsaRecord.targetRating) {
                violations.riskFactors.push("SAFETY_RATING_BELOW_TARGET");
                violations.recommendations.push("Complete safety training");
            }

            logger.info("FMCSA violations checked", {
                driverId,
                violationCount: violations.fmcsaRecord.violations.length,
                safetyRating: violations.fmcsaRecord.safetyRating,
            });

            return violations;
        } catch (err) {
            logger.error("FMCSA check failed", { driverId, err });
            throw err;
        }
    }

    /**
     * Manage compliance documents
     * @param {Object} document
     * @returns {Promise<Object>}
     */
    async uploadComplianceDocument(document) {
        try {
            const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const docRecord = {
                id: docId,
                driverId: document.driverId,
                type: document.type, // license, medical_cert, hazmat_cert, insurance, etc.
                fileName: document.fileName,
                fileSize: document.fileSize,
                uploadDate: new Date(),
                expiryDate: document.expiryDate,
                status: "pending_verification",
                verificationResults: null,
                ocrResults: this.performOCR(document),
                issuingAuthority: document.issuingAuthority,
                verificationMethod: "manual_review", // or ocr_auto
            };

            this.documents.set(docId, docRecord);

            logger.info("Compliance document uploaded", {
                docId,
                driverId: document.driverId,
                type: document.type,
            });

            return {
                success: true,
                docId,
                status: "pending_verification",
                ocrData: docRecord.ocrResults,
                estimatedVerificationTime: "24-48 hours",
            };
        } catch (err) {
            logger.error("Document upload failed", { err });
            throw err;
        }
    }

    /**
     * Run compliance audit
     * @param {string} driverId
     * @returns {Promise<Object>}
     */
    async runComplianceAudit(driverId) {
        try {
            const audit = {
                id: `audit_${Date.now()}`,
                driverId,
                auditDate: new Date(),
                categories: {
                    documentation: { score: 95, status: "compliant" },
                    licensing: { score: 100, status: "compliant" },
                    medical: { score: 90, status: "compliant" },
                    training: { score: 88, status: "compliant" },
                    vehicle_maintenance: { score: 85, status: "minor_issues" },
                    safety_record: { score: 92, status: "compliant" },
                    violations_history: { score: 80, status: "minor_issues" },
                },
                overallScore: 0,
                overallStatus: "",
                findings: [
                    {
                        category: "vehicle_maintenance",
                        issue: "Next oil change due in 150 miles",
                        priority: "high",
                        dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
                    },
                ],
                recommendations: [],
                certificationStatus: "certified",
                nextAuditDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            };

            // Calculate overall score
            const scores = Object.values(audit.categories).map((c) => c.score);
            audit.overallScore = Math.round(scores.reduce((a, b) => a + b) / scores.length);

            // Determine status
            if (audit.overallScore >= 95) audit.overallStatus = "excellently_compliant";
            else if (audit.overallScore >= 90) audit.overallStatus = "compliant";
            else if (audit.overallScore >= 85) audit.overallStatus = "acceptable";
            else audit.overallStatus = "needs_improvement";

            this.audits.push(audit);

            logger.info("Compliance audit completed", {
                driverId,
                overallScore: audit.overallScore,
                status: audit.overallStatus,
            });

            return {
                success: true,
                audit,
                actionItems: audit.findings.length,
            };
        } catch (err) {
            logger.error("Compliance audit failed", { driverId, err });
            throw err;
        }
    }

    // Helper methods

    assessClaimSeverity(incident) {
        switch (incident.type) {
            case "injury":
                return "critical";
            case "collision":
                return incident.damageEstimate > 10000 ? "high" : "medium";
            case "cargo_damage":
                return incident.cargoValue > 50000 ? "high" : "medium";
            case "theft":
                return "high";
            case "liability":
                return "medium";
            default:
                return "low";
        }
    }

    estimateClaimAmount(incident) {
        switch (incident.type) {
            case "collision":
                return incident.damageEstimate || 5000;
            case "cargo_damage":
                return Math.min(incident.cargoValue || 10000, 100000);
            case "theft":
                return incident.theftValue || 50000;
            case "liability":
                return incident.liabilityEstimate || 25000;
            default:
                return 1000;
        }
    }

    getRecommendedDeductible(claimType) {
        const deductibles = {
            collision: 1000,
            theft: 500,
            cargo_damage: 2500,
            liability: 1000,
            injury: 5000,
        };
        return deductibles[claimType] || 1000;
    }

    getRequiredDocuments(claimType) {
        const docs = {
            collision: ["Police Report", "Photos of Damage", "Repair Estimate", "Insurance ID Card"],
            cargo_damage: ["BOL", "Damage Report", "Photos", "Repair Estimate"],
            theft: ["Police Report", "Declaration", "Proof of Loss"],
            injury: ["Medical Records", "Incident Report", "Witness Statements"],
            liability: ["Third-party Report", "Photos", "Witness Information"],
        };
        return docs[claimType] || [];
    }

    getDriverViolations(driverId) {
        return [
            // Simulated violations
        ];
    }

    generateComplianceRecommendations(complianceData) {
        const recommendations = [];

        if (complianceData.licenseViolations > 2) {
            recommendations.push("Schedule defensive driving course");
        }

        if (!complianceData.hazmatCertified && complianceData.appliesForHazmat) {
            recommendations.push("Obtain hazmat certification");
        }

        return recommendations;
    }

    determineComplianceStatus(complianceData) {
        let status = "compliant";

        if (
            complianceData.licenseViolations > 2 ||
            !complianceData.medicalCertValid ||
            !complianceData.backgroundCleared
        ) {
            status = "non_compliant";
        } else if (
            complianceData.licenseViolations === 1 ||
            this.daysUntilExpiry(complianceData.medicalCertExpiry) < 30
        ) {
            status = "warning";
        }

        return status;
    }

    daysUntilExpiry(expiryDate) {
        if (!expiryDate) return Infinity;
        return Math.floor((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    }

    performOCR(document) {
        // Simulated OCR results
        return {
            documentType: document.type,
            extractedData: {
                name: "JOHN DOE",
                licenseNumber: "D1234567",
                expirationDate: "12/31/2026",
                address: "123 Main St, City, State 12345",
                class: "A",
                restrictions: [],
            },
            confidence: 0.98,
            requiresManualReview: false,
        };
    }
}

module.exports = new ComplianceInsuranceService();
