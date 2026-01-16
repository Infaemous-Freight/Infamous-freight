const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { presignPodUpload } = require("../storage/presign");
const { publicUrlForKey } = require("../storage/s3");
const { authenticate, limiters } = require("../middleware/security");

const prisma = new PrismaClient();
const uploadsRouter = express.Router();

uploadsRouter.use(authenticate);

function validateKind(kind) {
    return kind === "PHOTO" || kind === "SIGNATURE";
}

uploadsRouter.post(
    "/pod/presign",
    limiters.general,
    async (req, res, next) => {
        try {
            const { jobId, kind, mimeType } = req.body || {};
            const userId = req.user?.sub;

            if (!jobId || !kind || !mimeType) {
                return res.status(400).json({ error: "jobId, kind, and mimeType are required" });
            }
            if (!validateKind(kind)) {
                return res.status(400).json({ error: "Invalid kind" });
            }

            const job = await prisma.job.findUnique({ where: { id: jobId } });
            if (!job) return res.status(404).json({ error: "Job not found" });
            if (!job.driverId || job.driverId !== userId) {
                return res.status(403).json({ error: "Not authorized for this job" });
            }
            if (!["ACCEPTED", "PICKED_UP"].includes(job.status)) {
                return res.status(400).json({ error: `Job not in deliverable state (is ${job.status})` });
            }

            const presigned = await presignPodUpload({ jobId, kind, mimeType });
            res.json({ ok: true, ...presigned });
        } catch (err) {
            next(err);
        }
    },
);

uploadsRouter.post(
    "/pod/confirm",
    limiters.general,
    async (req, res, next) => {
        try {
            const { jobId, kind, key, mimeType, sizeBytes } = req.body || {};
            const userId = req.user?.sub;

            if (!jobId || !kind || !key || !mimeType) {
                return res.status(400).json({ error: "jobId, kind, key, and mimeType are required" });
            }
            if (!validateKind(kind)) {
                return res.status(400).json({ error: "Invalid kind" });
            }
            if (!key.startsWith(`pod/${jobId}/`)) {
                return res.status(400).json({ error: "Key does not match job" });
            }

            const job = await prisma.job.findUnique({ where: { id: jobId } });
            if (!job) return res.status(404).json({ error: "Job not found" });
            if (!job.driverId || job.driverId !== userId) {
                return res.status(403).json({ error: "Not authorized for this job" });
            }

            const asset = await prisma.podAsset.upsert({
                where: {
                    jobId_kind_key: {
                        jobId,
                        kind,
                        key,
                    },
                },
                update: {
                    mimeType,
                    sizeBytes: sizeBytes ?? null,
                    url: publicUrlForKey(key),
                },
                create: {
                    jobId,
                    kind,
                    key,
                    mimeType,
                    sizeBytes: sizeBytes ?? null,
                    url: publicUrlForKey(key),
                },
            });

            res.json({ ok: true, asset });
        } catch (err) {
            next(err);
        }
    },
);

module.exports = { uploadsRouter };
