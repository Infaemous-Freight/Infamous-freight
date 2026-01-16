/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Central Job State Machine (SLA-grade transitions)
 */

import { PrismaClient, JobStatus, JobEventType, UserRole } from "@prisma/client";
import { JobTransitionError, JOB_TRANSITION_CODES } from "./errors";

const prisma = new PrismaClient();

/**
 * Actor performing the transition (shipper, driver, or system/admin)
 */
export type Actor = {
  userId: string | null; // null for system-initiated transitions (webhooks, cron)
  role: UserRole | "SYSTEM"; // SYSTEM for webhooks, ADMIN for admins, SHIPPER/DRIVER for users
};

/**
 * Complete transition request with optional context
 */
export type TransitionInput = {
  jobId: string;
  to: JobStatus;
  actor: Actor;
  reason?: string; // Audit trail: e.g., "webhook:payment_succeeded", "driver_hold_expired"
  data?: {
    // Additional context for specific transitions
    heldUntil?: Date | null;
    heldByDriverId?: string | null;
    driverId?: string | null;
    deliveredAt?: Date | null;
    cancelReason?: string;
  };
};

/**
 * Canonical state machine: which transitions are allowed
 * Extensible map for future states (no-show, return-to-sender, etc.)
 */
const ALLOWED_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  DRAFT: ["REQUIRES_PAYMENT"],
  REQUIRES_PAYMENT: ["OPEN", "DRAFT"], // can revert to draft before payment
  OPEN: ["HELD", "ACCEPTED", "CANCELED"],
  HELD: ["OPEN", "ACCEPTED", "CANCELED"],
  ACCEPTED: ["PICKED_UP", "CANCELED"],
  PICKED_UP: ["DELIVERED"],
  DELIVERED: ["COMPLETED"],
  COMPLETED: [], // terminal
  CANCELED: [], // terminal
};

/**
 * Map each destination status to its corresponding event type for audit trail
 */
function eventTypeFor(to: JobStatus): JobEventType {
  const eventMap: Record<JobStatus, JobEventType> = {
    DRAFT: "NOTE" as JobEventType, // Should not occur in normal flow
    REQUIRES_PAYMENT: "PAYMENT_INITIATED",
    OPEN: "OPENED",
    HELD: "HELD",
    ACCEPTED: "ACCEPTED",
    PICKED_UP: "PICKED_UP",
    DELIVERED: "DELIVERED",
    COMPLETED: "COMPLETED",
    CANCELED: "CANCELED",
  };
  return eventMap[to];
}

/**
 * Assert that a condition is true; throw 403 if not (permission violation)
 */
function requireActor(
  condition: boolean,
  code: string,
  message: string
): void {
  if (!condition) {
    throw new JobTransitionError(code, message, 403);
  }
}

/**
 * Assert that a condition is true; throw 400 if not (bad request)
 */
function require(condition: boolean, code: string, message: string): void {
  if (!condition) {
    throw new JobTransitionError(code, message, 400);
  }
}

/**
 * Central, atomic job state transition function.
 * All job status changes flow through this to ensure consistency, auditability, and correctness.
 *
 * @throws JobTransitionError if transition is illegal, actor lacks permission, or preconditions fail
 * @returns Updated Job with embedded relations
 */
export async function transitionJob(
  input: TransitionInput
): Promise<{
  jobId: string;
  from: JobStatus;
  to: JobStatus;
  eventType: JobEventType;
}> {
  const { jobId, to, actor, reason = "", data = {} } = input;

  // Execute within a transaction to guarantee atomicity
  const result = await prisma.$transaction(async (tx) => {
    // 1. Fetch job with all relevant relations
    const job = await tx.job.findUnique({
      where: { id: jobId },
      include: {
        payment: true,
        shipper: true,
        driver: true,
        events: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        podAssets: true,
      },
    });

    if (!job) {
      throw new JobTransitionError(
        JOB_TRANSITION_CODES.JOB_NOT_FOUND,
        "Job not found",
        404
      );
    }

    const from = job.status;

    // 2. Validate that this transition is allowed in the state machine
    if (!ALLOWED_TRANSITIONS[from].includes(to)) {
      throw new JobTransitionError(
        JOB_TRANSITION_CODES.ILLEGAL_TRANSITION,
        `Illegal transition: ${from} -> ${to}`,
        400
      );
    }

    // 3. Enforce actor permissions and transition prerequisites
    await enforceActorPermissions(tx, job, to, actor, data);
    await enforceTransitionPrerequisites(tx, job, to, actor, data);

    // 4. Perform the state change and related updates
    const updates = buildStatusUpdatePayload(job, to, actor, data);

    const updatedJob = await tx.job.update({
      where: { id: jobId },
      data: updates,
    });

    // 5. Create audit event (immutable record of what happened)
    const eventType = eventTypeFor(to);
    await tx.jobEvent.create({
      data: {
        jobId,
        eventType,
        actorUserId: actor.userId,
        actorRole: actor.role === "SYSTEM" ? UserRole.ADMIN : actor.role,
        message: reason || `Transitioned from ${from} to ${to}`,
        metadata: JSON.stringify({
          from,
          to,
          timestamp: new Date().toISOString(),
          actor: { userId: actor.userId, role: actor.role },
          data,
        }),
      },
    });

    return {
      jobId,
      from,
      to,
      eventType,
    };
  });

  return result;
}

/**
 * Enforce actor-based permissions for a transition
 */
async function enforceActorPermissions(
  tx: any,
  job: any,
  to: JobStatus,
  actor: Actor,
  data: any
): Promise<void> {
  switch (to) {
    case "REQUIRES_PAYMENT":
      // Only shipper (job creator) or admin can initiate payment
      requireActor(
        actor.role === "ADMIN" ||
          actor.role === "SYSTEM" ||
          (actor.role === UserRole.SHIPPER && actor.userId === job.shipperId),
        JOB_TRANSITION_CODES.NOT_ALLOWED,
        "Only the shipper or admin can require payment"
      );
      break;

    case "OPEN":
      // Only system (webhook after payment) or admin can open a job
      requireActor(
        actor.role === "SYSTEM" || actor.role === "ADMIN",
        JOB_TRANSITION_CODES.NOT_ALLOWED,
        "Only system/admin can open jobs"
      );
      break;

    case "HELD":
      // Only drivers can hold jobs; must be the one holding it
      requireActor(
        actor.role === UserRole.DRIVER,
        JOB_TRANSITION_CODES.NOT_ALLOWED,
        "Only drivers can hold jobs"
      );
      requireActor(
        actor.userId === data?.heldByDriverId,
        JOB_TRANSITION_CODES.HOLD_ACTOR_MISMATCH,
        "Hold must be owned by the requesting driver"
      );
      break;

    case "ACCEPTED":
      // Only drivers can accept; must not already be assigned to another driver
      requireActor(
        actor.role === UserRole.DRIVER,
        JOB_TRANSITION_CODES.NOT_ALLOWED,
        "Only drivers can accept jobs"
      );
      // If coming from HELD, must be the holder
      if (job.status === "HELD") {
        requireActor(
          actor.userId === job.heldByDriverId,
          JOB_TRANSITION_CODES.HOLD_ACTOR_MISMATCH,
          "Only the driver holding this job can accept it"
        );
      }
      break;

    case "PICKED_UP":
      // Only the assigned driver can mark as picked up
      requireActor(
        actor.role === UserRole.DRIVER && actor.userId === job.driverId,
        JOB_TRANSITION_CODES.NOT_ALLOWED,
        "Only the assigned driver can mark job as picked up"
      );
      break;

    case "DELIVERED":
      // Only the assigned driver can deliver
      requireActor(
        actor.role === UserRole.DRIVER && actor.userId === job.driverId,
        JOB_TRANSITION_CODES.NOT_ALLOWED,
        "Only the assigned driver can deliver"
      );
      break;

    case "COMPLETED":
      // Only admin/system can mark complete (after payout)
      requireActor(
        actor.role === "ADMIN" || actor.role === "SYSTEM",
        JOB_TRANSITION_CODES.NOT_ALLOWED,
        "Only admin/system can complete jobs"
      );
      break;

    case "CANCELED":
      // Shipper or admin can cancel (with restrictions based on state)
      requireActor(
        actor.role === "ADMIN" ||
          actor.role === "SYSTEM" ||
          (actor.role === UserRole.SHIPPER && actor.userId === job.shipperId),
        JOB_TRANSITION_CODES.NOT_ALLOWED,
        "Only shipper or admin can cancel jobs"
      );
      break;

    case "DRAFT":
      // Revert to draft only if shipper and not yet confirmed
      requireActor(
        actor.role === "ADMIN" ||
          (actor.role === UserRole.SHIPPER && actor.userId === job.shipperId),
        JOB_TRANSITION_CODES.NOT_ALLOWED,
        "Only shipper or admin can revert to draft"
      );
      break;
  }
}

/**
 * Enforce transition-specific prerequisites (must be satisfied before status change)
 */
async function enforceTransitionPrerequisites(
  tx: any,
  job: any,
  to: JobStatus,
  actor: Actor,
  data: any
): Promise<void> {
  switch (to) {
    case "OPEN":
      // Job must be paid before it can be opened
      require(
        job.payment && job.payment.status === "SUCCEEDED",
        JOB_TRANSITION_CODES.PAYMENT_REQUIRED,
        "Payment must be completed before opening job"
      );
      break;

    case "HELD":
      // Must provide heldUntil timestamp
      require(
        data?.heldUntil instanceof Date,
        JOB_TRANSITION_CODES.MISSING_HELD_UNTIL,
        "Missing or invalid heldUntil timestamp"
      );
      require(
        data.heldByDriverId,
        JOB_TRANSITION_CODES.MISSING_HELD_BY_DRIVER_ID,
        "Missing heldByDriverId"
      );
      // Job must not already have a holder
      require(
        !job.driverId,
        JOB_TRANSITION_CODES.ALREADY_ASSIGNED,
        "Job already assigned to a driver"
      );
      break;

    case "ACCEPTED":
      // Job must not already be assigned to a different driver
      if (job.driverId && job.driverId !== actor.userId) {
        throw new JobTransitionError(
          JOB_TRANSITION_CODES.ALREADY_ASSIGNED,
          "Job already assigned to another driver",
          409
        );
      }
      // Check if hold expired (if coming from HELD)
      if (job.status === "HELD" && job.heldUntil) {
        require(
          new Date() <= job.heldUntil,
          JOB_TRANSITION_CODES.HOLD_EXPIRED,
          "Hold has expired; cannot accept"
        );
      }
      break;

    case "PICKED_UP":
      // Verify job is actually in ACCEPTED state
      require(
        job.status === "ACCEPTED",
        JOB_TRANSITION_CODES.ILLEGAL_TRANSITION,
        "Only accepted jobs can be marked as picked up"
      );
      break;

    case "DELIVERED":
      // Verify job is in PICKED_UP state
      require(
        job.status === "PICKED_UP",
        JOB_TRANSITION_CODES.ILLEGAL_TRANSITION,
        "Only picked-up jobs can be delivered"
      );
      // Verify POD requirements are met
      await enforcePodRequirements(job);
      break;

    case "CANCELED":
      // Cannot cancel if already completed or in final state
      require(
        job.status !== "COMPLETED" && job.status !== "DELIVERED",
        JOB_TRANSITION_CODES.CANCEL_NOT_ALLOWED,
        `Cannot cancel job in ${job.status} state`
      );
      break;
  }
}

/**
 * Verify that all required Proof-of-Delivery (POD) assets are present
 */
async function enforcePodRequirements(job: any): Promise<void> {
  if (
    !job.podRequirePhoto &&
    !job.podRequireSignature &&
    !job.podRequireOtp
  ) {
    // No POD required for this job
    return;
  }

  // Check POD assets
  const photoAsset = job.podAssets?.find((a: any) => a.kind === "PHOTO");
  const signatureAsset = job.podAssets?.find((a: any) => a.kind === "SIGNATURE");

  if (job.podRequirePhoto) {
    require(
      !!photoAsset,
      JOB_TRANSITION_CODES.POD_PHOTO_REQUIRED,
      "Proof-of-delivery photo is required but missing"
    );
  }

  if (job.podRequireSignature) {
    require(
      !!signatureAsset,
      JOB_TRANSITION_CODES.POD_SIGNATURE_REQUIRED,
      "Proof-of-delivery signature is required but missing"
    );
  }

  if (job.podRequireOtp) {
    require(
      !!job.deliveryOtpHash,
      JOB_TRANSITION_CODES.POD_OTP_REQUIRED,
      "Delivery OTP is required but missing or unverified"
    );
  }
}

/**
 * Build Prisma update payload based on transition type
 */
function buildStatusUpdatePayload(
  job: any,
  to: JobStatus,
  actor: Actor,
  data: any
): Record<string, any> {
  const update: Record<string, any> = { status: to };

  switch (to) {
    case "HELD":
      update.heldByDriverId = data.heldByDriverId;
      update.heldUntil = data.heldUntil;
      break;

    case "ACCEPTED":
      // Assign driver and clear hold
      update.driverId = actor.userId;
      update.heldByDriverId = null;
      update.heldUntil = null;
      break;

    case "PICKED_UP":
      // Record pickup timestamp for SLA tracking
      update.pickedUpAt = new Date();
      break;

    case "DELIVERED":
      // Record delivery with timestamp
      update.deliveredAt = data.deliveredAt || new Date();
      break;

    case "CANCELED":
      // Optionally store cancel reason in notes if not already filled
      if (data.cancelReason && !job.notes) {
        update.notes = `CANCELED: ${data.cancelReason}`;
      }
      // Clear any active holds or assignments
      update.heldByDriverId = null;
      update.heldUntil = null;
      // Only clear driverId if shipper initiated cancel; admin/system can clear always
      if (actor.role === UserRole.SHIPPER) {
        update.driverId = null;
      }
      break;
  }

  return update;
}

/**
 * Optional: utility to check if a transition is allowed WITHOUT making it
 * Useful for API endpoints to validate requests before showing options
 */
export function canTransition(from: JobStatus, to: JobStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/**
 * Optional: get all valid next states for a given job status
 */
export function getNextStates(from: JobStatus): JobStatus[] {
  return ALLOWED_TRANSITIONS[from] ?? [];
}
