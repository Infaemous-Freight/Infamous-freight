/**
 * Invoice Generation Service (Phase 20.5)
 *
 * Generates and sends monthly invoices via Stripe
 * Runs as a scheduled BullMQ job (1st of month)
 */

import Stripe from "stripe";
import { getPrisma } from "../db/prisma.js";

let stripeClient: Stripe | null = null;

function getStripeClient(): Stripe {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(stripeKey);
  }

  return stripeClient;
}

function prismaOrThrow() {
  const prisma = getPrisma();
  if (!prisma) {
    throw new Error("Database is not configured");
  }
  return prisma;
}

/**
 * Get previous month in YYYY-MM format
 */
function getPreviousMonth(): string {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Format cents to dollars with 2 decimal places
 */
function formatCurrency(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Generate invoice for a single organization
 */
export async function generateOrgInvoice(
  organizationId: string,
  month?: string,
): Promise<{
  invoiceId: string;
  stripeInvoiceId?: string;
  amount: number;
  status: string;
  pdfUrl?: string;
}> {
  try {
    const invoiceMonth = month || getPreviousMonth();

    // Get usage for the month
    const usage = await prismaOrThrow().orgUsage.findUnique({
      where: { organizationId_month: { organizationId, month: invoiceMonth } },
      include: {
        organization: {
          select: {
            name: true,
            billing: {
              select: {
                stripeCustomerId: true,
                monthlyBase: true,
              },
            },
          },
        },
      },
    });

    if (!usage) {
      throw new Error(`No usage found for organization ${organizationId} in month ${invoiceMonth}`);
    }

    const billing = usage.organization.billing;
    if (!billing?.stripeCustomerId) {
      throw new Error(`No Stripe customer found for organization ${organizationId}`);
    }

    // Calculate invoice amounts (in cents for Stripe)
    const baseFee = Math.round(billing.monthlyBase * 100);
    const overageCharge = Math.round(usage.overageCharge * 100);
    const totalAmount = baseFee + overageCharge;

    // Create invoice items in Stripe
    if (baseFee > 0) {
      await getStripeClient().invoiceItems.create({
        customer: billing.stripeCustomerId,
        amount: baseFee,
        currency: "usd",
        description: `Platform Fee - ${invoiceMonth}`,
        metadata: {
          organizationId,
          month: invoiceMonth,
          type: "base_fee",
        },
      });
    }

    if (overageCharge > 0) {
      await getStripeClient().invoiceItems.create({
        customer: billing.stripeCustomerId,
        amount: overageCharge,
        currency: "usd",
        description: `Overage: ${usage.overageJobs} jobs @ $${usage.organization.billing?.monthlyBase ? "$1.50" : "$0"}/job - ${invoiceMonth}`,
        metadata: {
          organizationId,
          month: invoiceMonth,
          type: "overage",
          overageJobs: usage.overageJobs.toString(),
        },
      });
    }

    // Create invoice
    const invoice = await getStripeClient().invoices.create({
      customer: billing.stripeCustomerId,
      collection_method: "send_invoice",
      days_until_due: 30,
      description: `Infæmous Freight - ${invoiceMonth}`,
      metadata: {
        organizationId,
        month: invoiceMonth,
      },
    });

    // Finalize invoice
    const finalizedInvoice = await getStripeClient().invoices.finalizeInvoice(invoice.id);

    // Save to database
    const dbInvoice = await prismaOrThrow().orgInvoice.upsert({
      where: { organizationId_month: { organizationId, month: invoiceMonth } },
      create: {
        organizationId,
        month: invoiceMonth,
        stripeInvoiceId: finalizedInvoice.id,
        stripeStatus: finalizedInvoice.status,
        baseFee: billing.monthlyBase,
        overageCharge: usage.overageCharge,
        totalAmount: totalAmount / 100,
        pdfUrl: finalizedInvoice.invoice_pdf ?? undefined,
      },
      update: {
        stripeInvoiceId: finalizedInvoice.id,
        stripeStatus: finalizedInvoice.status,
        baseFee: billing.monthlyBase,
        overageCharge: usage.overageCharge,
        totalAmount: totalAmount / 100,
        pdfUrl: finalizedInvoice.invoice_pdf ?? undefined,
      },
    });

    // Send invoice
    if (process.env.SEND_INVOICES === "true") {
      await getStripeClient().invoices.sendInvoice(finalizedInvoice.id);
    }

    console.log("Generated invoice", {
      organizationId,
      month: invoiceMonth,
      invoiceId: dbInvoice.id,
      stripeInvoiceId: finalizedInvoice.id,
      amount: formatCurrency(totalAmount),
    });

    return {
      invoiceId: dbInvoice.id,
      stripeInvoiceId: finalizedInvoice.id,
      amount: totalAmount / 100,
      status: finalizedInvoice.status || "draft",
      pdfUrl: finalizedInvoice.invoice_pdf ?? undefined,
    };
  } catch (error) {
    console.error("Failed to generate invoice", {
      organizationId,
      month,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Generate invoices for all organizations (monthly batch job)
 * Called on the 1st of each month by BullMQ
 */
export async function generateMonthlyInvoices(): Promise<{
  processedCount: number;
  successCount: number;
  failureCount: number;
  totalRevenue: number;
}> {
  console.log("Starting monthly invoice generation...");

  const month = getPreviousMonth();
  const stats = {
    processedCount: 0,
    successCount: 0,
    failureCount: 0,
    totalRevenue: 0,
  };

  try {
    // Get all orgs with active billing
    const orgs = await prismaOrThrow().orgBilling.findMany({
      where: {
        stripeStatus: "active",
      },
      select: {
        organizationId: true,
        monthlyBase: true,
      },
    });

    console.log(`Processing ${orgs.length} organizations...`);

    for (const org of orgs) {
      stats.processedCount++;

      try {
        const result = await generateOrgInvoice(org.organizationId, month);
        stats.successCount++;
        stats.totalRevenue += result.amount;

        console.log(`✓ Invoice generated for org ${org.organizationId}`);
      } catch (err) {
        stats.failureCount++;
        console.error(
          `✗ Failed to generate invoice for org ${org.organizationId}:`,
          (err as Error).message,
        );
      }
    }

    console.log("Monthly invoice generation complete", stats);
    return stats;
  } catch (error) {
    console.error("Monthly invoice generation failed", {
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Get invoice details
 */
export async function getInvoice(organizationId: string, month: string) {
  try {
    const invoice = await (prismaOrThrow().orgInvoice as any).findUnique({
      where: { organizationId_month: { organizationId, month } },
      include: {
        organization: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    if (invoice?.stripeInvoiceId) {
      const stripeInvoice = await getStripeClient().invoices.retrieve(invoice.stripeInvoiceId);
      return {
        ...invoice,
        stripeStatus: stripeInvoice.status,
        hostedInvoiceUrl: stripeInvoice.hosted_invoice_url,
        pdfUrl: stripeInvoice.invoice_pdf,
      };
    }

    return invoice;
  } catch (error) {
    console.error("Failed to get invoice", {
      organizationId,
      month,
      error: (error as Error).message,
    });
    return null;
  }
}

/**
 * Mark invoice as paid
 */
export async function markInvoicePaid(organizationId: string, month: string): Promise<void> {
  try {
    await prismaOrThrow().orgInvoice.update({
      where: { organizationId_month: { organizationId, month } },
      data: {
        paidAt: new Date(),
        stripeStatus: "paid",
      },
    });

    console.log(`Marked invoice as paid for org ${organizationId} (${month})`);
  } catch (error) {
    console.error("Failed to mark invoice as paid", {
      organizationId,
      month,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Send invoice reminder (manual trigger)
 */
export async function sendInvoiceReminder(organizationId: string, month: string): Promise<void> {
  try {
    const invoice = await prismaOrThrow().orgInvoice.findUnique({
      where: { organizationId_month: { organizationId, month } },
    });

    if (!invoice?.stripeInvoiceId) {
      throw new Error(`No Stripe invoice found for ${organizationId} (${month})`);
    }

    await getStripeClient().invoices.sendInvoice(invoice.stripeInvoiceId);

    console.log(`Sent invoice reminder for org ${organizationId} (${month})`);
  } catch (error) {
    console.error("Failed to send invoice reminder", {
      organizationId,
      month,
      error: (error as Error).message,
    });
    throw error;
  }
}

export default {
  generateOrgInvoice,
  generateMonthlyInvoices,
  getInvoice,
  markInvoicePaid,
  sendInvoiceReminder,
};
