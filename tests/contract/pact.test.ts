/**
 * Contract Testing with Pact
 * Ensure API compatibility between providers (API) and consumers (Web/Mobile)
 * Prevent breaking changes with consumer-driven contracts
 */

import { Pact, Matchers } from '@pact-foundation/pact';
import { resolve } from 'path';
import axios from 'axios';

const { like, eachLike, term } = Matchers;

/**
 * Pact provider setup (API side)
 */
describe('Infæmous Freight API Provider', () => {
  const provider = new Pact({
    consumer: 'WebApp',
    provider: 'API',
    port: 4001, // Mock server port
    log: resolve(process.cwd(), 'logs', 'pact.log'),
    dir: resolve(process.cwd(), 'pacts'),
    logLevel: 'info',
  });

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  /**
   * Contract: Get shipment by ID
   */
  describe('GET /api/shipments/:id', () => {
    beforeEach(async () => {
      await provider.addInteraction({
        state: 'shipment with ID 123 exists',
        uponReceiving: 'a request for shipment 123',
        withRequest: {
          method: 'GET',
          path: '/api/shipments/123',
          headers: {
            Authorization: term({
              matcher: 'Bearer .*',
              generate: 'Bearer test-token',
            }),
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            success: true,
            data: {
              id: like('123'),
              trackingNumber: like('INF-2024-001'),
              status: term({
                matcher: 'pending|in_transit|delivered|cancelled',
                generate: 'in_transit',
              }),
              origin: like('New York, NY'),
              destination: like('Los Angeles, CA'),
              weight: like(500),
              driver: like({
                id: '456',
                name: 'John Doe',
                phone: '+1234567890',
              }),
              createdAt: term({
                matcher: '\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}',
                generate: '2024-01-15T10:30:00',
              }),
            },
          },
        },
      });
    });

    it('returns shipment details', async () => {
      const response = await axios.get(`http://localhost:4001/api/shipments/123`, {
        headers: { Authorization: 'Bearer test-token' },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');
      expect(response.data.data).toHaveProperty('trackingNumber');
      expect(response.data.data.status).toMatch(/pending|in_transit|delivered|cancelled/);
    });
  });

  /**
   * Contract: List shipments
   */
  describe('GET /api/shipments', () => {
    beforeEach(async () => {
      await provider.addInteraction({
        state: 'shipments exist',
        uponReceiving: 'a request for all shipments',
        withRequest: {
          method: 'GET',
          path: '/api/shipments',
          query: {
            page: '1',
            limit: '10',
          },
          headers: {
            Authorization: term({
              matcher: 'Bearer .*',
              generate: 'Bearer test-token',
            }),
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            success: true,
            data: eachLike({
              id: like('123'),
              trackingNumber: like('INF-2024-001'),
              status: like('in_transit'),
              origin: like('New York, NY'),
              destination: like('Los Angeles, CA'),
            }),
            pagination: like({
              page: 1,
              limit: 10,
              total: 50,
              pages: 5,
            }),
          },
        },
      });
    });

    it('returns list of shipments', async () => {
      const response = await axios.get('http://localhost:4001/api/shipments', {
        params: { page: 1, limit: 10 },
        headers: { Authorization: 'Bearer test-token' },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.pagination).toHaveProperty('page');
      expect(response.data.pagination).toHaveProperty('total');
    });
  });

  /**
   * Contract: Create shipment
   */
  describe('POST /api/shipments', () => {
    beforeEach(async () => {
      await provider.addInteraction({
        state: 'user is authenticated',
        uponReceiving: 'a request to create shipment',
        withRequest: {
          method: 'POST',
          path: '/api/shipments',
          headers: {
            'Content-Type': 'application/json',
            Authorization: term({
              matcher: 'Bearer .*',
              generate: 'Bearer test-token',
            }),
          },
          body: {
            origin: like('New York, NY'),
            destination: like('Los Angeles, CA'),
            weight: like(500),
            description: like('Electronics'),
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            success: true,
            data: {
              id: like('123'),
              trackingNumber: like('INF-2024-001'),
              status: 'pending',
              origin: like('New York, NY'),
              destination: like('Los Angeles, CA'),
              weight: like(500),
              createdAt: term({
                matcher: '\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}',
                generate: '2024-01-15T10:30:00',
              }),
            },
          },
        },
      });
    });

    it('creates new shipment', async () => {
      const response = await axios.post(
        'http://localhost:4001/api/shipments',
        {
          origin: 'New York, NY',
          destination: 'Los Angeles, CA',
          weight: 500,
          description: 'Electronics',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        }
      );

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');
      expect(response.data.data).toHaveProperty('trackingNumber');
      expect(response.data.data.status).toBe('pending');
    });
  });

  /**
   * Contract: Error handling
   */
  describe('GET /api/shipments/:id (not found)', () => {
    beforeEach(async () => {
      await provider.addInteraction({
        state: 'shipment with ID 999 does not exist',
        uponReceiving: 'a request for non-existent shipment',
        withRequest: {
          method: 'GET',
          path: '/api/shipments/999',
          headers: {
            Authorization: term({
              matcher: 'Bearer .*',
              generate: 'Bearer test-token',
            }),
          },
        },
        willRespondWith: {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            success: false,
            error: like('Shipment not found'),
          },
        },
      });
    });

    it('returns 404 error', async () => {
      try {
        await axios.get('http://localhost:4001/api/shipments/999', {
          headers: { Authorization: 'Bearer test-token' },
        });
      } catch (error) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.success).toBe(false);
        expect(error.response.data.error).toBe('Shipment not found');
      }
    });
  });
});

/**
 * Pact verification (run on API provider side)
 */
import { Verifier } from '@pact-foundation/pact';
import { resolve } from 'path';

describe('API Provider Verification', () => {
  it('validates contracts from consumers', async () => {
    const verifier = new Verifier({
      providerBaseUrl: 'http://localhost:4000', // API server
      provider: 'API',
      pactUrls: [
        resolve(process.cwd(), 'pacts', 'webapp-api.json'),
        resolve(process.cwd(), 'pacts', 'mobileapp-api.json'),
      ],
      providerStatesSetupUrl: 'http://localhost:4000/pact/provider-states',
      publishVerificationResult: true,
      providerVersion: process.env.GIT_COMMIT || '1.0.0',
    });

    await verifier.verifyProvider();
  });
});

/**
 * Provider states endpoint (add to API)
 */
import { Router } from 'express';

const router = Router();

router.post('/pact/provider-states', async (req, res) => {
  const { state, params } = req.body;

  switch (state) {
    case 'shipment with ID 123 exists':
      // Seed database with shipment 123
      await prisma.shipment.upsert({
        where: { id: '123' },
        create: {
          id: '123',
          trackingNumber: 'INF-2024-001',
          status: 'in_transit',
          origin: 'New York, NY',
          destination: 'Los Angeles, CA',
          weight: 500,
        },
        update: {},
      });
      break;

    case 'shipment with ID 999 does not exist':
      // Ensure shipment 999 doesn't exist
      await prisma.shipment.deleteMany({
        where: { id: '999' },
      });
      break;

    case 'shipments exist':
      // Seed database with multiple shipments
      await prisma.shipment.createMany({
        data: [
          { trackingNumber: 'INF-2024-001', status: 'in_transit' },
          { trackingNumber: 'INF-2024-002', status: 'delivered' },
          { trackingNumber: 'INF-2024-003', status: 'pending' },
        ],
        skipDuplicates: true,
      });
      break;

    default:
      return res.status(400).json({ error: 'Unknown provider state' });
  }

  res.status(200).json({ message: 'Provider state set' });
});

export default router;

/**
 * CI/CD Integration
 */

// package.json scripts
{
  "scripts": {
    "pact:test": "jest --testMatch='**/*.pact.test.ts'",
    "pact:verify": "jest --testMatch='**/*.pact.verify.ts'",
    "pact:publish": "pact-broker publish pacts --consumer-app-version=$GIT_COMMIT --broker-base-url=$PACT_BROKER_URL"
  }
}

// .github/workflows/pact.yml
export const pactWorkflow = `
name: Pact Contract Testing

on: [push, pull_request]

jobs:
  consumer-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run pact:test
      - name: Publish contracts
        run: npm run pact:publish
        env:
          PACT_BROKER_URL: \${{ secrets.PACT_BROKER_URL }}
          GIT_COMMIT: \${{ github.sha }}

  provider-verification:
    runs-on: ubuntu-latest
    needs: consumer-tests
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run api:start &
      - run: npm run pact:verify
        env:
          PACT_BROKER_URL: \${{ secrets.PACT_BROKER_URL }}
          GIT_COMMIT: \${{ github.sha }}
`;

/**
 * Usage:
 *
 * // Install dependencies
 * npm install --save-dev @pact-foundation/pact
 *
 * // Run consumer tests (Web/Mobile)
 * npm run pact:test
 *
 * // Run provider verification (API)
 * npm run pact:verify
 *
 * // Publish contracts to Pact Broker
 * npm run pact:publish
 *
 * Benefits:
 * - Catch breaking changes before deployment
 * - Consumer-driven API design
 * - Automated contract verification
 * - Parallel development (frontend/backend)
 * - Version compatibility tracking
 *
 * Pact Broker Dashboard:
 * - View all contracts
 * - Verify compatibility matrix
 * - Track breaking changes
 * - Deploy with confidence
 */
