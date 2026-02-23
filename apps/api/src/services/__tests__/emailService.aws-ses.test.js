/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Test Suite: AWS SES Email Service
 */

const emailService = require("../emailService.aws-ses");

// Mock AWS SDK v3 (SES)
jest.mock("@aws-sdk/client-ses", () => {
    const mockSend = jest.fn((command) => {
        if (command && command.__type === "GetSendQuotaCommand") {
            return Promise.resolve({
                Max24HourSend: 200,
                SentLast24Hours: 50,
                MaxSendRate: 1,
            });
        }

        return Promise.resolve({ MessageId: "mock-message-id-123" });
    });

    return {
        SESClient: jest.fn().mockImplementation(() => ({
            send: mockSend,
        })),
        SendEmailCommand: jest.fn((input) => ({ __type: "SendEmailCommand", input })),
        GetSendQuotaCommand: jest.fn(() => ({ __type: "GetSendQuotaCommand" })),
        VerifyEmailIdentityCommand: jest.fn((input) => ({
            __type: "VerifyEmailIdentityCommand",
            input,
        })),
        __mockSesSend: mockSend,
    };
});

// Mock logger
jest.mock("../../middleware/logger", () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

describe("AWS SES Email Service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.AWS_SES_REGION = "us-east-1";
        process.env.AWS_SES_ACCESS_KEY = "AKIA_TEST_KEY";
        process.env.AWS_SES_SECRET_KEY = "test_secret_key";
        process.env.AWS_SES_FROM_EMAIL = "test@infamousfreight.com";
        process.env.AWS_SES_FROM_NAME = "Test Freight";
    });

    describe("sendEmail", () => {
        it("should send email successfully", async () => {
            const result = await emailService.sendEmail({
                to: "recipient@example.com",
                subject: "Test Email",
                text: "Test body",
                html: "<p>Test body</p>",
            });

            expect(result.success).toBe(true);
            expect(result.messageId).toBe("mock-message-id-123");
        });

        it("should handle multiple recipients", async () => {
            const result = await emailService.sendEmail({
                to: ["recipient1@example.com", "recipient2@example.com"],
                subject: "Test Email",
                text: "Test body",
            });

            expect(result.success).toBe(true);
        });

        it("should handle missing html parameter", async () => {
            const result = await emailService.sendEmail({
                to: "recipient@example.com",
                subject: "Test Email",
                text: "Test body",
            });

            expect(result.success).toBe(true);
        });

        it("should handle AWS SES errors", async () => {
            const { __mockSesSend } = require("@aws-sdk/client-ses");
            const mockError = new Error("AWS SES Error");
            __mockSesSend.mockRejectedValueOnce(mockError);

            const result = await emailService.sendEmail({
                to: "recipient@example.com",
                subject: "Test Email",
                text: "Test body",
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe("AWS SES Error");
        });
    });

    describe("sendShipmentNotification", () => {
        it("should send shipment notification successfully", async () => {
            const result = await emailService.sendShipmentNotification({
                to: "recipient@example.com",
                shipmentId: "SHIP-12345",
                status: "delivered",
                trackingUrl: "https://track.example.com/SHIP-12345",
            });

            expect(result.success).toBe(true);
            expect(result.messageId).toBe("mock-message-id-123");
        });
    });

    describe("sendDriverAssignment", () => {
        it("should send driver assignment notification", async () => {
            const result = await emailService.sendDriverAssignment({
                to: "driver@example.com",
                driverName: "John Doe",
                shipmentId: "SHIP-12345",
                pickupLocation: "Los Angeles, CA",
                deliveryLocation: "San Francisco, CA",
                pickupDate: "2026-02-20",
            });

            expect(result.success).toBe(true);
        });
    });

    describe("sendAdminAlert", () => {
        it("should send admin alert", async () => {
            const result = await emailService.sendAdminAlert({
                subject: "Critical Alert",
                message: "System issue detected",
                severity: "high",
            });

            expect(result.success).toBe(true);
        });

        it("should use ALERT_EMAILS from environment", async () => {
            process.env.ALERT_EMAILS = "admin1@example.com,admin2@example.com";

            const result = await emailService.sendAdminAlert({
                subject: "Test Alert",
                message: "Test message",
            });

            expect(result.success).toBe(true);
        });
    });

    describe("sendBatch", () => {
        it("should send multiple emails in batch", async () => {
            const emails = [
                {
                    to: "recipient1@example.com",
                    subject: "Email 1",
                    text: "Body 1",
                },
                {
                    to: "recipient2@example.com",
                    subject: "Email 2",
                    text: "Body 2",
                },
            ];

            const results = await emailService.sendBatch(emails);

            expect(results).toHaveLength(2);
            expect(results[0].success).toBe(true);
            expect(results[1].success).toBe(true);
        });

        it("should handle partial batch failures", async () => {
            const { __mockSesSend } = require("@aws-sdk/client-ses");
            let callCount = 0;
            __mockSesSend.mockImplementation(() => {
                callCount++;
                if (callCount === 2) {
                    return Promise.reject(new Error("Failed email"));
                }
                return Promise.resolve({ MessageId: `msg-${callCount}` });
            });

            const emails = [
                { to: "recipient1@example.com", subject: "Email 1", text: "Body 1" },
                { to: "recipient2@example.com", subject: "Email 2", text: "Body 2" },
                { to: "recipient3@example.com", subject: "Email 3", text: "Body 3" },
            ];

            const results = await emailService.sendBatch(emails);

            expect(results).toHaveLength(3);
            expect(results[0].success).toBe(true);
            expect(results[1].success).toBe(false);
            expect(results[2].success).toBe(true);
        });
    });

    describe("getSendQuota", () => {
        it("should retrieve SES send quota", async () => {
            const quota = await emailService.getSendQuota();

            expect(quota.max24HourSend).toBe(200);
            expect(quota.sentLast24Hours).toBe(50);
            expect(quota.maxSendRate).toBe(1);
            expect(quota.remaining).toBe(150);
            expect(quota.percentUsed).toBe(25);
        });

        it("should handle quota retrieval errors", async () => {
            const { __mockSesSend } = require("@aws-sdk/client-ses");
            __mockSesSend.mockRejectedValueOnce(new Error("Quota error"));

            const quota = await emailService.getSendQuota();

            expect(quota).toBeNull();
        });
    });

    describe("Cost Optimization Validation", () => {
        it("should be compatible with SendGrid API", async () => {
            // Verify same function signature as SendGrid
            const sendGridCompatibleCall = await emailService.sendEmail({
                to: "test@example.com",
                subject: "Test",
                text: "Test body",
                html: "<p>Test</p>",
            });

            expect(sendGridCompatibleCall).toHaveProperty("success");
            expect(sendGridCompatibleCall).toHaveProperty("messageId");
        });

        it("should track quota to avoid exceeding free tier", async () => {
            const quota = await emailService.getSendQuota();

            // Free tier limit is 62,000 per month
            // Daily limit should be around 2,000
            expect(quota.max24HourSend).toBeDefined();
            expect(quota.remaining).toBeDefined();

            // Verify we're monitoring usage
            expect(quota.percentUsed).toBeGreaterThanOrEqual(0);
            expect(quota.percentUsed).toBeLessThanOrEqual(100);
        });
    });
});
