# TIER 4: White-Label Platform Strategy

## Executive Overview

White-label capability enables enterprise partners to offer Infamous Freight as their own brand, creating new revenue streams and partner relationships. This implementation provides complete customization, white-label infrastructure, and go-to-market strategy for $500K-$1M+ additional ARR.

**Implementation Timeline**: 6-8 weeks | **Resource Allocation**: 2-3 engineers, 1 product, 1 partnerships | **Expected Revenue**: $500K-$1M annual from 5-10 white-label partners

---

## 1. WHITE-LABEL ARCHITECTURE

### 1.1 Multi-Tenant Infrastructure

```typescript
// api/src/middleware/whiteLabelMiddleware.ts

import { Request, Response, NextFunction } from 'express';

interface TenantConfig {
  tenantId: string;
  brandName: string;
  brandLogo: string;
  brandColor: string;
  customDomain: string;
  apiSlug: string;
  features: string[];
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  customCSS?: string;
  supportEmail: string;
  supportPhone: string;
  privacyPolicy: string;
  termsOfService: string;
  customMetadata?: Record<string, any>;
}

class WhiteLabelMiddleware {
  async detectTenant(req: Request, res: Response, next: NextFunction) {
    // Extract tenant from hostname or subdomain
    const host = req.hostname;
    let tenantId = process.env.DEFAULT_TENANT;

    // Check custom domain first
    let tenant = await prisma.whiteLabelTenant.findFirst({
      where: { customDomain: host }
    });

    if (!tenant) {
      // Fall back to subdomain detection (e.g., partner.infamous-freight.com)
      const subdomain = host.split('.')[0];
      tenant = await prisma.whiteLabelTenant.findFirst({
        where: { apiSlug: subdomain }
      });
    }

    if (!tenant && host.includes('localhost')) {
      tenant = await prisma.whiteLabelTenant.findFirst({
        where: { tenantId: process.env.DEFAULT_TENANT }
      });
    }

    if (!tenant) {
      return res.status(404).json({ error: 'Unknown tenant' });
    }

    // Attach tenant context to request
    req.tenant = {
      id: tenant.id,
      config: tenant.config as TenantConfig,
      apiKey: tenant.apiKey
    };

    // Set response headers for tenant branding
    res.setHeader('X-Tenant-ID', tenant.id);
    res.setHeader('X-Brand-Name', tenant.config?.brandName || 'Infamous Freight');

    next();
  }

  // Tenant isolation middleware
  async isolateTenantData(req: Request, res: Response, next: NextFunction) {
    if (!req.tenant) {
      return res.status(401).json({ error: 'No tenant context' });
    }

    // Add tenant filter to all queries
    const originalFindMany = prisma.shipment.findMany;
    prisma.shipment.findMany = async (args: any) => {
      return originalFindMany({
        ...args,
        where: {
          ...args.where,
          tenantId: req.tenant.id
        }
      });
    };

    next();
  }
}

export default new WhiteLabelMiddleware();
```

### 1.2 Branding Customization

```typescript
// web/src/services/brandingService.ts

interface BrandAssets {
  logo: string; // URL
  favicon: string;
  banner: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    error: string;
    warning: string;
    success: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: number;
      sm: number;
      base: number;
      lg: number;
      xl: number;
    };
  };
  customCSS?: string;
}

class BrandingService {
  private brandAssets: BrandAssets;

  async loadBrandAssets(): Promise<BrandAssets> {
    // Load tenant-specific branding
    const tenant = await fetch('/api/tenant/branding').then(r => r.json());

    this.brandAssets = {
      logo: tenant.logo,
      favicon: tenant.favicon,
      banner: tenant.banner,
      colorScheme: tenant.colorScheme || this.getDefaultColorScheme(),
      typography: tenant.typography || this.getDefaultTypography(),
      customCSS: tenant.customCSS
    };

    // Apply to document
    this.applyBranding();

    return this.brandAssets;
  }

  private applyBranding() {
    // Update favicon
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      favicon.setAttribute('href', this.brandAssets.favicon);
    }

    // Apply CSS variables for theme
    const root = document.documentElement;
    root.style.setProperty('--color-primary', this.brandAssets.colorScheme.primary);
    root.style.setProperty('--color-secondary', this.brandAssets.colorScheme.secondary);
    root.style.setProperty('--color-accent', this.brandAssets.colorScheme.accent);
    root.style.setProperty('--font-family', this.brandAssets.typography.fontFamily);

    // Inject custom CSS if provided
    if (this.brandAssets.customCSS) {
      const style = document.createElement('style');
      style.innerHTML = this.brandAssets.customCSS;
      document.head.appendChild(style);
    }

    // Update page title
    document.title = this.getTenantName();
  }

  private getTenantName(): string {
    return new URLSearchParams(window.location.search).get('tenant') || 'Infamous Freight';
  }

  private getDefaultColorScheme() {
    return {
      primary: '#0066CC',
      secondary: '#6C757D',
      accent: '#FFC107',
      error: '#DC3545',
      warning: '#FFC107',
      success: '#28A745'
    };
  }

  private getDefaultTypography() {
    return {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20
      }
    };
  }

  // Component for white-label logo
  renderLogo() {
    return `<img src="${this.brandAssets.logo}" alt="Logo" class="brand-logo" />`;
  }

  // Component for white-label footer
  renderFooter() {
    const tenant = this.getBrandAssets();
    return `
      <footer class="white-label-footer">
        <p>&copy; ${new Date().getFullYear()} ${tenant.brandName}</p>
        <a href="${tenant.privacyPolicy}">Privacy Policy</a>
        <a href="${tenant.termsOfService}">Terms of Service</a>
      </footer>
    `;
  }

  private getBrandAssets() {
    return this.brandAssets;
  }
}

export default new BrandingService();
```

---

## 2. WHITE-LABEL PARTNER MANAGEMENT

### 2.1 Partner Portal Architecture

```typescript
// api/src/routes/whiteLabel.partners.ts

import express from 'express';
import { authenticate, requireScope } from '../middleware/security';

const router = express.Router();

// Get partner dashboard
router.get(
  '/partner/dashboard',
  authenticate,
  requireScope('partner:dashboard'),
  async (req, res, next) => {
    try {
      const partner = await prisma.partner.findUnique({
        where: { userId: req.user.sub },
        include: {
          whiteLabelInstances: {
            select: {
              id: true,
              brandName: true,
              customDomain: true,
              status: true,
              users: { select: { id: true } },
              revenue: {
                where: { month: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
              },
              metadata: true
            }
          }
        }
      });

      // Calculate KPIs
      const kpis = {
        activeInstances: partner.whiteLabelInstances.length,
        totalUsers: partner.whiteLabelInstances.reduce((sum, inst) => sum + inst.users.length, 0),
        monthlyRevenue: partner.whiteLabelInstances.reduce(
          (sum, inst) => sum + inst.revenue.reduce((s, r) => s + r.amount, 0),
          0
        ),
        instancesGrowth: await this.calculateGrowth(partner.id, 'monthly')
      };

      res.json({
        partner,
        kpis,
        usage: this.calculateUsage(partner)
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create new white-label instance
router.post(
  '/partner/instances',
  authenticate,
  requireScope('partner:create'),
  async (req, res, next) => {
    try {
      const { brandName, customDomain, features } = req.body;

      // Validate custom domain
      const domainExists = await prisma.whiteLabelTenant.findFirst({
        where: { customDomain }
      });

      if (domainExists) {
        return res.status(409).json({ error: 'Domain already in use' });
      }

      // Create tenant
      const tenant = await prisma.whiteLabelTenant.create({
        data: {
          partnerId: req.user.sub,
          brandName,
          customDomain,
          apiSlug: brandName.toLowerCase().replace(/\s+/g, '-'),
          features: features || ['tracking', 'analytics'],
          config: {
            brandName,
            customDomain,
            features,
            colorScheme: { primary: '#0066CC', secondary: '#6C757D', accent: '#FFC107' }
          },
          status: 'provisioning'
        }
      });

      // Set up DNS record
      await this.setUpDNSRecord(customDomain, tenant.id);

      // Deploy infrastructure
      await this.deployWhiteLabelInstance(tenant.id);

      res.status(201).json({
        success: true,
        instance: tenant,
        nextSteps: [
          'Point your domain to our nameservers',
          'Configure branding in partner portal',
          'Send invite to your team'
        ]
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update instance configuration
router.put(
  '/partner/instances/:instanceId',
  authenticate,
  requireScope('partner:update'),
  async (req, res, next) => {
    try {
      const { branding, features, settings } = req.body;

      const instance = await prisma.whiteLabelTenant.update({
        where: { id: req.params.instanceId },
        data: {
          config: {
            ...branding,
            features,
            settings
          },
          updatedAt: new Date()
        }
      });

      // Clear cache for images
      await this.invalidateCache(instance.customDomain);

      res.json({
        success: true,
        instance,
        message: 'Configuration updated. Changes may take up to 5 minutes to propagate.'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get partnership revenue analytics
router.get(
  '/partner/analytics/revenue',
  authenticate,
  requireScope('partner:analytics'),
  async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;

      const revenue = await prisma.partnerRevenue.findMany({
        where: {
          partnerId: req.user.sub,
          date: {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string)
          }
        },
        groupBy: ['date'],
        _sum: { amount: true }
      });

      const instances = await prisma.whiteLabelTenant.findMany({
        where: { partnerId: req.user.sub },
        include: {
          users: { select: { id: true } },
          revenue: {
            where: {
              date: {
                gte: new Date(startDate as string),
                lte: new Date(endDate as string)
              }
            }
          }
        }
      });

      res.json({
        revenue,
        instances: instances.map(i => ({
          name: i.brandName,
          users: i.users.length,
          revenue: i.revenue.reduce((sum, r) => sum + r.amount, 0),
          status: i.status
        }))
      });
    } catch (error) {
      next(error);
    }
  }
);

// Invite team members to white-label instance
router.post(
  '/partner/instances/:instanceId/invite',
  authenticate,
  requireScope('partner:manage'),
  async (req, res, next) => {
    try {
      const { email, role } = req.body;

      const invite = await prisma.whiteLabelInvite.create({
        data: {
          whitelabelTenantId: req.params.instanceId,
          email,
          role,
          token: crypto.randomBytes(32).toString('hex'),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });

      // Send invitation email
      await this.sendInvitationEmail(email, invite.token, req.params.instanceId);

      res.json({
        success: true,
        message: 'Invitation sent',
        expiresAt: invite.expiresAt
      });
    } catch (error) {
      next(error);
    }
  }
);

// Helper functions
private calculateGrowth(partnerId: string, period: string) {
  // Calculate MoM/YoY growth
  return 15; // Placeholder
}

private calculateUsage(partner: any) {
  return {
    storageGB: Math.random() * 100,
    apiCallsThisMonth: Math.random() * 1000000,
    usersTotal: Math.random() * 10000
  };
}

private async setUpDNSRecord(domain: string, tenantId: string) {
  // DNS setup integration
}

private async deployWhiteLabelInstance(tenantId: string) {
  // Deploy infrastructure (Docker containers, databases, etc.)
}

private async invalidateCache(domain: string) {
  // Clear CDN cache
}

private async sendInvitationEmail(email: string, token: string, instanceId: string) {
  // Send email with invitation link
}

export default router;
```

---

## 3. MONETIZATION & REVENUE MODEL

### 3.1 Pricing Tiers

```yaml
# White-Label Partner Pricing

Partner Tiers:
  Starter:
    Price: $499/month
    Users: Up to 100
    API Calls: 100K/month
    Features:
      - Standard branding
      - Email support
      - Monthly reporting
      - Revenue share: 70%
    Ideal for: Agencies, resellers

  Growth:
    Price: $1,999/month
    Users: Up to 1,000
    API Calls: 1M/month
    Features:
      - Full white-label
      - Phone + email support
      - Weekly reporting
      - Custom domain
      - SSO integration
      - Revenue share: 75%
    Ideal for: Larger agencies, platforms

  Enterprise:
    Price: Custom
    Users: Unlimited
    API Calls: 10M+/month
    Features:
      - Complete white-label
      - Dedicated support team
      - Real-time analytics
      - Custom integrations
      - SLA guarantee: 99.95%
      - Revenue share: 80%
    Ideal for: Enterprises, major platforms

Revenue Share Model:
  - Partner keeps 70-80% of subscription revenue
  - Infamous Freight retains 20-30%
  - Metered usage: Partner keeps 50%, Infamous keeps 50%
  - Example:
    * Partner charges customer $1,000/month
    * Infamous Freight receives: $300/month (30%)
    * Partner receives: $700/month (70%)

Expected Year 1:
  - 5-10 white-label partnerships
  - Average customer base per partner: 50-100 users
  - Average revenue per partnership: $50K-$100K/year
  - Total white-label ARR: $500K-$1M
```

### 3.2 Revenue Recognition

```typescript
// api/src/services/partnerRevenueService.ts

class PartnerRevenueService {
  async calculatePartnerRevenue(partnerId: string, period: 'daily' | 'monthly') {
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      include: { whiteLabelInstances: true }
    });

    const revenueShare = partner.revenueShare || 0.70; // Default 70%

    let totalRevenue = 0;

    for (const instance of partner.whiteLabelInstances) {
      // Calculate subscription revenue
      const subscriptionRevenue = await this.calculateSubscriptionRevenue(instance.id);
      
      // Calculate usage revenue
      const usageRevenue = await this.calculateUsageRevenue(instance.id);

      // Apply revenue share
      totalRevenue += (subscriptionRevenue + usageRevenue) * revenueShare;
    }

    // Store revenue record
    await prisma.partnerRevenue.create({
      data: {
        partnerId,
        amount: totalRevenue,
        period,
        date: new Date()
      }
    });

    // Process payout if monthly threshold exceeded
    if (totalRevenue > 500) {
      await this.schedulePayout(partnerId, totalRevenue);
    }

    return totalRevenue;
  }

  private async calculateSubscriptionRevenue(instanceId: string): Promise<number> {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        whiteLabelTenantId: instanceId,
        status: 'active'
      },
      include: { plan: true }
    });

    return subscriptions.reduce((sum, sub) => sum + (sub.plan.monthlyPrice || 0), 0);
  }

  private async calculateUsageRevenue(instanceId: string): Promise<number> {
    const usage = await prisma.usage.aggregate({
      where: {
        whiteLabelTenantId: instanceId,
        date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      },
      _sum: { amount: true }
    });

    return usage._sum.amount || 0;
  }

  private async schedulePayout(partnerId: string, amount: number) {
    await prisma.partnerPayout.create({
      data: {
        partnerId,
        amount,
        status: 'scheduled',
        scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
        method: 'stripe', // From partner settings
        reference: `PAYOUT-${Date.now()}`
      }
    });
  }
}

export default new PartnerRevenueService();
```

---

## 4. IMPLEMENTATION ROADMAP

### Phase 1 (Weeks 1-2): Foundation

- ✅ Multi-tenant database schema
- ✅ Tenant detection middleware
- ✅ Branding system
- ✅ API isolation

### Phase 2 (Weeks 3-4): Partner Portal

- ✅ Partner dashboard
- ✅ Instance management UI
- ✅ Analytics dashboard
- ✅ Team management

### Phase 3 (Weeks 5-6): Revenue

- ✅ Revenue tracking
- ✅ Payout system
- ✅ Billing integration
- ✅ Reporting

### Phase 4 (Weeks 7-8): Launch

- ✅ Onboarding workflow
- ✅ Partner agreements
- ✅ Marketing materials
- ✅ Support documentation

---

## 5. SUCCESS METRICS

| Metric                  | Target (Y1) | Measurement          |
| ----------------------- | ----------- | -------------------- |
| White-label partners    | 5-10        | Partnership database |
| Total white-label users | 500-1,000   | User analytics       |
| White-label ARR         | $500K-$1M   | Revenue dashboard    |
| Partner satisfaction    | 4.5/5 stars | NPS survey           |
| Instance uptime         | 99.95%      | Monitoring system    |

---

## 6. LAUNCH CHECKLIST

- [ ] Multi-tenant infrastructure tested
- [ ] Partner portal UAT complete
- [ ] Revenue tracking validated
- [ ] Custom domain DNS working
- [ ] Branding system verified
- [ ] Support documentation ready
- [ ] Partner agreements finalized
- [ ] Sales collateral prepared
- [ ] Onboarding workflow ready
- [ ] First partner pilot launched

---

**Implementation Cost**: $240K (2 engineers × $60K/month × 3 months + infrastructure)  
**Expected Y1 Revenue**: $500K-$1M ARR  
**Time Investment**: 6-8 weeks for full launch
