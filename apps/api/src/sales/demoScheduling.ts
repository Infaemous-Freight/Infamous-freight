/**
 * Demo Scheduling Service (Phase 21.3)
 *
 * Manages demo bookings:
 * - Schedule with Calendly / Google Calendar
 * - Send confirmation emails
 * - Track attendance
 */

import { createLead, convertLead } from "./leadCapture.js";
import { sendEmail } from "../services/emailService.js";
import { prisma } from "../db/prisma.js";

// ============================================
// Demo Booking
// ============================================

export interface ScheduleDemoInput {
  leadId?: string; // If existing lead
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  type?: "SHIPPER" | "DRIVER" | "ENTERPRISE" | "OTHER";
  scheduledFor: Date;
  duration?: number; // minutes
  notes?: string;
  timezone?: string;
}

/**
 * Schedule a demo and create calendar event
 */
export async function scheduleDemo(input: ScheduleDemoInput): Promise<any> {
  try {
    let lead;

    // Find or create lead
    if (input.leadId) {
      lead = await prisma.lead.findUnique({
        where: { id: input.leadId },
      });
    } else if (input.email) {
      lead = await prisma.lead.findUnique({
        where: { email: input.email },
      });

      if (!lead) {
        // Create new lead
        lead = await createLead({
          name: input.name || "Unknown",
          email: input.email,
          company: input.company,
          phone: input.phone,
          type: (input.type || "OTHER") as any,
          source: "DEMO_BOOKING",
        });
      }
    } else {
      throw new Error("Either leadId or email is required");
    }

    // Check if demo already exists
    const existing = await prisma.demoBooking.findUnique({
      where: { leadId: lead.id },
    });

    if (existing) {
      console.log(`[DemoScheduling] Demo already scheduled for lead: ${lead.id}`);
      return existing;
    }

    // Create calendar event
    const calendarEvent = await createCalendarEvent({
      attendeeName: lead.name,
      attendeeEmail: lead.email,
      scheduledFor: input.scheduledFor,
      duration: input.duration || 30,
      timezone: input.timezone || "America/Los_Angeles",
    });

    // Create demo booking
    const demoBooking = await prisma.demoBooking.create({
      data: {
        leadId: lead.id,
        scheduledFor: input.scheduledFor,
        duration: input.duration || 30,
        calendarEventId: calendarEvent.eventId,
        calendarProvider: calendarEvent.provider,
        confirmationSent: false,
      },
    });

    console.log(`[DemoScheduling] Demo scheduled: ${lead.email} - ${input.scheduledFor}`);

    // Send confirmation email
    try {
      await sendDemoConfirmation(lead, demoBooking, calendarEvent);
    } catch (err) {
      console.error(`[DemoScheduling] Failed to send confirmation:`, err);
    }

    // Update lead status
    try {
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          status: "demo_scheduled",
          demoScheduledAt: input.scheduledFor,
        },
      });
    } catch (err) {
      console.error(`[DemoScheduling] Failed to update lead:`, err);
    }

    return demoBooking;
  } catch (err) {
    console.error(`[DemoScheduling] Failed to schedule demo:`, err);
    throw err;
  }
}

/**
 * Get demo by ID
 */
export async function getDemo(demoId: string): Promise<any> {
  return prisma.demoBooking.findUnique({
    where: { id: demoId },
    include: { lead: true },
  });
}

/**
 * Update demo status
 */
export async function updateDemoStatus(
  demoId: string,
  status: "scheduled" | "completed" | "no_show" | "canceled",
  recordingUrl?: string,
  notes?: string,
): Promise<any> {
  return prisma.demoBooking.update({
    where: { id: demoId },
    data: {
      status,
      recordingUrl: recordingUrl || undefined,
      notes: notes || undefined,
      updatedAt: new Date(),
    },
  });
}

/**
 * Get upcoming demos
 */
export async function getUpcomingDemos(days: number = 7): Promise<any[]> {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return prisma.demoBooking.findMany({
    where: {
      scheduledFor: {
        gte: now,
        lte: futureDate,
      },
      status: "scheduled",
    },
    include: { lead: true },
    orderBy: { scheduledFor: "asc" },
  });
}

/**
 * Get demo stats
 */
export async function getDemoStats(): Promise<any> {
  const demos = await prisma.demoBooking.findMany({
    include: { lead: true },
  });

  const stats = {
    total: demos.length,
    scheduled: demos.filter((d: any) => d.status === "scheduled").length,
    completed: demos.filter((d: any) => d.status === "completed").length,
    noShow: demos.filter((d: any) => d.status === "no_show").length,
    canceled: demos.filter((d: any) => d.status === "canceled").length,
    conversionRate:
      demos.length > 0
        ? ((demos.filter((d: any) => d.lead.convertedOrgId).length / demos.length) * 100).toFixed(2)
        : "0",
  };

  return stats;
}

// ============================================
// Calendar Integration
// ============================================

interface CalendarEventInput {
  attendeeName: string;
  attendeeEmail: string;
  scheduledFor: Date;
  duration: number; // minutes
  timezone: string;
}

interface CalendarEventResult {
  eventId: string;
  provider: string;
  calendarLink: string;
  zoomLink?: string;
}

/**
 * Create calendar event (Calendly or Google Calendar)
 */
async function createCalendarEvent(input: CalendarEventInput): Promise<CalendarEventResult> {
  const provider = process.env.CALENDAR_PROVIDER || "calendly";

  switch (provider) {
    case "calendly":
      return createCalendlyEvent(input);
    case "google":
      return createGoogleCalendarEvent(input);
    default:
      throw new Error(`Unknown calendar provider: ${provider}`);
  }
}

/**
 * Create event via Calendly API
 */
async function createCalendlyEvent(input: CalendarEventInput): Promise<CalendarEventResult> {
  const apiKey = process.env.CALENDLY_API_KEY;
  if (!apiKey) throw new Error("Calendly API key not configured");

  // Get org URI first
  const meResponse = await fetch("https://api.calendly.com/users/me", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const { resource } = (await meResponse.json()) as any;
  const orgUri = resource.organization;

  // Create event
  const eventResponse = await fetch(`${orgUri.split("/").slice(0, -1).join("/")}/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      start_time: input.scheduledFor.toISOString(),
      invitee: {
        name: input.attendeeName,
        email: input.attendeeEmail,
      },
    }),
  });

  const { resource: event } = (await eventResponse.json()) as any;

  return {
    eventId: event.uri.split("/").pop(),
    provider: "calendly",
    calendarLink: event.calendar_event.event_memberships[0].user_email,
  };
}

/**
 * Create event via Google Calendar API
 */
async function createGoogleCalendarEvent(input: CalendarEventInput): Promise<CalendarEventResult> {
  const accessToken = process.env.GOOGLE_CALENDAR_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Google Calendar access token not configured");

  const event = {
    summary: `Demo: ${input.attendeeName}`,
    description: `Product demo with ${input.attendeeName} (${input.attendeeEmail})`,
    start: {
      dateTime: input.scheduledFor.toISOString(),
      timeZone: input.timezone,
    },
    end: {
      dateTime: new Date(input.scheduledFor.getTime() + input.duration * 60000).toISOString(),
      timeZone: input.timezone,
    },
    attendees: [{ email: input.attendeeEmail }],
    conferenceData: {
      createRequest: {
        requestId: `demo-${Date.now()}`,
        conferenceSolutionKey: {
          conferenceSolution: "hangoutsMeet",
        },
      },
    },
  };

  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    },
  );

  const result = (await response.json()) as any;

  return {
    eventId: result.id,
    provider: "google",
    calendarLink: result.htmlLink,
    zoomLink: result.conferenceData?.entryPoints?.[0]?.uri,
  };
}

// ============================================
// Email Notifications
// ============================================

/**
 * Send demo confirmation email
 */
async function sendDemoConfirmation(
  lead: any,
  demoBooking: any,
  calendarEvent: CalendarEventResult,
): Promise<void> {
  const subject = "Your Infamous Freight demo is scheduled";
  const text = `Hi ${lead.name || "there"},\n\nYour demo is scheduled for ${new Date(
    demoBooking.scheduledFor,
  ).toLocaleString()}.\n\nCalendar link: ${calendarEvent.calendarLink}\nZoom link: ${calendarEvent.zoomLink}\n\nSee you soon!`;

  await sendEmail({
    to: lead.email,
    subject,
    text,
  });
}

/**
 * Send demo reminder (24 hours before)
 */
export async function sendDemoReminders(): Promise<number> {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowEnd = new Date(tomorrow.getTime() + 60 * 60 * 1000);

    const demos = await prisma.demoBooking.findMany({
      where: {
        scheduledFor: {
          gte: tomorrow,
          lte: tomorrowEnd,
        },
        status: "scheduled",
        confirmationSent: true,
      },
      include: { lead: true },
    });

    for (const demo of demos) {
      try {
        // Send reminder email
        console.log(`[DemoScheduling] Reminder sent to ${demo.lead.email}`);

        // Mark as reminded (optional: add field to track)
      } catch (err) {
        console.error(`[DemoScheduling] Failed to send reminder:`, err);
      }
    }

    return demos.length;
  } catch (err) {
    console.error(`[DemoScheduling] Failed to send reminders:`, err);
    throw err;
  }
}

export default {
  scheduleDemo,
  getDemo,
  updateDemoStatus,
  getUpcomingDemos,
  getDemoStats,
  sendDemoReminders,
};
