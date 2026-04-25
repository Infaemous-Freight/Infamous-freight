# Repository-Accurate Platform Status

This document separates repository-backed facts from claims that require external proof.

## Use This Standard

Only make public claims that can be supported by one of the following:

- Source code in this repository.
- Passing CI output.
- Production monitoring evidence.
- Vendor dashboards or signed reports.
- Security/compliance audit artifacts.

If a claim cannot be traced to evidence, do not use it in customer, investor, sales, or compliance material.

## Repository-Backed Capabilities

The repository contains application code and deployment support for the Infamous Freight platform. Claims in this section still require maintainers to link exact files, commits, or CI runs before being reused externally.

### API

Supported wording:

> The API includes health endpoints and tenant-aware request handling in the application code.

Do not expand this into compliance, uptime, or production-security claims without separate evidence.

### Security Headers

Supported wording after this change is merged and tested:

> The Express API is configured with baseline HTTP security headers using Helmet.

This is not the same as being SOC 2 compliant, PCI DSS compliant, HIPAA compliant, penetration-tested, or production-hardened.

### CORS

Supported wording after this change is merged and tested:

> The API supports configurable CORS origins through environment configuration.

Production deployments should set `CORS_ORIGINS` explicitly.

### Testing

Supported wording:

> The API package includes Jest test execution and a coverage-generation script.

Do not publish a coverage percentage unless it comes from a current CI artifact.

### Deployment

Supported wording:

> The repository includes deployment and validation scripts.

Do not claim multi-region deployment, Kubernetes/Istio operation, automated rollback, or a 99.9% uptime SLA unless those are proven by infrastructure and monitoring evidence.

## Claims Not Supported Without External Proof

Do not use these claims unless supported by current evidence:

- SOC 2 compliant
- PCI DSS compliant
- HIPAA compliant
- 99.9% uptime SLA
- Multi-region high availability
- Kubernetes or Istio production deployment
- Enterprise-grade security
- Bank-grade security
- Penetration-tested
- Zero-downtime deployment
- Guaranteed data isolation
- Specific test coverage percentage
- Real-time carrier network integrations
- Stripe production readiness
- AI automation in production

## Safer Public Wording

Use:

> Infamous Freight is building a freight dispatch platform with tenant-aware API behavior, deployment scripts, health checks, and baseline API security headers. Compliance, uptime, and production infrastructure claims should be validated against current operational evidence before external use.

Avoid:

> Infamous Freight is SOC 2 ready, PCI compliant, multi-region, enterprise-grade, and guaranteed 99.9% available.

## Evidence Checklist Before Public Claims

Before publishing a claim, attach evidence for:

- Relevant source files and line references.
- Passing CI run.
- Deployment target and environment.
- Monitoring/uptime evidence.
- Security scan or audit report, if security language is used.
- Compliance report, if compliance language is used.
- Current coverage artifact, if test coverage is mentioned.

## Maintainer Notes

- Keep this document conservative.
- Prefer under-claiming over unsupported marketing language.
- Update this document when CI, deployment, monitoring, or compliance evidence changes.
