import AWS from "aws-sdk";
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

        const s3 = new AWS.S3();
        try {
          await s3
            .putObject({
              Bucket: process.env.S3_BUCKET!,
              Key: `invoices/${invoiceId}.pdf`,
              Body: pdf,
              ContentType: "application/pdf",
            })
            .promise();
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
