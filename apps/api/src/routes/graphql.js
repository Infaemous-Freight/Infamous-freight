/**
 * GraphQL API Implementation for Infæmous Freight Enterprises
 * Provides flexible querying and mutations for shipments, users, and analytics
 * 
 * @module routes/graphql
 */

const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const { authenticate, requireScope } = require('../middleware/security');
const { limiters } = require('../middleware/security');
const { getPrisma } = require('../db/prisma');
const { ApiResponse } = require('@infamous-freight/shared');

const router = express.Router();
const prisma = getPrisma();

/**
 * GraphQL Schema Definition
 * Defines all available queries, mutations, and types
 */
const schema = buildSchema(`
  """ Shipment Status Enum """
  enum ShipmentStatus {
    PENDING
    IN_TRANSIT
    DELIVERED
    CANCELLED
  }

  """ Shipment Type """
  type Shipment {
    id: ID!
    trackingNumber: String!
    origin: String!
    destination: String!
    status: ShipmentStatus!
    weight: Float
    estimatedDelivery: String
    actualDelivery: String
    customerId: ID!
    driverId: ID
    createdAt: String!
    updatedAt: String!
    customer: User
    driver: User
    trackingEvents: [TrackingEvent!]!
  }

  """ Tracking Event Type """
  type TrackingEvent {
    id: ID!
    shipmentId: ID!
    status: ShipmentStatus!
    location: String
    notes: String
    timestamp: String!
  }

  """ User Type """
  type User {
    id: ID!
    email: String!
    name: String
    role: String!
    createdAt: String!
  }

  """ Paginated Shipments Response """
  type PaginatedShipments {
    items: [Shipment!]!
    total: Int!
    page: Int!
    pageSize: Int!
    hasMore: Boolean!
  }

  """ Analytics Metrics """
  type Analytics {
    totalShipments: Int!
    activeShipments: Int!
    deliveredShipments: Int!
    averageDeliveryTime: Float
    onTimeDeliveryRate: Float
  }

  """ Query Root """
  type Query {
    """ Get shipment by ID """
    shipment(id: ID!): Shipment

    """ Get shipment by tracking number """
    shipmentByTracking(trackingNumber: String!): Shipment

    """ List shipments with pagination """
    shipments(
      page: Int = 1
      pageSize: Int = 20
      status: ShipmentStatus
      customerId: ID
      driverId: ID
    ): PaginatedShipments!

    """ Get user by ID """
    user(id: ID!): User

    """ Get analytics dashboard data """
    analytics(startDate: String, endDate: String): Analytics!

    """ Search shipments by multiple criteria """
    searchShipments(
      query: String
      origin: String
      destination: String
      dateFrom: String
      dateTo: String
    ): [Shipment!]!
  }

  """ Mutation Root """
  type Mutation {
    """ Create a new shipment """
    createShipment(
      origin: String!
      destination: String!
      weight: Float
      customerId: ID!
      estimatedDelivery: String
    ): Shipment!

    """ Update shipment status """
    updateShipmentStatus(
      id: ID!
      status: ShipmentStatus!
      location: String
      notes: String
    ): Shipment!

    """ Assign driver to shipment """
    assignDriver(shipmentId: ID!, driverId: ID!): Shipment!

    """ Cancel shipment """
    cancelShipment(id: ID!, reason: String): Shipment!
  }
`);

/**
 * GraphQL Resolvers
 * Implements the business logic for each query and mutation
 */
const root = {
  // ============================================
  // QUERIES
  // ============================================

  /**
   * Get shipment by ID
   */
  shipment: async ({ id }, context) => {
    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        customer: true,
        driver: true,
      },
    });

    if (!shipment) {
      throw new Error(`Shipment with ID ${id} not found`);
    }

    // Check authorization
    const user = context.user;
    if (user.role !== 'admin' && user.sub !== shipment.customerId && user.sub !== shipment.driverId) {
      throw new Error('Unauthorized to view this shipment');
    }

    return {
      ...shipment,
      trackingEvents: async () => {
        return prisma.trackingEvent.findMany({
          where: { shipmentId: id },
          orderBy: { timestamp: 'desc' },
        });
      },
    };
  },

  /**
   * Get shipment by tracking number
   */
  shipmentByTracking: async ({ trackingNumber }) => {
    const shipment = await prisma.shipment.findUnique({
      where: { trackingNumber },
      include: {
        customer: true,
        driver: true,
      },
    });

    if (!shipment) {
      throw new Error(`Shipment with tracking number ${trackingNumber} not found`);
    }

    return {
      ...shipment,
      trackingEvents: async () => {
        return prisma.trackingEvent.findMany({
          where: { shipmentId: shipment.id },
          orderBy: { timestamp: 'desc' },
        });
      },
    };
  },

  /**
   * List shipments with pagination
   */
  shipments: async ({ page = 1, pageSize = 20, status, customerId, driverId }, context) => {
    const skip = (page - 1) * pageSize;

    const where = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (driverId) where.driverId = driverId;

    // Regular users can only see their own shipments
    const user = context.user;
    if (user.role !== 'admin') {
      where.OR = [
        { customerId: user.sub },
        { driverId: user.sub },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          customer: true,
          driver: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.shipment.count({ where }),
    ]);

    return {
      items: items.map(item => ({
        ...item,
        trackingEvents: async () => {
          return prisma.trackingEvent.findMany({
            where: { shipmentId: item.id },
            orderBy: { timestamp: 'desc' },
          });
        },
      })),
      total,
      page,
      pageSize,
      hasMore: skip + items.length < total,
    };
  },

  /**
   * Get user by ID
   */
  user: async ({ id }, context) => {
    // Only admins or the user themselves can view user details
    const requestingUser = context.user;
    if (requestingUser.role !== 'admin' && requestingUser.sub !== id) {
      throw new Error('Unauthorized');
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }

    return user;
  },

  /**
   * Get analytics data
   */
  analytics: async ({ startDate, endDate }, context) => {
    // Require analytics read scope
    if (!context.scopes.includes('analytics:read')) {
      throw new Error('Insufficient permissions for analytics');
    }

    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [total, active, delivered] = await Promise.all([
      prisma.shipment.count({ where }),
      prisma.shipment.count({ where: { ...where, status: 'IN_TRANSIT' } }),
      prisma.shipment.count({ where: { ...where, status: 'DELIVERED' } }),
    ]);

    // Calculate average delivery time and on-time rate
    const deliveredShipments = await prisma.shipment.findMany({
      where: { ...where, status: 'DELIVERED', actualDelivery: { not: null } },
      select: {
        createdAt: true,
        actualDelivery: true,
        estimatedDelivery: true,
      },
    });

    let avgDeliveryTime = 0;
    let onTimeCount = 0;

    if (deliveredShipments.length > 0) {
      const totalDeliveryTime = deliveredShipments.reduce((sum, s) => {
        const time = new Date(s.actualDelivery).getTime() - new Date(s.createdAt).getTime();
        if (s.estimatedDelivery && new Date(s.actualDelivery) <= new Date(s.estimatedDelivery)) {
          onTimeCount++;
        }
        return sum + time;
      }, 0);

      avgDeliveryTime = totalDeliveryTime / deliveredShipments.length / (1000 * 60 * 60 * 24); // Convert to days
    }

    return {
      totalShipments: total,
      activeShipments: active,
      deliveredShipments: delivered,
      averageDeliveryTime: avgDeliveryTime,
      onTimeDeliveryRate: deliveredShipments.length > 0 ? (onTimeCount / deliveredShipments.length) * 100 : 0,
    };
  },

  /**
   * Search shipments
   */
  searchShipments: async ({ query, origin, destination, dateFrom, dateTo }, context) => {
    const where = {};

    if (query) {
      where.OR = [
        { trackingNumber: { contains: query, mode: 'insensitive' } },
        { origin: { contains: query, mode: 'insensitive' } },
        { destination: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (origin) where.origin = { contains: origin, mode: 'insensitive' };
    if (destination) where.destination = { contains: destination, mode: 'insensitive' };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    // Authorization: regular users can only search their shipments
    const user = context.user;
    if (user.role !== 'admin') {
      where.OR = where.OR || [];
      where.OR.push({ customerId: user.sub }, { driverId: user.sub });
    }

    const shipments = await prisma.shipment.findMany({
      where,
      include: {
        customer: true,
        driver: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit search results
    });

    return shipments.map(item => ({
      ...item,
      trackingEvents: async () => {
        return prisma.trackingEvent.findMany({
          where: { shipmentId: item.id },
          orderBy: { timestamp: 'desc' },
        });
      },
    }));
  },

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Create a new shipment
   */
  createShipment: async ({ origin, destination, weight, customerId, estimatedDelivery }, context) => {
    if (!context.scopes.includes('shipments:write')) {
      throw new Error('Insufficient permissions to create shipments');
    }

    // Generate tracking number
    const trackingNumber = `IFE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const shipment = await prisma.shipment.create({
      data: {
        trackingNumber,
        origin,
        destination,
        weight,
        customerId,
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
        status: 'PENDING',
      },
      include: {
        customer: true,
      },
    });

    // Create initial tracking event
    await prisma.trackingEvent.create({
      data: {
        shipmentId: shipment.id,
        status: 'PENDING',
        location: origin,
        notes: 'Shipment created',
        timestamp: new Date(),
      },
    });

    return {
      ...shipment,
      trackingEvents: async () => {
        return prisma.trackingEvent.findMany({
          where: { shipmentId: shipment.id },
          orderBy: { timestamp: 'desc' },
        });
      },
    };
  },

  /**
   * Update shipment status
   */
  updateShipmentStatus: async ({ id, status, location, notes }, context) => {
    if (!context.scopes.includes('shipments:write')) {
      throw new Error('Insufficient permissions to update shipments');
    }

    const shipment = await prisma.shipment.update({
      where: { id },
      data: {
        status,
        ...(status === 'DELIVERED' && { actualDelivery: new Date() }),
      },
      include: {
        customer: true,
        driver: true,
      },
    });

    // Create tracking event
    await prisma.trackingEvent.create({
      data: {
        shipmentId: id,
        status,
        location,
        notes,
        timestamp: new Date(),
      },
    });

    return {
      ...shipment,
      trackingEvents: async () => {
        return prisma.trackingEvent.findMany({
          where: { shipmentId: id },
          orderBy: { timestamp: 'desc' },
        });
      },
    };
  },

  /**
   * Assign driver to shipment
   */
  assignDriver: async ({ shipmentId, driverId }, context) => {
    if (!context.scopes.includes('shipments:write')) {
      throw new Error('Insufficient permissions');
    }

    const shipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: { driverId },
      include: {
        customer: true,
        driver: true,
      },
    });

    // Create tracking event
    await prisma.trackingEvent.create({
      data: {
        shipmentId,
        status: shipment.status,
        notes: `Driver assigned: ${shipment.driver?.name || driverId}`,
        timestamp: new Date(),
      },
    });

    return {
      ...shipment,
      trackingEvents: async () => {
        return prisma.trackingEvent.findMany({
          where: { shipmentId },
          orderBy: { timestamp: 'desc' },
        });
      },
    };
  },

  /**
   * Cancel shipment
   */
  cancelShipment: async ({ id, reason }, context) => {
    if (!context.scopes.includes('shipments:write')) {
      throw new Error('Insufficient permissions');
    }

    const shipment = await prisma.shipment.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        customer: true,
        driver: true,
      },
    });

    // Create tracking event
    await prisma.trackingEvent.create({
      data: {
        shipmentId: id,
        status: 'CANCELLED',
        notes: reason || 'Shipment cancelled',
        timestamp: new Date(),
      },
    });

    return {
      ...shipment,
      trackingEvents: async () => {
        return prisma.trackingEvent.findMany({
          where: { shipmentId: id },
          orderBy: { timestamp: 'desc' },
        });
      },
    };
  },
};

/**
 * GraphQL endpoint with authentication
 * 
 * @route POST /api/graphql
 * @access Protected - Requires JWT authentication
 */
router.use(
  '/',
  limiters.general,
  authenticate,
  graphqlHTTP((req) => ({
    schema,
    rootValue: root,
    context: {
      user: req.user,
      scopes: req.user?.scope || [],
    },
    graphiql: process.env.NODE_ENV === 'development', // GraphiQL UI in development only
    customFormatErrorFn: (error) => ({
      message: error.message,
      locations: error.locations,
      path: error.path,
      extensions: {
        code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
      },
    }),
  }))
);

module.exports = router;
