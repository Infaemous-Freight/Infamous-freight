# AWS Lambda Serverless Functions Configuration

# Move compute-intensive tasks to serverless for cost optimization

## Lambda Functions

### 1. Batch AI Processing

```yaml
# serverless.yml
service: infamous-freight-lambda

provider:
  name: aws
  runtime: nodejs24.x
  region: us-east-1
  environment:
    DATABASE_URL: ${env:DATABASE_URL}
    OPENAI_API_KEY: ${env:OPENAI_API_KEY}
    REDIS_URL: ${env:REDIS_URL}

functions:
  # Batch AI processing (runs every hour)
  batchAI:
    handler: src/functions/batch-ai.handler
    timeout: 900 # 15 minutes
    memorySize: 2048 # 2 GB
    events:
      - schedule: rate(1 hour)
    environment:
      AI_BATCH_SIZE: 100

  # Image optimization (S3 trigger)
  imageOptimizer:
    handler: src/functions/image-optimizer.handler
    timeout: 300
    memorySize: 1024
    events:
      - s3:
          bucket: infamous-freight-uploads
          event: s3:ObjectCreated:*
          rules:
            - suffix: .jpg
            - suffix: .png

  # Report generation (daily)
  reportGenerator:
    handler: src/functions/report-generator.handler
    timeout: 600
    memorySize: 1024
    events:
      - schedule: cron(0 2 * * ? *) # 2 AM daily

  # Data export (on-demand)
  dataExporter:
    handler: src/functions/data-exporter.handler
    timeout: 900
    memorySize: 2048
    events:
      - http:
          path: /export
          method: post
          authorizer: aws_iam

  # Email batch sender
  emailBatch:
    handler: src/functions/email-batch.handler
    timeout: 300
    memorySize: 512
    events:
      - sqs:
          arn: arn:aws:sqs:us-east-1:123456789:email-queue

  # Backup database
  databaseBackup:
    handler: src/functions/database-backup.handler
    timeout: 900
    memorySize: 1024
    events:
      - schedule: cron(0 3 * * ? *) # 3 AM daily

  # Analytics aggregation
  analyticsAggregator:
    handler: src/functions/analytics-aggregator.handler
    timeout: 600
    memorySize: 1024
    events:
      - schedule: rate(1 hour)

  # Webhook retry handler
  webhookRetry:
    handler: src/functions/webhook-retry.handler
    timeout: 300
    memorySize: 512
    events:
      - sqs:
          arn: arn:aws:sqs:us-east-1:123456789:webhook-retry-queue

resources:
  Resources:
    # SQS queues
    EmailQueue:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: email-queue
        VisibilityTimeout: 300

    WebhookRetryQueue:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: webhook-retry-queue
        VisibilityTimeout: 300

    # S3 buckets
    Uploadsbucket:
      Type: AWS::S3::Bucket
      Properties:
        BucketName: infamous-freight-uploads
        LifecycleConfiguration:
          Rules:
            - Id: DeleteOldFiles
              Status: Enabled
              ExpirationInDays: 90
```

## Function Implementations

### Batch AI Processing

```typescript
// src/functions/batch-ai.ts
import { Handler } from "aws-lambda";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const handler: Handler = async (event, context) => {
  console.log("🤖 Starting batch AI processing");

  try {
    // Get shipments needing AI analysis
    const shipments = await prisma.shipment.findMany({
      where: {
        aiAnalyzed: false,
        status: "pending",
      },
      take: parseInt(process.env.AI_BATCH_SIZE || "100"),
    });

    console.log(`Processing ${shipments.length} shipments`);

    const results = await Promise.all(
      shipments.map(async (shipment) => {
        // Analyze with AI
        const analysis = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "Analyze shipment and suggest optimal route.",
            },
            {
              role: "user",
              content: `Origin: ${shipment.origin}, Destination: ${shipment.destination}, Weight: ${shipment.weight}`,
            },
          ],
        });

        // Update shipment
        return prisma.shipment.update({
          where: { id: shipment.id },
          data: {
            aiAnalyzed: true,
            aiSuggestions: analysis.choices[0].message.content,
          },
        });
      }),
    );

    console.log(`✓ Processed ${results.length} shipments`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        processed: results.length,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("Batch AI processing failed:", error);
    throw error;
  }
};
```

### Image Optimizer

```typescript
// src/functions/image-optimizer.ts
import { S3Handler } from "aws-lambda";
import sharp from "sharp";
import AWS from "aws-sdk";

const s3 = new AWS.S3();

export const handler: S3Handler = async (event) => {
  console.log("🖼️ Optimizing images");

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

    console.log(`Processing ${key}`);

    // Download image
    const image = await s3.getObject({ Bucket: bucket, Key: key }).promise();

    // Optimize with sharp
    const optimized = await sharp(image.Body as Buffer)
      .resize(1920, 1080, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();

    // Upload optimized version
    const optimizedKey = key.replace(/\.(jpg|png)$/, "-optimized.jpg");
    await s3
      .putObject({
        Bucket: bucket,
        Key: optimizedKey,
        Body: optimized,
        ContentType: "image/jpeg",
      })
      .promise();

    console.log(`✓ Optimized ${key} → ${optimizedKey}`);
    console.log(
      `Size reduction: ${((1 - optimized.length / image.Body!.length) * 100).toFixed(1)}%`,
    );
  }

  return { statusCode: 200, body: "Images optimized" };
};
```

### Report Generator

```typescript
// src/functions/report-generator.ts
import { ScheduledHandler } from "aws-lambda";
import { PrismaClient } from "@prisma/client";
import PDFDocument from "pdfkit";
import AWS from "aws-sdk";

const prisma = new PrismaClient();
const s3 = new AWS.S3();

export const handler: ScheduledHandler = async (event, context) => {
  console.log("📊 Generating daily reports");

  try {
    // Get yesterday's data
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const todayStart = new Date(yesterday);
    todayStart.setDate(todayStart.getDate() + 1);

    const shipments = await prisma.shipment.count({
      where: {
        createdAt: {
          gte: yesterday,
          lt: todayStart,
        },
      },
    });

    const delivered = await prisma.shipment.count({
      where: {
        status: "delivered",
        updatedAt: {
          gte: yesterday,
          lt: todayStart,
        },
      },
    });

    // Generate PDF
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));

    doc
      .fontSize(20)
      .text("Infamous Freight Daily Report", { align: "center" })
      .moveDown()
      .fontSize(14)
      .text(`Date: ${yesterday.toDateString()}`)
      .moveDown()
      .text(`Total Shipments: ${shipments}`)
      .text(`Delivered: ${delivered}`)
      .text(`Delivery Rate: ${((delivered / shipments) * 100).toFixed(1)}%`);

    doc.end();

    await new Promise((resolve) => doc.on("end", resolve));

    // Upload to S3
    const pdfBuffer = Buffer.concat(chunks);
    const key = `reports/daily-${yesterday.toISOString().split("T")[0]}.pdf`;

    await s3
      .putObject({
        Bucket: "infamous-freight-reports",
        Key: key,
        Body: pdfBuffer,
        ContentType: "application/pdf",
      })
      .promise();

    console.log(`✓ Report generated: ${key}`);

    return { statusCode: 200, body: "Report generated" };
  } catch (error) {
    console.error("Report generation failed:", error);
    throw error;
  }
};
```

## Deployment

### Install Serverless Framework

```bash
npm install -g serverless
npm install --save-dev serverless-offline
```

### Deploy to AWS

```bash
# Configure AWS credentials
aws configure

# Deploy all functions
serverless deploy

# Deploy single function
serverless deploy function -f batchAI

# View logs
serverless logs -f batchAI --tail

# Invoke function
serverless invoke -f batchAI
```

### Local Testing

```bash
# Run locally
serverless offline

# Test function
serverless invoke local -f batchAI
```

## Cost Optimization

### Pricing (AWS Lambda)

- **Requests**: $0.20 per 1M requests
- **Duration**: $0.0000166667 per GB-second

### Example Costs (Monthly)

**Batch AI** (1 GB, 5 min, hourly):

- Executions: 720/month
- Duration: 720 × 300s = 216,000s
- GB-seconds: 216,000 × 1 = 216,000
- Cost: $3.60 + $0.14 = **$3.74/month**

**Image Optimizer** (1 GB, 10s, 1000 uploads/day):

- Executions: 30,000/month
- Duration: 30,000 × 10s = 300,000s
- GB-seconds: 300,000 × 1 = 300,000
- Cost: $5.00 + $6.00 = **$11.00/month**

**Total Lambda costs**: ~$15-20/month **vs. EC2 t3.medium**: ~$30/month

**Savings**: 33-50%

## Monitoring

### CloudWatch Metrics

- Invocations
- Duration
- Errors
- Throttles
- Concurrent executions

### Alarms

```yaml
resources:
  Resources:
    BatchAIErrorAlarm:
      Type: AWS::CloudWatch::Alarm
      Properties:
        AlarmName: batch-ai-errors
        MetricName: Errors
        Namespace: AWS/Lambda
        Statistic: Sum
        Period: 300
        EvaluationPeriods: 1
        Threshold: 5
        ComparisonOperator: GreaterThanThreshold
```

## Best Practices

1. **Cold start optimization**: Keep functions warm with scheduled pings
2. **Connection pooling**: Reuse database connections
3. **Error handling**: Implement retry logic with exponential backoff
4. **Monitoring**: Set up CloudWatch alarms
5. **Security**: Use IAM roles, not hardcoded credentials
6. **Versioning**: Use Lambda versions and aliases
7. **Logging**: Structured logging with JSON
8. **Testing**: Unit tests + integration tests

## Expected Benefits

- **Cost**: 50% reduction vs. always-on servers
- **Scalability**: Automatic scaling to thousands of concurrent executions
- **Maintenance**: No server management
- **Reliability**: Built-in redundancy
- **Speed**: Pay only for actual compute time
