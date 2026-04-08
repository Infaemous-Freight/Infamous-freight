/**
 * Lead Capture Service (Phase 21.2 & 21.5)
 *
 * Captures leads from landing pages and syncs to CRM systems
 * (HubSpot, Salesforce, Notion, Slack)
 */

import { logAuditEvent, AUDIT_ACTIONS } from "../audit/orgAuditLog.js";
import { prisma } from "../db/prisma.js";

async function parseResponseBody(response: any): Promise<unknown> {
  const rawBody = await response.text();

  if (!rawBody) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.toLowerCase().includes("application/json");

  if (!isJson) {
    return rawBody;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return rawBody;
  }
}

// ============================================
// Lead Capture
// ============================================

export interface CreateLeadInput {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  type: "SHIPPER" | "DRIVER" | "ENTERPRISE" | "OTHER";
  source: string;
  estimatedMonthlyVolume?: number;
  estimatedMonthlyBudget?: number;
  currentProvider?: string;
  painPoints?: string;
  metadata?: Record<string, any>;
}

function normalizeLeadMetadata(
  metadata: Record<string, any> | undefined,
  serverCreatedAtIso: string,
): Record<string, any> {
  const source = metadata && typeof metadata === "object" ? { ...metadata } : {};

  // CreatedAt must be generated server-side to avoid spoofed or malformed
  // client timestamps breaking downstream consumers (e.g. date parsers).
  const clientCreatedAt = source.CreatedAt ?? source.createdAt;
  if (typeof clientCreatedAt === "string" && clientCreatedAt.trim().length > 0) {
    source.clientProvidedCreatedAt = clientCreatedAt;
  }

  delete source.CreatedAt;
  delete source.createdAt;

  return {
    ...source,
    CreatedAt: serverCreatedAtIso,
  };
}

/**
 * Create a new lead and sync to CRM systems
 */
export async function createLead(input: CreateLeadInput): Promise<any> {
  try {
    const serverCreatedAtIso = new Date().toISOString();
    const normalizedMetadata = normalizeLeadMetadata(input.metadata, serverCreatedAtIso);

    // Check if lead already exists
    const existingLead = await prisma.lead.findUnique({
      where: { email: input.email },
    });

    if (existingLead) {
      console.log(`[LeadCapture] Lead already exists: ${input.email}`);
      return existingLead;
    }

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        name: input.name,
        email: input.email,
        company: input.company,
        phone: input.phone,
        type: input.type,
        source: input.source as any,
        estimatedMonthlyVolume: input.estimatedMonthlyVolume,
        estimatedMonthlyBudget: input.estimatedMonthlyBudget,
        currentProvider: input.currentProvider,
        painPoints: input.painPoints,
        metadata:
          Object.keys(normalizedMetadata).length > 0 ? JSON.stringify(normalizedMetadata) : null,
        status: "new",
      },
    });

    console.log(`[LeadCapture] Lead created: ${lead.id} - ${lead.email}`);

    // Sync to CRM systems
    try {
      await syncLeadToCrm(lead);
    } catch (err) {
      console.error(`[LeadCapture] CRM sync failed:`, err);
      // Don't fail lead creation if CRM sync fails
    }

    // Send to Slack
    try {
      await notifySlack({
        type: "lead_created",
        lead,
      });
    } catch (err) {
      console.error(`[LeadCapture] Slack notification failed:`, err);
    }

    return lead;
  } catch (err) {
    console.error(`[LeadCapture] Failed to create lead:`, err);
    throw err;
  }
}

/**
 * Get lead by email
 */
export async function getLead(email: string): Promise<any> {
  return prisma.lead.findUnique({
    where: { email },
    include: {
      demoBooking: true,
    },
  });
}

/**
 * Update lead status
 */
export async function updateLeadStatus(
  leadId: string,
  status: string,
  notes?: string,
): Promise<any> {
  return prisma.lead.update({
    where: { id: leadId },
    data: {
      status,
      notes: notes || undefined,
      updatedAt: new Date(),
    },
  });
}

/**
 * Mark lead as converted (signed up)
 */
export async function convertLead(leadId: string, organizationId: string): Promise<any> {
  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: "won",
      convertedOrgId: organizationId,
      convertedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Notify CRM
  try {
    await syncLeadToCrm(lead);
    await notifySlack({
      type: "lead_converted",
      lead,
      organizationId,
    });
  } catch (err) {
    console.error(`[LeadCapture] Conversion sync failed:`, err);
  }

  return lead;
}

/**
 * Get leads for sales dashboard
 */
export async function getLeads(filters?: {
  type?: string;
  status?: string;
  source?: string;
  limit?: number;
}): Promise<any[]> {
  return prisma.lead.findMany({
    where: {
      type: filters?.type ? ({ equals: filters.type } as any) : undefined,
      status: filters?.status ? { equals: filters.status } : undefined,
      source: filters?.source ? ({ equals: filters.source } as any) : undefined,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: filters?.limit || 50,
  });
}

// ============================================
// CRM Sync
// ============================================

/**
 * Sync lead to external CRM systems (HubSpot, Salesforce, Notion, Slack)
 */
export async function syncLeadToCrm(lead: any): Promise<void> {
  const providers = [
    "hubspot",
    "salesforce",
    "notion",
    // slack is handled separately in notifySlack
  ];

  for (const provider of providers) {
    if (!process.env[`${provider.toUpperCase()}_API_KEY`]) {
      console.log(`[CrmSync] ${provider} not configured, skipping...`);
      continue;
    }

    try {
      switch (provider) {
        case "hubspot":
          await syncToHubSpot(lead);
          break;
        case "salesforce":
          await syncToSalesforce(lead);
          break;
        case "notion":
          await syncToNotion(lead);
          break;
      }

      // Record successful sync
      await prisma.crmSync.upsert({
        where: {
          // Using composite key workaround
          id: `${lead.id}_${provider}`,
        },
        create: {
          entityType: "lead",
          entityId: lead.id,
          provider,
          syncedId: lead.id,
          syncedAt: new Date(),
          status: "synced",
        },
        update: {
          syncedAt: new Date(),
          status: "synced",
          lastError: null,
        },
      });
    } catch (err) {
      console.error(`[CrmSync] Failed to sync to ${provider}:`, err);

      await prisma.crmSync.upsert({
        where: {
          id: `${lead.id}_${provider}`,
        },
        create: {
          entityType: "lead",
          entityId: lead.id,
          provider,
          syncedId: lead.id,
          syncedAt: new Date(),
          status: "failed",
          lastError: err instanceof Error ? err.message : String(err),
        },
        update: {
          status: "failed",
          lastError: err instanceof Error ? err.message : String(err),
          syncedAt: new Date(),
        },
      });
    }
  }
}

/**
 * Sync lead to HubSpot
 */
async function syncToHubSpot(lead: any): Promise<void> {
  const apiKey = process.env.HUBSPOT_API_KEY;
  if (!apiKey) throw new Error("HubSpot API key not configured");

  const contactData = {
    properties: [
      { property: "firstname", value: lead.name.split(" ")[0] },
      { property: "lastname", value: lead.name.split(" ")[1] || "" },
      { property: "email", value: lead.email },
      { property: "phone", value: lead.phone || "" },
      { property: "company", value: lead.company || "" },
      { property: "lifecyclestage", value: "subscriber" },
      {
        property: "hs_lead_status",
        value: lead.status || "new",
      },
    ],
  };

  const response = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(contactData),
  });

  if (!response.ok) {
    throw new Error(`HubSpot API error: ${response.statusText}`);
  }

  console.log(`[CrmSync] Lead synced to HubSpot: ${lead.email}`);
}

/**
 * Sync lead to Salesforce
 */
async function syncToSalesforce(lead: any): Promise<void> {
  const clientId = process.env.SALESFORCE_CLIENT_ID;
  const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
  const username = process.env.SALESFORCE_USERNAME;
  const password = process.env.SALESFORCE_PASSWORD;
  const instanceUrl = process.env.SALESFORCE_INSTANCE_URL;

  if (!clientId || !clientSecret || !username || !password || !instanceUrl) {
    throw new Error("Salesforce credentials not configured");
  }

  // Get OAuth token
  const tokenResponse = await fetch(`${instanceUrl}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "password",
      client_id: clientId,
      client_secret: clientSecret,
      username,
      password,
    }).toString(),
  });

  const tokenBody = await parseResponseBody(tokenResponse);

  if (!tokenResponse.ok) {
    const details = typeof tokenBody === "string" ? tokenBody : JSON.stringify(tokenBody);
    throw new Error(
      `Salesforce token request failed (${tokenResponse.status} ${tokenResponse.statusText}): ${details || "No response body"}`,
    );
  }

  const rawAccessToken =
    tokenBody && typeof tokenBody === "object" && "access_token" in tokenBody
      ? (tokenBody as { access_token?: unknown }).access_token
      : undefined;

  if (typeof rawAccessToken !== "string" || rawAccessToken.trim().length === 0) {
    const bodyShape =
      tokenBody && typeof tokenBody === "object"
        ? { keys: Object.keys(tokenBody as Record<string, unknown>).slice(0, 10) }
        : tokenBody;

    throw new Error(
      `Salesforce token response did not include a valid non-empty string access_token (received type=${typeof rawAccessToken}). Body snippet: ${JSON.stringify(
        bodyShape,
      )}`,
    );
  }

  const accessToken = rawAccessToken.trim();
  // Create Lead record
  const leadData = {
    FirstName: lead.name.split(" ")[0],
    LastName: lead.name.split(" ")[1] || "",
    Email: lead.email,
    Phone: lead.phone || "",
    Company: lead.company || "Unknown",
    LeadSource: lead.source || "Web",
  };

  const response = await fetch(`${instanceUrl}/services/data/v57.0/sobjects/Lead`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(leadData),
  });

  if (!response.ok) {
    const responseBody = await parseResponseBody(response);
    const details = typeof responseBody === "string" ? responseBody : JSON.stringify(responseBody);

    throw new Error(
      `Salesforce API error (${response.status} ${response.statusText}): ${details || "No response body"}`,
    );
  }

  console.log(`[CrmSync] Lead synced to Salesforce: ${lead.email}`);
}

/**
 * Sync lead to Notion
 */
async function syncToNotion(lead: any): Promise<void> {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_LEADS_DATABASE_ID;

  if (!apiKey || !databaseId) {
    throw new Error("Notion API key or database ID not configured");
  }

  const pageData = {
    parent: { database_id: databaseId },
    properties: {
      Name: {
        title: [{ text: { content: lead.name } }],
      },
      Email: {
        email: lead.email,
      },
      Phone: {
        phone_number: lead.phone || "",
      },
      Company: {
        rich_text: [{ text: { content: lead.company || "N/A" } }],
      },
      Type: {
        select: { name: lead.type },
      },
      Status: {
        select: { name: lead.status || "New" },
      },
      Source: {
        select: { name: lead.source || "Unknown" },
      },
    },
  };

  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify(pageData),
  });

  if (!response.ok) {
    throw new Error(`Notion API error: ${response.statusText}`);
  }

  console.log(`[CrmSync] Lead synced to Notion: ${lead.email}`);
}

// ============================================
// Slack Notifications
// ============================================

interface SlackEvent {
  type: "lead_created" | "lead_converted" | "demo_scheduled";
  lead: any;
  organizationId?: string;
  demoDate?: Date;
}

async function notifySlack(event: SlackEvent): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  let text = "";
  let blocks: any[] = [];

  switch (event.type) {
    case "lead_created":
      text = `🆕 New Lead: ${event.lead.name}`;
      blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text:
              `*New Lead Captured*\n` +
              `Name: ${event.lead.name}\n` +
              `Email: ${event.lead.email}\n` +
              `Type: ${event.lead.type}\n` +
              `Source: ${event.lead.source}\n` +
              `Company: ${event.lead.company || "N/A"}\n` +
              `Phone: ${event.lead.phone || "N/A"}`,
          },
        },
      ];
      break;

    case "lead_converted":
      text = `🎉 Lead Converted: ${event.lead.name}`;
      blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text:
              `*Lead Converted to Customer*\n` +
              `Name: ${event.lead.name}\n` +
              `Email: ${event.lead.email}\n` +
              `Organization ID: ${event.organizationId}\n` +
              `Type: ${event.lead.type}`,
          },
        },
      ];
      break;

    case "demo_scheduled":
      text = `📅 Demo Scheduled: ${event.lead.name}`;
      blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text:
              `*Demo Scheduled*\n` +
              `Lead: ${event.lead.name}\n` +
              `Email: ${event.lead.email}\n` +
              `Scheduled For: ${event.demoDate?.toLocaleString() || "N/A"}`,
          },
        },
      ];
      break;
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, blocks }),
    });
  } catch (err) {
    console.error(`[LeadCapture] Slack notification failed:`, err);
  }
}

export default {
  createLead,
  getLead,
  updateLeadStatus,
  convertLead,
  getLeads,
  syncLeadToCrm,
};
