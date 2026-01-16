/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Central Job State Machine (SLA-grade transitions) - CommonJS
 */

const prismaModule = require("@prisma/client");
const { JobTransitionError, JOB_TRANSITION_CODES } = require("./errors");

const PrismaClient = prismaModule?.PrismaClient;
const UserRole = prismaModule?.Prisma?.UserRole ||
  prismaModule?.UserRole || {
    DRIVER: "DRIVER",
    SHIPPER: "SHIPPER",
    ADMIN: "ADMIN",
    SYSTEM: "SYSTEM",
  };

const prisma =
  require("../../config/database").prisma ||
  (PrismaClient ? new PrismaClient() : null);

if (!prisma || !PrismaClient) {
  throw new Error(
    "Prisma client unavailable; ensure @prisma/client is installed and prisma generate has been run.",
  );
}

function requireActor(condition, code, message) {
  if (!condition) throw new JobTransitionError(code, message, 403);
}

function require(condition, code, message) {
  if (!condition) throw new JobTransitionError(code, message, 400);
}

const ALLOWED_TRANSITIONS = {
  DRAFT: ["REQUIRES_PAYMENT"],
  REQUIRES_PAYMENT: ["OPEN", "DRAFT"],
  OPEN: ["HELD", "ACCEPTED", "CANCELED"],
  HELD: ["OPEN", "ACCEPTED", "CANCELED"],
  ACCEPTED: ["PICKED_UP", "CANCELED"],
  PICKED_UP: ["DELIVERED"],
  DELIVERED: ["COMPLETED"],
  COMPLETED: [],
  CANCELED: [],
};

function eventTypeFor(to) {
  const map = {
    DRAFT: "NOTE",
    REQUIRES_PAYMENT: "PAYMENT_INITIATED",
    OPEN: "OPENED",
    HELD: "HELD",
    ACCEPTED: "ACCEPTED",
    PICKED_UP: "PICKED_UP",
    DELIVERED: "DELIVERED",
    COMPLETED: "COMPLETED",
    CANCELED: "CANCELED",
  };
  return map[to] || "NOTE";
}

async function enforceActorPermissions(tx, job, to, actor, data) {
  switch (to) {
    case "REQUIRES_PAYMENT":
      requireActor(
        actor.role === "ADMIN" ||
          actor.role === "SYSTEM" ||
          (actor.role === UserRole.SHIPPER && actor.userId === job.shipperId),
        JOB_TRANSITION_CODES.NOT_ALLOWED,
        "Only the shipper or admin can require payment",
      );
      break;
    case "OPEN":
      requireActor(
        actor.role === "SYSTEM" || actor.role === "ADMIN",
        JOB_TRANSITION_CODES.NOT_ALLOWED,
        "Only system/admin can open jobs",
      );
      break;
    case "HELD":
      requireActor(
        actor.role === UserRole.DRIVER,
        JOB_TRANSITION_CODES.NOT_ALLOWED,
        "Only drivers can hold jobs",
      );
      requireActor(
        actor.userId === data?.heldByDriverId,
        JOB_TRANSITION_CODES.HOLD_ACTOR_MISMATCH,
        "Hold must be owned by the requesting driver",
      );
      break;
    case "ACCEPTED":
      requireActor(
        actor.role === UserRole.DRIVER,
        JOB_TRANSITION_CODES.NOT_ALLOWED,
        "Only drivers can accept jobs",
      );
      if (job.status === "HELD") {
        requireActor(
          actor.userId === job.heldByDriverId,
          JOB_TRANSITION_CODES.HOLD_ACTOR_MISMATCH,
          "Only the driver holding this job can accept it",
        );
      }
      break;
    case "PICKED_UP":
      requireActor(
        actor.role === UserRole.DRIVER && actor.userId === job.driverId,
        JOB_TRANSITION_CODES.NOT_ALLOWED,
        "Only the assigned driver can mark job as picked up",
      );
      break;
    case "DELIVERED":
      requireActor(
        actor.role === UserRole.DRIVER && actor.userId === job.driverId,
        JOB_TRANSITION_CODES.NOT_ALLOWED,
        "Only the assigned driver can deliver",
      );
      break;
    case "COMPLETED":
      requireActor(
        actor.role === "ADMIN" || actor.role === "SYSTEM",
        JOB_TRANSITION_CODES.NOT_ALLOWED,
        "Only admin/system can complete jobs",
      );
      break;
    case "CANCELED":
      requireActor(
        actor.role === "ADMIN" ||
          actor.role === "SYSTEM" ||
          (actor.role === UserRole.SHIPPER && actor.userId === job.shipperId),
        JOB_TRANSITION_CODES.NOT_ALLOWED,
        "Only shipper or admin can cancel jobs",
      );
      break;
    case "DRAFT":
      requireActor(
        actor.role === "ADMIN" ||
          (actor.role === UserRole.SHIPPER && actor.userId === job.shipperId),
        JOB_TRANSITION_CODES.NOT_ALLOWED,
        "Only shipper or admin can revert to draft",
      );
      break;
  }
}

async function enforceTransitionPrerequisites(tx, job, to, actor, data) {
  switch (to) {
    case "OPEN":
      require(job.payment &&
        job.payment.status ===
          "SUCCEEDED", JOB_TRANSITION_CODES.PAYMENT_REQUIRED, "Payment must be completed before opening job");
      break;
    case "HELD":
      require(data?.heldUntil instanceof
        Date, JOB_TRANSITION_CODES.MISSING_HELD_UNTIL, "Missing or invalid heldUntil timestamp");
      require(data.heldByDriverId, JOB_TRANSITION_CODES.MISSING_HELD_BY_DRIVER_ID, "Missing heldByDriverId");
      require(!job.driverId, JOB_TRANSITION_CODES.ALREADY_ASSIGNED, "Job already assigned to a driver");
      break;
    case "ACCEPTED":
      if (job.driverId && job.driverId !== actor.userId) {
        throw new JobTransitionError(
          JOB_TRANSITION_CODES.ALREADY_ASSIGNED,
          "Job already assigned to another driver",
          409,
        );
      }
      if (job.status === "HELD" && job.heldUntil) {
        require(new Date() <=
          job.heldUntil, JOB_TRANSITION_CODES.HOLD_EXPIRED, "Hold has expired; cannot accept");
      }
      break;
    case "PICKED_UP":
      require(job.status ===
        "ACCEPTED", JOB_TRANSITION_CODES.ILLEGAL_TRANSITION, "Only accepted jobs can be marked as picked up");
      break;
    case "DELIVERED":
      require(job.status === "PICKED_UP" ||
        job.status ===
          "ACCEPTED", JOB_TRANSITION_CODES.ILLEGAL_TRANSITION, "Only picked-up/accepted jobs can be delivered");
      await enforcePodRequirements(job);
      break;
    case "CANCELED":
      require(job.status !== "COMPLETED" &&
        job.status !==
          "DELIVERED", JOB_TRANSITION_CODES.CANCEL_NOT_ALLOWED, `Cannot cancel job in ${job.status} state`);
      break;
  }
}

async function enforcePodRequirements(job) {
  const photoAsset = job.podAssets?.find((a) => a.kind === "PHOTO");
  const signatureAsset = job.podAssets?.find((a) => a.kind === "SIGNATURE");

  if (job.podRequirePhoto) {
    require(!!photoAsset, JOB_TRANSITION_CODES.POD_PHOTO_REQUIRED, "Proof-of-delivery photo is required but missing");
  }
  if (job.podRequireSignature) {
    require(!!signatureAsset, JOB_TRANSITION_CODES.POD_SIGNATURE_REQUIRED, "Proof-of-delivery signature is required but missing");
  }
  if (job.podRequireOtp) {
    require(!!job.deliveryOtpHash, JOB_TRANSITION_CODES.POD_OTP_REQUIRED, "Delivery OTP is required but missing or unverified");
  }
}

function buildStatusUpdatePayload(job, to, actor, data) {
  const update = { status: to };
  switch (to) {
    case "HELD":
      update.heldByDriverId = data.heldByDriverId;
      update.heldUntil = data.heldUntil;
      break;
    case "ACCEPTED":
      update.driverId = actor.userId;
      update.heldByDriverId = null;
      update.heldUntil = null;
      break;
    case "PICKED_UP":
      update.pickedUpAt = new Date();
      break;
    case "DELIVERED":
      update.deliveredAt = data.deliveredAt || new Date();
      break;
    case "CANCELED":
      if (data.cancelReason && !job.notes) {
        update.notes = `CANCELED: ${data.cancelReason}`;
      }
      update.heldByDriverId = null;
      update.heldUntil = null;
      if (actor.role === UserRole.SHIPPER) {
        update.driverId = null;
      }
      break;
  }
  return update;
}

async function transitionJob(input) {
  const { jobId, to, actor, reason = "", data = {} } = input;

  const result = await prisma.$transaction(async (tx) => {
    let job = await tx.job.findUnique({
      where: { id: jobId },
      include: {
        payment: true,
        shipper: true,
        driver: true,
        events: { orderBy: { createdAt: "desc" }, take: 1 },
        podAssets: true,
      },
    });

    if (!job)
      throw new JobTransitionError(
        JOB_TRANSITION_CODES.JOB_NOT_FOUND,
        "Job not found",
        404,
      );

    const from = job.status;
    if (!ALLOWED_TRANSITIONS[from] || !ALLOWED_TRANSITIONS[from].includes(to)) {
      throw new JobTransitionError(
        JOB_TRANSITION_CODES.ILLEGAL_TRANSITION,
        `Illegal transition: ${from} -> ${to}`,
        400,
      );
    }

    await enforceActorPermissions(tx, job, to, actor, data);
    await enforceTransitionPrerequisites(tx, job, to, actor, data);

    const now = new Date();
    let updatedJob;

    if (to === "HELD") {
      const updated = await tx.job.updateMany({
        where: {
          id: jobId,
          status: "OPEN",
          driverId: null,
          OR: [{ heldUntil: null }, { heldUntil: { lt: now } }],
        },
        data: buildStatusUpdatePayload(job, to, actor, data),
      });
      if (updated.count === 0) {
        throw new JobTransitionError(
          JOB_TRANSITION_CODES.ALREADY_ASSIGNED,
          "Job already held or taken",
          409,
        );
      }
      updatedJob = await tx.job.findUnique({ where: { id: jobId } });
    } else if (to === "ACCEPTED") {
      const updated = await tx.job.updateMany({
        where: {
          id: jobId,
          driverId: null,
          OR: [
            {
              status: "OPEN",
              OR: [{ heldUntil: null }, { heldUntil: { lt: now } }],
            },
            {
              status: "HELD",
              heldByDriverId: actor.userId,
              heldUntil: { gt: now },
            },
          ],
        },
        data: buildStatusUpdatePayload(job, to, actor, data),
      });
      if (updated.count === 0) {
        throw new JobTransitionError(
          JOB_TRANSITION_CODES.ALREADY_ASSIGNED,
          "Job was just accepted by another driver",
          409,
        );
      }
      updatedJob = await tx.job.findUnique({ where: { id: jobId } });
    } else {
      updatedJob = await tx.job.update({
        where: { id: jobId },
        data: buildStatusUpdatePayload(job, to, actor, data),
      });
    }

    const eventType = eventTypeFor(to);
    await tx.jobEvent.create({
      data: {
        jobId,
        type: eventType,
        actorUserId: actor.userId,
        actorRole: actor.role === "SYSTEM" ? UserRole.ADMIN : actor.role,
        message: reason || `Transitioned from ${from} to ${to}`,
        metadata: JSON.stringify({
          from,
          to,
          timestamp: new Date().toISOString(),
          actor,
          data,
        }),
      },
    });

    return { jobId, from, to, eventType };
  });

  return result;
}

function canTransition(from, to) {
  return (ALLOWED_TRANSITIONS[from] || []).includes(to);
}

function getNextStates(from) {
  return ALLOWED_TRANSITIONS[from] || [];
}

module.exports = { transitionJob, canTransition, getNextStates };
