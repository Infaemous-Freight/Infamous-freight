#!/bin/bash

# CLEANUP SCRIPT - Remove redundant, outdated, and unnecessary files
# Date: February 14, 2026

set -e

cd /workspaces/Infamous-freight-enterprises

echo "🗑️  CLEANING UP REDUNDANT FILES..."
echo ""

# Count files before
BEFORE=$(ls -1 *.md *.sh *.txt 2>/dev/null | wc -l)
echo "Files before cleanup: $BEFORE"
echo ""

# =============================================================================
# DELETE: Redundant "COMPLETE" status files (keeping only the newest)
# =============================================================================
echo "Removing redundant COMPLETE status files..."

rm -f "00_START_HERE.md"
rm -f "2026_PRICING_ACTIVATION_COMPLETE.md"
rm -f "2026_PRICING_UPDATE_COMPLETE.md"
rm -f "22_RECOMMENDATIONS_COMPLETE.md"
rm -f "22_RECOMMENDATIONS_IMPLEMENTATION_STATUS.md"
rm -f "ACTIONABLE_RECOMMENDATIONS.md"
rm -f "ALL_PHASES_COMPLETE_100_FINAL.md"
rm -f "AUDIT_COMPLETION_100_REPORT.md"
rm -f "AUDIT_EXECUTIVE_SUMMARY.txt"
rm -f "AUDIT_INDEX.md"
rm -f "AUDIT_QUICK_FIXES.md"
rm -f "AUTOMATION_100_COMPLETE.md"
rm -f "AUTOMATION_COMPLETE_95_PERCENT.md"
rm -f "COMMERCIAL_GRADE_COMPLETE.md"
rm -f "COMPLETE_100_FINAL_STATUS.md"
rm -f "COMPLETE_EXECUTION_STATUS.md"
rm -f "COMPLETION_100_FINAL.md"
rm -f "COVERAGE_100_EXECUTABLE_PLAN.md"
rm -f "COVERAGE_100_IMPLEMENTATION.md"
rm -f "COVERAGE_100_ROADMAP.md"
rm -f "COVERAGE_100_STATUS.md"
rm -f "CREDENTIALS_READY_100.md"
rm -f "DEEP_SCAN_AUDIT_100_REPORT.md"
rm -f "DELIVERY_COMPLETION_REPORT.md"

# =============================================================================
# DELETE: Redundant DEPLOYMENT files (keeping DEPLOYMENT.md only)
# =============================================================================
echo "Removing redundant deployment files..."

rm -f "DEPLOYMENT_100_COMPLETE.md"
rm -f "DEPLOYMENT_100_READY.md"
rm -f "DEPLOYMENT_100_SUMMARY.md"
rm -f "DEPLOYMENT_CHECKLIST_20260214_005327.md"
rm -f "DEPLOYMENT_COMPLETE_WORLDWIDE.md"
rm -f "DEPLOYMENT_EXECUTION_100_COMPLETE.md"
rm -f "DEPLOYMENT_QUICK_START_100.md"
rm -f "DEPLOYMENT_READY_100.md"
rm -f "DEPLOYMENT_SIGN_OFF_100.md"
rm -f "DEPLOYMENT_STATUS_100.md"
rm -f "DEPLOYMENT_VERIFICATION_CHECKLIST.md"
rm -f "DEPLOY_TO_WORLD_100_GUIDE.md"
rm -f "LIVE_DEPLOYMENT_STATUS.md"
rm -f "MASTER_DEPLOYMENT_VERIFICATION_100.md"
rm -f "PERFECT_DEPLOYMENT_100_STATUS.md"
rm -f "PRODUCTION_DEPLOYMENT_REPORT.txt"
rm -f "PRODUCTION_DEPLOY_GUIDE.md"
rm -f "PRODUCTION_INTEGRATION_100.md"
rm -f "PRODUCTION_READINESS_100.md"
rm -f "PRODUCTION_READINESS_REPORT.md"
rm -f "PRODUCTION_RUNBOOK.md"
rm -f "QUICK_DEPLOY.md"
rm -f "QUICK_DEPLOY_STATUS.md"
rm -f "READY_FOR_100_DEPLOYMENT.md"

# =============================================================================
# DELETE: Old PHASE files (all phases complete, no longer needed)
# =============================================================================
echo "Removing old phase files..."

rm -f "PHASE_10_BUSINESS_INTELLIGENCE.md"
rm -f "PHASE_11_ENTERPRISE_OPERATIONS.md"
rm -f "PHASE_1_2_3_COMPLETE.md"
rm -f "PHASE_1_SETUP.sh"
rm -f "PHASE_1_STARTED.md"
rm -f "PHASE_2_COMPLETE_100.md"
rm -f "PHASE_2_EXECUTIVE_SUMMARY.md"
rm -f "PHASE_2_FINAL_STATUS.md"
rm -f "PHASE_2_STATUS.md"
rm -f "PHASE_3_COMPLETE_100.md"
rm -f "PHASE_3_EXECUTION_PLAN_100.md"
rm -f "PHASE_3_INTEGRATION_TESTS_100.md"
rm -f "PHASE_4_10_IMPLEMENTATION_PACKAGE.md"
rm -f "PHASE_4_5_COMPLETE_FINAL_REPORT.md"
rm -f "PHASE_4_DEPLOYMENT_VALIDATION.md"
rm -f "PHASE_5_PERFORMANCE_OPTIMIZATION.md"
rm -f "PHASE_6_SECURITY_HARDENING.md"
rm -f "PHASE_7_MOBILE_APP.md"
rm -f "PHASE_8_ADVANCED_FEATURES.md"
rm -f "PHASE_9_COMPLIANCE_LEGAL.md"
rm -f "PHASE_EXECUTION_SUMMARY.md"
rm -f "PHASE_IV_COMPLETION_100.md"
rm -f "PHASE_IV_INTEGRATION_CHECKLIST.md"
rm -f "MASTER_PHASE_MAP_FINAL.md"

# =============================================================================
# DELETE: Redundant EXECUTION/STATUS files
# =============================================================================
echo "Removing redundant execution status files..."

rm -f "DO_ALL_SAID_100_PERCENT_FINAL.txt"
rm -f "EXECUTE_ALL_NOW_20260214_005327.txt"
rm -f "EXECUTION_CHECKLIST_100.md"
rm -f "EXECUTION_GUIDE_26_WEEKS.md"
rm -f "EXECUTION_STATUS_ALL_RECOMMENDATIONS_100_COMPLETE.md"
rm -f "FINAL_100_COMPLETION_REPORT.txt"
rm -f "FINAL_EXECUTION_STATUS_100_PERCENT.txt"
rm -f "HOW_TO_REACH_100.txt"
rm -f "IMPLEMENTATIONS_ALL_22_RECOMMENDATIONS.md"
rm -f "IMPLEMENTATION_100_PERCENT.md"
rm -f "IMPLEMENTATION_COMPLETE.md"
rm -f "IMPLEMENTATION_COMPLETE_SUMMARY.md"
rm -f "IMPLEMENTATION_DELIVERY_SUMMARY.md"
rm -f "LAUNCH_EXECUTION_REPORT_100_PERCENT.md"
rm -f "MASTER_EXECUTION_CHECKLIST.md"
rm -f "MASTER_EXECUTION_STATUS.md"
rm -f "PATH_TO_100_PERCENT.md"
rm -f "PERFECT_HEALTH_ACHIEVEMENT.md"
rm -f "RUN_ALL_SCRIPTS_100_STATUS.md"
rm -f "SCRIPTS_EXECUTION_100_COMPLETE.md"
rm -f "STATUS_100_PERCENT.md"

# =============================================================================
# DELETE: Redundant RAILWAY files (if not using Railway)
# =============================================================================
echo "Removing Railway-specific files..."

rm -f "RAILWAY_COMMANDS_REFERENCE.md"
rm -f "RAILWAY_COMPLETE_SUMMARY.md"
rm -f "RAILWAY_DELIVERY_SUMMARY.md"
rm -f "RAILWAY_DEPLOYMENT_100_COMPLETE.md"
rm -f "RAILWAY_DEPLOYMENT_GUIDE.md"
rm -f "RAILWAY_DEPLOYMENT_READY.md"
rm -f "RAILWAY_EXECUTION_CHECKLIST.md"
rm -f "RAILWAY_INDEX.md"
rm -f "RAILWAY_MANUAL_DEPLOYMENT.md"
rm -f "RAILWAY_SETUP_CHECKLIST.md"

# =============================================================================
# DELETE: Redundant SENTRY files (keeping only best reference)
# =============================================================================
echo "Removing redundant Sentry files..."

rm -f "SENTRY_ADVANCED_USAGE.md"
rm -f "SENTRY_CRITICAL_FIXES.md"
rm -f "SENTRY_FINAL_SUMMARY.md"
rm -f "SENTRY_IMPLEMENTATION_CHECKLIST.md"
rm -f "SENTRY_INTEGRATION_GUIDE.md"
rm -f "SENTRY_QUICK_REFERENCE.md"
rm -f "SENTRY_README.md"
rm -f "SENTRY_RECOMMENDATIONS_100.md"
rm -f "SENTRY_SETUP_COMPLETE.md"
rm -f "SENTRY_WIZARD_COMMAND.md"

# =============================================================================
# DELETE: Redundant QUICKSTART/RECOMMENDATIONS files
# =============================================================================
echo "Removing redundant quick start files..."

rm -f "QUICKSTART_100.md"
rm -f "QUICK_REFERENCE.md"
rm -f "QUICK_START_KICKOFF.md"
rm -f "START_HERE.md"
rm -f "RECOMMENDATIONS_100_PERCENT_EXECUTION.md"
rm -f "RECOMMENDATIONS_2026_02.md"
rm -f "RECOMMENDATIONS_QUICK_START.md"
rm -f "FINAL_RECOMMENDATIONS.md"
rm -f "STRATEGIC_RECOMMENDATIONS_100.md"

# =============================================================================
# DELETE: Redundant TIER files (detailed in main guides)
# =============================================================================
echo "Removing redundant tier files..."

rm -f "TIER1_ADVANCED_MONITORING.md"
rm -f "TIER1_COMPLIANCE_AUTOMATION.md"
rm -f "TIER1_DATABASE_OPTIMIZATION.md"
rm -f "TIER1_DISASTER_RECOVERY.md"
rm -f "TIER1_RATE_LIMITING.md"
rm -f "TIER2_PARTNER_PROGRAM.md"
rm -f "TIER2_PRICING_MODEL.md"
rm -f "TIER2_REFERRAL_PROGRAM.md"
rm -f "TIER2_UPSELL_AUTOMATION.md"
rm -f "TIER3_2FA_AUTHENTICATION.md"
rm -f "TIER3_ENCRYPTION_PROTECTION.md"
rm -f "TIER3_THREAT_DETECTION_RESPONSE.md"
rm -f "TIER3_ZERO_TRUST_ARCHITECTURE.md"
rm -f "TIER4_MOBILE_APP_DEVELOPMENT.md"
rm -f "TIER4_WHITE_LABEL_PLATFORM.md"
rm -f "TIER5_SERIES_A_FUNDRAISING.md"

# =============================================================================
# DELETE: Redundant INDEX/GUIDE files
# =============================================================================
echo "Removing redundant index/guide files..."

rm -f "ADVANCED_AUTHENTICATION_GUIDE.md"
rm -f "ADVANCED_CACHING_GUIDE.md"
rm -f "ADVANCED_CACHING_STRATEGY.md"
rm -f "ADVANCED_MONITORING_SETUP.md"
rm -f "ANALYTICS_INTEGRATION_GUIDE.md"
rm -f "API_VERSIONING_GUIDE.md"
rm -f "BUILD.md"
rm -f "CLOUDFLARE_GLOBAL_ORIGIN_API.md"
rm -f "CLOUDFLARE_INDEX.md"
rm -f "CLOUDFLARE_INTEGRATION_RUNBOOK.md"
rm -f "CLOUDFLARE_QUICK_REFERENCE.md"
rm -f "COST_OPTIMIZATION_GUIDE.md"
rm -f "CRITICAL_CONFIG_VERIFICATION.md"
rm -f "CUSTOMER_ACQUISITION_GUIDE.md"
rm -f "DATABASE_OPTIMIZATION_GUIDE.md"
rm -f "DISASTER_RECOVERY_PLAN.md"
rm -f "DOCUMENTATION_INDEX.md"
rm -f "ENTERPRISE_IMPLEMENTATION_INDEX.md"
rm -f "ENTERPRISE_SETUP.md"
rm -f "ENVIRONMENT_SETUP.md"
rm -f "EXECUTIVE_SUMMARY.md"
rm -f "FEATURE_FLAGS_GUIDE.md"
rm -f "FLY_IO_DEPLOYMENT_GUIDE.md"
rm -f "FRAMEWORK_SETUP_GUIDE.md"
rm -f "FREE_TIER_LAUNCH_2026.md"
rm -f "FRESH_VERCEL_DEPLOY.md"
rm -f "GENESIS_GENIUS_SYSTEM_OF_RECORD.md"
rm -f "GENIUS_ARCHITECTURE_VALIDATION.md"
rm -f "GITHUB_ACTIONS_SECRETS_SETUP.md"
rm -f "INCIDENT_RESPONSE_PLAYBOOK.md"
rm -f "INVESTOR_PITCH_MATERIALS.md"
rm -f "LAUNCH_CHECKLIST_100.md"
rm -f "LEGAL_NOTICE.md"
rm -f "MANUAL_COMPLETION_STEPS.md"
rm -f "MARKETING_LAUNCH_PLAYBOOK.md"
rm -f "MISMATCH_AUDIT_100_FIXED.md"
rm -f "MODERN_DESIGN_GUIDE.md"
rm -f "MONITORING_GUIDE.md"
rm -f "MONITORING_SETUP_GUIDE.md"
rm -f "NEW_JWT_SECRET.md"
rm -f "ONBOARDING.md"
rm -f "OWASP_SECURITY_GUIDE.md"
rm -f "PERFORMANCE_OPTIMIZATION_GUIDE.md"
rm -f "PH_LAUNCH_CHECKLIST_20260214_005327.md"
rm -f "POST_LAUNCH_OPERATIONS.md"
rm -f "PRICING_MONETIZATION_GUIDE.md"
rm -f "PRODUCTION_EXCELLENCE_INDEX.md"
rm -f "REBUILD_100_COMPLETE_GUIDE.md"
rm -f "REBUILD_100_READY_FOR_EXECUTION.md"
rm -f "RELEASE_CHECKLIST.md"
rm -f "REPOSITORY_AUDIT_100_COMPLETE.md"
rm -f "SECURITY_AUDIT_GUIDE.md"
rm -f "SECURITY_CHECKLIST.md"
rm -f "SECURITY_HARDENING_GUIDE.md"
rm -f "SERIES_A_INVESTOR_DECK_2026.md"
rm -f "STRIPE_PAYMENT_INTEGRATION.md"
rm -f "STRIPE_QUICK_REFERENCE.md"
rm -f "SUPABASE_CONFIG_READY.md"
rm -f "SUPABASE_INTEGRATION_GUIDE.md"
rm -f "TEAM_ONBOARDING_GUIDE.md"
rm -f "TEST_FIXES_PROGRESS.md"
rm -f "TEST_FIXES_SESSION_SUMMARY.md"
rm -f "VERCEL_DEPLOYMENT_SETUP.md"
rm -f "VERCEL_ENV_SETUP.md"
rm -f "VERCEL_QUICK_REFERENCE.md"
rm -f "VERIFICATION_AUDIT_100_COMPLETE.md"
rm -f "VERIFICATION_CHECKLIST_FINAL.md"
rm -f "VS_CODE_EXTENSIONS_100.md"
rm -f "VS_CODE_EXTENSIONS_100_COMPLETE.md"
rm -f "VS_CODE_EXTENSIONS_COMPLETION_SUMMARY.md"
rm -f "VS_CODE_EXTENSIONS_QUICK_REFERENCE.md"

# =============================================================================
# DELETE: Old cost analysis txt files
# =============================================================================
echo "Removing old cost analysis files..."

rm -f "cost_analysis_20260122_093314.txt"
rm -f "cost_analysis_20260122_101917.txt"

# =============================================================================
# DELETE: Redundant/old scripts (keeping only essential)
# =============================================================================
echo "Removing redundant scripts..."

rm -f "complete-100-production.sh"
rm -f "complete-deployment-100.sh"
rm -f "deploy-2026-pricing.sh"
rm -f "deploy-phase-iv-complete.sh"
rm -f "deploy-production-100.sh"
rm -f "deploy-stripe.sh"
rm -f "deploy-to-world-100.sh"
rm -f "deploy-vercel-fresh.sh"
rm -f "diagnostics.sh"
rm -f "EXECUTE_ALL_NOW.sh"
rm -f "GO_LAUNCH_NOW.sh"
rm -f "MANUAL_STEPS_100.sh"
rm -f "monitoring-setup.sh"
rm -f "post-rebuild-automation.sh"
rm -f "RUN_ALL_RECOMMENDATIONS_100.sh"
rm -f "setup-environment-100.sh"
rm -f "setup-husky.sh"
rm -f "setup.sh"
rm -f "start-dev.sh"
rm -f "start_dev.sh"
rm -f "validate-deployment.sh"
rm -f "verify-100-deployment.sh"

# Keep only:
# - MASTER_LAUNCH_ORCHESTRATOR.sh (newest master script)
# - STAGING_DEPLOYMENT_100.sh (newest staging script)
# - QUICK_REFERENCE.sh (reference commands)

# =============================================================================
# DELETE: Redundant USER_FRIENDLY files (keeping best versions)
# =============================================================================
echo "Removing redundant user-friendly files (keeping essential)..."

rm -f "USER_FRIENDLY_README.md"
rm -f "USER_FRIENDLY_COMPLETE_100.md"
rm -f "USER_FRIENDLY_INDEX.md"

# Keep only:
# - USER_FRIENDLY_DESIGN_SYSTEM.md (design system)
# - USER_FRIENDLY_APP_GUIDE.md (implementation guide)

# =============================================================================
# SUMMARY
# =============================================================================

echo ""
echo "✅ Cleanup complete!"
echo ""

# Count files after
AFTER=$(ls -1 *.md *.sh *.txt 2>/dev/null | wc -l)
DELETED=$((BEFORE - AFTER))

echo "Files before: $BEFORE"
echo "Files after:  $AFTER"
echo "Files deleted: $DELETED"
echo ""
echo "Remaining essential files:"
ls -1 *.md *.sh 2>/dev/null | head -25

echo ""
echo "🎯 Cleanup saved significant repository bloat!"
