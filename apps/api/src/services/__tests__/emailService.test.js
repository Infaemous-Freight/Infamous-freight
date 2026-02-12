/**
 * Tests for Email Service
 */

// Mock @sendgrid/mail before requiring emailService
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn()
}));

const sgMail = require('@sendgrid/mail');

describe('Email Service', () => {
  let emailService;
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules and  mock
    jest.resetModules();
    jest.clearAllMocks();
    
    // Set environment variables BEFORE requiring the module
    process.env = { 
      ...originalEnv,
      SENDGRID_API_KEY: 'test-api-key-123',
      SENDGRID_FROM_EMAIL: 'test@infamousfreight.com',
      SENDGRID_FROM_NAME: 'Test Freight'
    };

    // Require module after setting env vars
    emailService = require('../emailService');
    
    // Setup default mock behavior
    sgMail.send.mockResolvedValue([{ 
      statusCode: 202, 
      headers: { 'x-message-id': 'msg-123' } 
    }]);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('sendEmail', () => {
    test('sends simple email successfully', async () => {
      await emailService.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test plain text',
        html: '<p>Test HTML</p>'
      });

      expect(sgMail.send).toHaveBeenCalledWith(expect.objectContaining({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test plain text',
        html: '<p>Test HTML</p>',
        from: expect.objectContaining({
          email: 'test@infamousfreight.com',
          name: 'Test Freight'
        })
      }));
    });

    test('sends email to multiple recipients', async () => {
      await emailService.sendEmail({
        to: ['user1@example.com', 'user2@example.com'],
        subject: 'Bulk Email',
        text: 'Message for all'
      });

      expect(sgMail.send).toHaveBeenCalledWith(expect.objectContaining({
        to: ['user1@example.com', 'user2@example.com' ]
      }));
    });

    test('sends email with template', async () => {
      await emailService.sendEmail({
        to: 'user@example.com',
        subject: 'Template Email',
        text: 'Fallback text',
        templateId: 'd-123456789',
        dynamicTemplateData: {
          name: 'John Doe',
          orderNumber: '12345'
        }
      });

      expect(sgMail.send).toHaveBeenCalledWith(expect.objectContaining({
        templateId: 'd-123456789',
        dynamicTemplateData: expect.objectContaining({
          name: 'John Doe',
          orderNumber: '12345'
        })
      }));
    });

    test('handles send failure gracefully', async () => {
      const error = new Error('SendGrid API error');
      error.code = 403;
      error.response = { body: { errors: ['Invalid API key'] } };
      
      sgMail.send.mockRejectedValue(error);

      await expect(emailService.sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        text: 'Test'
      })).rejects.toThrow('SendGrid API error');
    });

    test('skips sending when API key not configured', async () => {
      // Clear env and reload module
      jest.resetModules();
      delete process.env.SENDGRID_API_KEY;
      const emailServiceNoKey = require('../emailService');

      await emailServiceNoKey.sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        text: 'Test'
      });

      // Should NOT have called send because no API key
      expect(sgMail.send).not.toHaveBeenCalled();
    });
  });

  describe('sendShipmentNotification', () => {
    test('sends shipment created notification', async () => {
      const shipment = {
        id: 'ship-123',
        trackingNumber: 'TRK-12345',
        status: 'pending',
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        estimatedDelivery: new Date('2025-02-01')
      };

      await emailService.sendShipmentNotification(
        shipment,
        'customer@example.com',
        'created'
      );

      expect(sgMail.send).toHaveBeenCalledWith(expect.objectContaining({
        to: 'customer@example.com',
        subject: expect.stringContaining('Shipment Created')
      }));
      
      const callArgs = sgMail.send.mock.calls[0][0];
      expect(callArgs.text).toContain('TRK-12345');
      expect(callArgs.html).toContain('TRK-12345');
    });

    test('includes tracking link in notification', async () => {
      process.env.WEB_URL = 'https://test.infamousfreight.com';
      
      // Reload module to pick up new env var
      jest.resetModules();
      emailService = require('../emailService');
      sgMail.send.mockResolvedValue([{ statusCode: 202 }]);

      const shipment = {
        id: 'ship-456',
        trackingNumber: 'TRK-67890',
        status: 'in-transit',
        origin: 'Dallas, TX',
        destination: 'Miami, FL'
      };

      await emailService.sendShipmentNotification(
        shipment,
        'customer@example.com',
        'updated'
      );

      const callArgs = sgMail.send.mock.calls[0][0];
      expect(callArgs.html).toContain('https://test.infamousfreight.com/shipments/ship-456');
    });
  });

  describe('sendDriverAssignment', () => {
    test('sends driver assignment notification', async () => {
      const driver = {
        id: 'drv-123',
        name: 'John Driver',
        email: 'driver@example.com'
      };

      const shipment = {
        id: 'ship-789',
        trackingNumber: 'TRK-11111',
        origin: 'Chicago, IL',
        destination: 'Denver, CO',
        pickupTime: new Date('2025-01-25T10:00:00Z')
      };

      await emailService.sendDriverAssignment(driver, shipment);

      expect(sgMail.send).toHaveBeenCalledWith(expect.objectContaining({
        to: 'driver@example.com',
        subject: expect.stringContaining('New Shipment Assignment')
      }));
      
      const callArgs = sgMail.send.mock.calls[0][0];
      expect(callArgs.text).toContain('John Driver');
      expect(callArgs.text).toContain('TRK-11111');
    });
  });

  describe('sendAdminAlert', () => {
    test('sends admin alert', async () => {
      await emailService.sendAdminAlert(
        'System Error',
        { error: 'Database connection failed', severity: 'high' },
        ['admin1@example.com', 'admin2@example.com']
      );

      expect(sgMail.send).toHaveBeenCalledWith(expect.objectContaining({
        to: ['admin1@example.com', 'admin2@example.com'],
        subject: '[ALERT] System Error'
      }));
      
      const callArgs = sgMail.send.mock.calls[0][0];
      expect(callArgs.text).toContain('Database connection failed');
    });
  });

  describe('sendBatch', () => {
    test('sends multiple emails in batch', async () => {
      const emails = [
        { to: 'user1@example.com', subject: 'Subject 1', text: 'Text 1' },
        { to: 'user2@example.com', subject: 'Subject 2', text: 'Text 2' },
        { to: 'user3@example.com', subject: 'Subject 3', text: 'Text 3' }
      ];

      await emailService.sendBatch(emails);

      expect(sgMail.send).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ to: 'user1@example.com', subject: 'Subject 1' }),
        expect.objectContaining({ to: 'user2@example.com', subject: 'Subject 2' }),
        expect.objectContaining({ to: 'user3@example.com', subject: 'Subject 3' })
      ]));
    });

    test('handles batch send failure', async () => {
      sgMail.send.mockRejectedValue(new Error('Batch send failed'));

      const emails = [
        { to: 'user1@example.com', subject: 'Subject', text: 'Text' }
      ];

      await expect(emailService.sendBatch(emails)).rejects.toThrow('Batch send failed');
    });
  });
});
