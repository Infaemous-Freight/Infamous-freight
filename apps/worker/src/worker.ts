import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import PDFDocument from "pdfkit";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("REDIS_URL environment variable is required");
}
const connection = new IORedis(redisUrl);
const s3 = new S3Client({});

new Worker(
  "invoiceQueue",
  async (job) => {
    const { invoiceId } = job.data;

    const { rows } = await pool.query("SELECT * FROM invoices WHERE id = $1", [invoiceId]);

    const invoice = rows[0];
    if (!invoice) {
      throw new Error(`Invoice not found: ${invoiceId}`);
    }

    const doc = new PDFDocument();
    const buffers: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      doc.on("data", buffers.push.bind(buffers));

      doc.on("error", (err: Error) => {
        reject(err);
      });

      doc.on("end", async () => {
        const pdf = Buffer.concat(buffers);

        try {
          await s3.send(
            new PutObjectCommand({
              Bucket: process.env.S3_BUCKET!,
              Key: `invoices/${invoiceId}.pdf`,
              Body: pdf,
              ContentType: "application/pdf",
            }),
          );
          resolve();
        } catch (err) {
          reject(err);
        }
      });

      doc.fontSize(18).text(`Invoice #${invoice.id}`);
      doc.moveDown();
      doc.fontSize(12).text(`Amount: $${invoice.amount}`);
      doc.text(`Status: ${invoice.status}`);
      doc.end();
    });
  },
  { connection },
);
