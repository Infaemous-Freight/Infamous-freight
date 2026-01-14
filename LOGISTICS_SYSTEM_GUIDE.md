# Complete Logistics Management System 100%

## 🚚 Overview

The Infamous Freight Enterprises Logistics Management System provides comprehensive end-to-end logistics operations including real-time shipment tracking, warehouse management, inventory control, fleet operations, load optimization, and supply chain analytics.

## 🎯 Key Features

- **Shipment Management**: Create, track, and manage shipments with automatic routing and driver assignment
- **Real-Time Tracking**: GPS-enabled tracking with live location updates and ETA calculations
- **Warehouse Operations**: Receiving, picking, packing, and shipping with optimized workflows
- **Inventory Control**: Multi-warehouse inventory management with cycle counting and automatic reordering
- **Fleet Management**: Vehicle tracking, maintenance scheduling, and deployment optimization
- **Load Optimization**: Consolidation algorithms to maximize vehicle utilization and reduce costs
- **Supply Chain Analytics**: Comprehensive metrics, KPIs, and bottleneck identification
- **Performance Monitoring**: Real-time dashboards and alerts for critical events

## 📋 Table of Contents

- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Integration Guide](#integration-guide)
- [Code Examples](#code-examples)
- [Testing](#testing)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                   API Layer (15 Endpoints)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Shipment │ Warehouse │ Inventory │ Fleet │ Analytics   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   LogisticsService (Core)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Shipment tracking & routing                           │  │
│  │  • Warehouse receiving & picking                         │  │
│  │  • Inventory movements & transfers                       │  │
│  │  • Fleet deployment & maintenance                        │  │
│  │  • Load consolidation algorithms                         │  │
│  │  • Supply chain analytics engine                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Database Layer (25+ Models)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Shipments │ Warehouses │ Inventory │ Fleet │ Orders     │  │
│  │  Events │ Movements │ Transfers │ Analytics │ Alerts     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 📡 API Endpoints

### Shipment Management

#### 1. Create Shipment

**Endpoint**: `POST /api/logistics/shipments`

**Purpose**: Create new shipment with automatic routing and resource assignment

**Authentication**: Required (JWT + `logistics:create` scope)

**Request Body**:

```json
{
  "customerId": "cust_123",
  "origin": {
    "address": "123 Main St, New York, NY 10001",
    "lat": 40.7128,
    "lng": -74.006
  },
  "destination": {
    "address": "456 Oak Ave, Los Angeles, CA 90001",
    "lat": 34.0522,
    "lng": -118.2437
  },
  "cargo": {
    "type": "palletized",
    "weight": 500,
    "volume": 2.5,
    "items": [
      {
        "productId": "prod_123",
        "quantity": 50
      }
    ]
  },
  "priority": "standard",
  "requirements": {
    "temperatureControlled": false,
    "hazmat": false
  }
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "shipment": {
      "id": "ship_abc123",
      "trackingNumber": "IFEABC123XYZ",
      "status": "pending",
      "estimatedPickupTime": "2026-01-15T10:00:00Z",
      "estimatedDeliveryTime": "2026-01-17T16:00:00Z"
    },
    "route": {
      "id": "route_xyz789",
      "distance": 4485.3,
      "duration": 2700,
      "estimatedCost": 2242.65
    },
    "assignment": {
      "driverId": "drv_456",
      "vehicleId": "veh_789",
      "pickupTime": "2026-01-15T10:00:00Z",
      "deliveryTime": "2026-01-17T16:00:00Z"
    },
    "tracking": {
      "trackingNumber": "IFEABC123XYZ",
      "trackingUrl": "https://track.infamous-freight.com/IFEABC123XYZ"
    }
  },
  "message": "Shipment created successfully"
}
```

---

#### 2. Track Shipment

**Endpoint**: `GET /api/logistics/shipments/track/:trackingNumber`

**Purpose**: Real-time shipment tracking with location, ETA, and progress

**Authentication**: Not required (public tracking)

**Response**:

```json
{
  "success": true,
  "data": {
    "shipment": {
      "id": "ship_abc123",
      "trackingNumber": "IFEABC123XYZ",
      "status": "in_transit",
      "priority": "standard",
      "origin": {
        "address": "123 Main St, New York, NY",
        "lat": 40.7128,
        "lng": -74.006
      },
      "destination": {
        "address": "456 Oak Ave, Los Angeles, CA",
        "lat": 34.0522,
        "lng": -118.2437
      }
    },
    "currentLocation": {
      "lat": 39.7392,
      "lng": -104.9903,
      "address": "Denver, CO",
      "timestamp": "2026-01-16T14:30:00Z"
    },
    "eta": {
      "estimatedArrival": "2026-01-17T16:00:00Z",
      "distanceRemaining": 1647.5,
      "confidence": 85
    },
    "progress": 63.2,
    "driver": {
      "name": "John Smith",
      "phone": "555-0100",
      "rating": 4.8
    },
    "vehicle": {
      "type": "semi_truck",
      "licensePlate": "ABC123",
      "capacity": 20000
    },
    "events": [
      {
        "type": "picked_up",
        "description": "Package picked up",
        "timestamp": "2026-01-15T10:15:00Z",
        "location": "New York, NY"
      },
      {
        "type": "in_transit",
        "description": "In transit to Los Angeles",
        "timestamp": "2026-01-15T12:00:00Z",
        "location": "Pennsylvania"
      }
    ],
    "timeline": [
      {
        "stage": "Order Placed",
        "status": "completed",
        "timestamp": "2026-01-15T09:00:00Z"
      },
      {
        "stage": "Picked Up",
        "status": "completed",
        "timestamp": "2026-01-15T10:15:00Z"
      },
      {
        "stage": "In Transit",
        "status": "active",
        "timestamp": null
      },
      {
        "stage": "Out for Delivery",
        "status": "pending",
        "timestamp": null
      },
      {
        "stage": "Delivered",
        "status": "pending",
        "timestamp": null
      }
    ]
  }
}
```

---

#### 3. Update Shipment Status

**Endpoint**: `PUT /api/logistics/shipments/:id/status`

**Purpose**: Update shipment status with automatic notifications

**Authentication**: Required (JWT + `logistics:update` scope)

**Request Body**:

```json
{
  "status": "delivered",
  "location": {
    "lat": 34.0522,
    "lng": -118.2437,
    "address": "456 Oak Ave, Los Angeles, CA"
  },
  "notes": "Package delivered successfully. Signed by recipient."
}
```

---

### Warehouse Management

#### 4. Get Warehouse Status

**Endpoint**: `GET /api/logistics/warehouses/:id/status`

**Purpose**: Comprehensive warehouse status, capacity, and metrics

**Authentication**: Required (JWT + `logistics:view` scope)

**Response**:

```json
{
  "success": true,
  "data": {
    "warehouse": {
      "id": "wh_nyc01",
      "name": "New York Distribution Center",
      "location": "New York, NY",
      "type": "distribution_center",
      "totalArea": 50000,
      "storageCapacity": 100000
    },
    "capacity": {
      "current": 75000,
      "maximum": 100000,
      "utilization": 75,
      "available": 25000
    },
    "inventory": {
      "totalItems": 1250,
      "totalValue": 2850000,
      "lowStockItems": 45
    },
    "shipments": {
      "incoming": 18,
      "outgoing": 24,
      "processing": 12
    },
    "zones": [
      {
        "id": "zone_a1",
        "name": "Zone A1",
        "type": "storage",
        "capacity": 10000,
        "utilization": 82
      }
    ],
    "metrics": {
      "receivingEfficiency": 95,
      "pickingAccuracy": 98,
      "shippingAccuracy": 99,
      "inventoryAccuracy": 97,
      "orderFulfillmentTime": 24
    }
  }
}
```

---

#### 5. Receive Goods

**Endpoint**: `POST /api/logistics/warehouses/receive`

**Purpose**: Receive incoming shipments and update inventory

**Authentication**: Required (JWT + `logistics:warehouse` scope)

**Request Body**:

```json
{
  "warehouseId": "wh_nyc01",
  "shipmentId": "ship_abc123",
  "items": [
    {
      "productId": "prod_123",
      "quantity": 50,
      "unitValue": 45.0
    },
    {
      "productId": "prod_456",
      "quantity": 100,
      "unitValue": 25.0
    }
  ],
  "receivedBy": "emp_john",
  "condition": "good",
  "notes": "All items in good condition"
}
```

---

#### 6. Pick Items

**Endpoint**: `POST /api/logistics/warehouses/pick`

**Purpose**: Create pick list with optimized route

**Authentication**: Required (JWT + `logistics:warehouse` scope)

**Request Body**:

```json
{
  "warehouseId": "wh_nyc01",
  "orderId": "ord_789",
  "items": [
    {
      "productId": "prod_123",
      "quantity": 10,
      "location": "A1-B05"
    },
    {
      "productId": "prod_456",
      "quantity": 25,
      "location": "A2-C12"
    }
  ],
  "pickerId": "emp_jane"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "pickList": {
      "id": "pick_xyz123",
      "status": "in_progress"
    },
    "optimizedRoute": {
      "sequence": [
        {
          "order": 1,
          "productId": "prod_123",
          "location": "A1-B05"
        },
        {
          "order": 2,
          "productId": "prod_456",
          "location": "A2-C12"
        }
      ],
      "estimatedDistance": 150
    },
    "reservations": [
      {
        "id": "res_abc1",
        "productId": "prod_123",
        "quantity": 10
      }
    ],
    "estimatedPickTime": 18.5
  },
  "message": "Pick list created successfully"
}
```

---

### Inventory Management

#### 7. Get Inventory Report

**Endpoint**: `GET /api/logistics/inventory`

**Purpose**: Comprehensive inventory report with analytics

**Authentication**: Required (JWT + `logistics:view` scope)

**Query Parameters**:

- `warehouseId` (optional): Filter by warehouse
- `productId` (optional): Filter by product
- `lowStock` (optional): Show only low stock items
- `category` (optional): Filter by category

**Response**:

```json
{
  "success": true,
  "data": {
    "inventory": [
      {
        "id": "inv_123",
        "warehouseId": "wh_nyc01",
        "warehouseName": "NYC Distribution Center",
        "productId": "prod_123",
        "productName": "Widget Pro",
        "sku": "WGT-PRO-001",
        "quantity": 250,
        "location": "A1-B05",
        "reorderPoint": 50,
        "reorderQuantity": 200,
        "unitValue": 45.0,
        "totalValue": 11250.0,
        "lastRestocked": "2026-01-10T10:00:00Z",
        "status": "in_stock"
      }
    ],
    "analytics": {
      "totalItems": 1250,
      "totalValue": 2850000,
      "totalQuantity": 45000,
      "lowStockCount": 45,
      "outOfStockCount": 3,
      "turnoverRate": 12
    },
    "byCategory": {
      "electronics": {
        "count": 450,
        "totalValue": 1200000,
        "items": []
      }
    },
    "reorderNeeded": [
      {
        "productId": "prod_789",
        "productName": "Gadget Plus",
        "currentQuantity": 15,
        "reorderPoint": 50,
        "reorderQuantity": 200,
        "urgency": "high"
      }
    ]
  }
}
```

---

#### 8. Transfer Inventory

**Endpoint**: `POST /api/logistics/inventory/transfer`

**Purpose**: Transfer inventory between warehouses

**Authentication**: Required (JWT + `logistics:warehouse` scope)

**Request Body**:

```json
{
  "productId": "prod_123",
  "fromWarehouseId": "wh_nyc01",
  "toWarehouseId": "wh_la01",
  "quantity": 100,
  "reason": "rebalancing",
  "requestedBy": "mgr_john"
}
```

---

#### 9. Cycle Count

**Endpoint**: `POST /api/logistics/inventory/cycle-count`

**Purpose**: Perform inventory cycle count and identify discrepancies

**Authentication**: Required (JWT + `logistics:warehouse` scope)

**Request Body**:

```json
{
  "warehouseId": "wh_nyc01",
  "zone": "A1",
  "items": [
    {
      "productId": "prod_123",
      "countedQuantity": 248
    },
    {
      "productId": "prod_456",
      "countedQuantity": 500
    }
  ],
  "countedBy": "emp_jane"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "cycleCount": {
      "id": "count_xyz123"
    },
    "itemsCounted": 2,
    "discrepancies": [
      {
        "productId": "prod_123",
        "expectedQuantity": 250,
        "countedQuantity": 248,
        "difference": -2,
        "variance": 0.8
      }
    ],
    "adjustments": [
      {
        "id": "adj_abc1",
        "productId": "prod_123",
        "difference": -2
      }
    ],
    "accuracy": 99.2
  },
  "message": "Cycle count completed with 99.2% accuracy"
}
```

---

### Fleet Management

#### 10. Get Fleet Status

**Endpoint**: `GET /api/logistics/fleet/status`

**Purpose**: Fleet status, vehicle analytics, and utilization

**Authentication**: Required (JWT + `logistics:view` scope)

**Response**:

```json
{
  "success": true,
  "data": {
    "vehicles": [
      {
        "id": "veh_abc123",
        "type": "semi_truck",
        "licensePlate": "ABC123",
        "status": "active",
        "capacity": 20000,
        "fuelType": "diesel",
        "currentLocation": {
          "lat": 39.7392,
          "lng": -104.9903
        },
        "driver": {
          "id": "drv_john",
          "name": "John Smith"
        },
        "currentShipment": {
          "id": "ship_xyz",
          "trackingNumber": "IFEXYZ789"
        },
        "mileage": 125000,
        "nextMaintenanceDate": "2026-02-01T00:00:00Z",
        "maintenanceDue": false
      }
    ],
    "analytics": {
      "total": 50,
      "active": 32,
      "idle": 15,
      "maintenance": 2,
      "outOfService": 1,
      "utilization": 64,
      "totalCapacity": 850000,
      "averageAge": 3.5,
      "maintenanceDue": 5
    },
    "byType": {
      "semi_truck": {
        "count": 20,
        "totalCapacity": 400000
      },
      "box_truck": {
        "count": 30,
        "totalCapacity": 450000
      }
    }
  }
}
```

---

#### 11. Schedule Maintenance

**Endpoint**: `POST /api/logistics/fleet/maintenance`

**Purpose**: Schedule vehicle maintenance

**Authentication**: Required (JWT + `logistics:fleet` scope)

**Request Body**:

```json
{
  "vehicleId": "veh_abc123",
  "maintenanceType": "oil_change",
  "scheduledDate": "2026-02-15T10:00:00Z",
  "description": "Regular oil change and filter replacement",
  "estimatedCost": 250.0,
  "priority": "routine"
}
```

---

#### 12. Optimize Fleet

**Endpoint**: `POST /api/logistics/fleet/optimize`

**Purpose**: Optimize fleet deployment for pending shipments

**Authentication**: Required (JWT + `logistics:fleet` scope)

**Request Body**:

```json
{
  "shipments": [
    {
      "id": "ship_1",
      "cargoWeight": 1500,
      "cargoVolume": 3.5
    },
    {
      "id": "ship_2",
      "cargoWeight": 2000,
      "cargoVolume": 4.0
    }
  ]
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "assignments": [
      {
        "shipmentId": "ship_1",
        "vehicleId": "veh_abc123",
        "driverId": "drv_john",
        "score": 87.5,
        "reason": "Best capacity and location match"
      }
    ],
    "utilizationRate": 85,
    "unassigned": 1
  },
  "message": "Optimized deployment for 1 shipments"
}
```

---

### Load Optimization

#### 13. Consolidate Loads

**Endpoint**: `POST /api/logistics/load/consolidate`

**Purpose**: Optimize load consolidation for cost savings

**Authentication**: Required (JWT + `logistics:optimize` scope)

**Request Body**:

```json
{
  "shipments": [
    {
      "id": "ship_1",
      "cargoWeight": 1000,
      "cargoVolume": 2.5,
      "destination": { "lat": 34.0522, "lng": -118.2437 },
      "distance": 100
    },
    {
      "id": "ship_2",
      "cargoWeight": 1500,
      "cargoVolume": 3.0,
      "destination": { "lat": 34.0522, "lng": -118.2437 },
      "distance": 100
    }
  ]
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "consolidations": [
      {
        "corridor": "corridor_3_-11",
        "shipments": ["ship_1", "ship_2"],
        "vehicleId": "veh_abc123",
        "totalWeight": 2500,
        "totalVolume": 5.5,
        "utilization": {
          "weight": 62.5,
          "volume": 55.0
        },
        "cost": 175.0,
        "savings": 125.0,
        "savingsPercentage": 41.67
      }
    ],
    "totalSavings": 125.0,
    "shipmentsConsolidated": 2
  },
  "message": "Identified $125.00 in potential savings"
}
```

---

#### 14. Distribute Load

**Endpoint**: `POST /api/logistics/load/distribute`

**Purpose**: Calculate optimal load distribution across vehicles

**Authentication**: Required (JWT + `logistics:optimize` scope)

**Request Body**:

```json
{
  "items": [
    { "weight": 1000 },
    { "weight": 800 },
    { "weight": 1200 },
    { "weight": 500 }
  ],
  "vehicleCapacity": 2000
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "bins": [
      {
        "items": [{ "weight": 1000 }, { "weight": 800 }],
        "currentWeight": 1800,
        "utilization": 90
      },
      {
        "items": [{ "weight": 1200 }],
        "currentWeight": 1200,
        "utilization": 60
      },
      {
        "items": [{ "weight": 500 }],
        "currentWeight": 500,
        "utilization": 25
      }
    ],
    "vehiclesNeeded": 3,
    "averageUtilization": 58.33
  },
  "message": "Load distributed across 3 vehicle(s)"
}
```

---

### Supply Chain Analytics

#### 15. Get Analytics

**Endpoint**: `GET /api/logistics/analytics`

**Purpose**: Comprehensive supply chain analytics and insights

**Authentication**: Required (JWT + `logistics:view` scope)

**Query Parameters**:

- `timeRange` (optional): Days to analyze (default: 30)

**Response**:

```json
{
  "success": true,
  "data": {
    "timeRange": 30,
    "shipmentAnalytics": {
      "total": 1250,
      "delivered": 1180,
      "inTransit": 58,
      "delayed": 12,
      "onTimeRate": 94.2,
      "averageDeliveryTime": 48.5
    },
    "warehouseMetrics": {
      "totalReceivings": 450,
      "totalShipments": 580,
      "averageProcessingTime": 2.5,
      "accuracyRate": 98.3
    },
    "fleetMetrics": {
      "totalMileage": 125000,
      "fuelEfficiency": 8.2,
      "maintenanceCost": 45000,
      "utilizationRate": 82
    },
    "costAnalysis": {
      "totalShippingCost": 425000,
      "warehouseCost": 125000,
      "fleetCost": 185000,
      "laborCost": 220000,
      "totalCost": 955000,
      "revenueGenerated": 1450000,
      "profitMargin": 34.1
    },
    "bottlenecks": [
      {
        "area": "warehouse",
        "issue": "Picking delays during peak hours",
        "impact": "medium",
        "recommendation": "Add 2 more pickers during 2-4 PM"
      }
    ],
    "recommendations": [
      {
        "type": "delivery_improvement",
        "priority": "high",
        "title": "Improve On-Time Delivery Rate",
        "description": "Current rate is 94.2%. Consider route optimization."
      }
    ],
    "generatedAt": "2026-01-14T10:30:00Z"
  }
}
```

---

## 🗄️ Database Schema

### Key Models

**Shipment Events** - Track all shipment lifecycle events

**Warehouses** - Distribution centers, fulfillment centers, storage facilities

**Warehouse Zones** - Storage zones within warehouses (receiving, shipping, staging)

**Inventory** - Multi-warehouse inventory with location tracking

**Inventory Movements** - All inventory transactions (receiving, picking, transfers)

**Inventory Transfers** - Inter-warehouse transfers

**Cycle Counts** - Periodic inventory audits

**Pick Lists** - Optimized picking operations

**Vehicle Maintenance** - Maintenance scheduling and tracking

**Orders** - Customer orders for warehouse fulfillment

**Products** - Product master data with SKU, dimensions, weight

**Performance Metrics** - Historical KPIs and analytics

**Supply Chain Alerts** - Real-time alerts for critical events

---

## 🔌 Integration Guide

### Step 1: Database Setup

```bash
cd api
pnpm prisma:migrate:dev --name add_logistics_system
pnpm prisma:generate
```

### Step 2: Register Routes

```javascript
// api/src/server.js
const logisticsRoutes = require("./routes/logistics");
app.use("/api/logistics", logisticsRoutes);
```

### Step 3: Use Service

```javascript
const { LogisticsService } = require("./services/logisticsService");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const logistics = new LogisticsService(prisma);

// Create shipment
const shipment = await logistics.createShipment({
  customerId: "cust_123",
  origin: { address: "...", lat: 40.7128, lng: -74.006 },
  destination: { address: "...", lat: 34.0522, lng: -118.2437 },
  cargo: { type: "palletized", weight: 500, volume: 2.5 },
  priority: "standard",
});
```

---

## 💻 Code Examples

### Example 1: Create and Track Shipment

```javascript
const axios = require("axios");

// Create shipment
const createShipment = async () => {
  const response = await axios.post(
    "https://api.infamous-freight.com/api/logistics/shipments",
    {
      customerId: "cust_123",
      origin: {
        address: "123 Main St, New York, NY",
        lat: 40.7128,
        lng: -74.006,
      },
      destination: {
        address: "456 Oak Ave, Los Angeles, CA",
        lat: 34.0522,
        lng: -118.2437,
      },
      cargo: {
        type: "palletized",
        weight: 500,
        volume: 2.5,
      },
      priority: "standard",
    },
    {
      headers: {
        Authorization: `Bearer ${JWT_TOKEN}`,
        "Content-Type": "application/json",
      },
    },
  );

  console.log("Tracking Number:", response.data.data.tracking.trackingNumber);
  return response.data.data.tracking.trackingNumber;
};

// Track shipment
const trackShipment = async (trackingNumber) => {
  const response = await axios.get(
    `https://api.infamous-freight.com/api/logistics/shipments/track/${trackingNumber}`,
  );

  const tracking = response.data.data;
  console.log(`Status: ${tracking.shipment.status}`);
  console.log(`Progress: ${tracking.progress}%`);
  console.log(`ETA: ${tracking.eta.estimatedArrival}`);
  console.log(`Current Location: ${tracking.currentLocation.address}`);
};
```

### Example 2: Warehouse Receiving

```javascript
const receiveGoods = async () => {
  const response = await axios.post(
    "https://api.infamous-freight.com/api/logistics/warehouses/receive",
    {
      warehouseId: "wh_nyc01",
      shipmentId: "ship_abc123",
      items: [
        { productId: "prod_123", quantity: 50, unitValue: 45.0 },
        { productId: "prod_456", quantity: 100, unitValue: 25.0 },
      ],
      receivedBy: "emp_john",
      condition: "good",
    },
    {
      headers: {
        Authorization: `Bearer ${JWT_TOKEN}`,
      },
    },
  );

  console.log(response.data.message);
};
```

### Example 3: Inventory Management

```javascript
// Get inventory report
const getInventoryReport = async () => {
  const response = await axios.get(
    "https://api.infamous-freight.com/api/logistics/inventory",
    {
      params: {
        warehouseId: "wh_nyc01",
        lowStock: true,
      },
      headers: {
        Authorization: `Bearer ${JWT_TOKEN}`,
      },
    },
  );

  const report = response.data.data;
  console.log(`Total Items: ${report.analytics.totalItems}`);
  console.log(`Low Stock Items: ${report.analytics.lowStockCount}`);

  report.reorderNeeded.forEach((item) => {
    console.log(`\nReorder Needed: ${item.productName}`);
    console.log(`  Current: ${item.currentQuantity}`);
    console.log(`  Reorder: ${item.reorderQuantity}`);
    console.log(`  Urgency: ${item.urgency}`);
  });
};

// Transfer inventory
const transferInventory = async () => {
  await axios.post(
    "https://api.infamous-freight.com/api/logistics/inventory/transfer",
    {
      productId: "prod_123",
      fromWarehouseId: "wh_nyc01",
      toWarehouseId: "wh_la01",
      quantity: 100,
      reason: "rebalancing",
      requestedBy: "mgr_john",
    },
    {
      headers: {
        Authorization: `Bearer ${JWT_TOKEN}`,
      },
    },
  );
};
```

---

## 🧪 Testing

### Run Tests

```bash
cd api
pnpm test logisticsService.test.js
```

### Test Coverage

- **Shipment Management**: 5 test cases
- **Warehouse Management**: 4 test cases
- **Inventory Management**: 5 test cases
- **Fleet Management**: 4 test cases
- **Load Optimization**: 2 test cases
- **Supply Chain Analytics**: 3 test cases
- **Helper Methods**: 3 test cases

**Total: 26 comprehensive test cases**

---

## 📚 Best Practices

### 1. Always Validate Shipment Data

```javascript
if (!cargo.weight || cargo.weight <= 0) {
  throw new Error("Invalid cargo weight");
}
```

### 2. Track All Inventory Movements

```javascript
await service.createInventoryMovement({
  warehouseId,
  productId,
  movementType: "picking",
  quantity,
  fromLocation: "A1",
  toLocation: "shipping_dock",
});
```

### 3. Optimize Pick Routes

```javascript
const pickList = await service.pickItems({
  warehouseId,
  orderId,
  items,
  pickerId,
});

// Use optimized route
console.log("Optimized sequence:", pickList.optimizedRoute.sequence);
```

### 4. Monitor Fleet Maintenance

```javascript
const fleet = await service.getFleetStatus();

// Schedule maintenance for overdue vehicles
fleet.vehicles
  .filter((v) => v.maintenanceDue)
  .forEach(async (v) => {
    await service.scheduleMaintenance({
      vehicleId: v.id,
      maintenanceType: "inspection",
      scheduledDate: new Date(),
    });
  });
```

### 5. Regular Cycle Counts

```javascript
// Perform weekly cycle counts
const result = await service.cycleCount({
  warehouseId,
  zone: "A1",
  items: inventoryItems,
  countedBy: "emp_jane",
});

console.log(`Accuracy: ${result.accuracy}%`);
```

---

## 🔧 Troubleshooting

### Issue: Shipment Not Tracking

**Cause**: Invalid tracking number

**Solution**:

```javascript
// Verify tracking number format
if (!/^IFE[A-Z0-9]+$/.test(trackingNumber)) {
  throw new Error("Invalid tracking number format");
}
```

### Issue: Inventory Discrepancies

**Cause**: Missing cycle counts or incorrect movements

**Solution**:

```javascript
// Perform cycle count
await service.cycleCount({
  warehouseId,
  items: suspectItems,
  countedBy: "supervisor",
});
```

### Issue: Low Fleet Utilization

**Cause**: Suboptimal deployment

**Solution**:

```javascript
// Use fleet optimization
const optimized = await service.optimizeFleetDeployment(pendingShipments);

// Apply recommendations
optimized.assignments.forEach(async (assignment) => {
  await assignShipmentToVehicle(assignment);
});
```

---

## 📊 Performance Metrics

### Key KPIs

1. **On-Time Delivery Rate**: Target > 95%
2. **Inventory Accuracy**: Target > 99%
3. **Warehouse Efficiency**: Target < 24 hours processing
4. **Fleet Utilization**: Target > 80%
5. **Cost per Mile**: Target < $1.50

### Monitoring

```javascript
const analytics = await service.getSupplyChainAnalytics(30);

console.log("On-Time Rate:", analytics.shipmentAnalytics.onTimeRate);
console.log("Fleet Utilization:", analytics.fleetMetrics.utilizationRate);
console.log("Profit Margin:", analytics.costAnalysis.profitMargin);
```

---

## 🚀 Future Enhancements

- **Machine Learning**: Predictive analytics for demand forecasting
- **IoT Integration**: Real-time sensor data for temperature, humidity
- **Blockchain**: Immutable shipment records
- **Drone Delivery**: Last-mile delivery optimization
- **Augmented Reality**: Warehouse picking assistance

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Status**: ✅ Production Ready

---

## Quick Reference

### JWT Scopes Required

- `logistics:create` - Create shipments
- `logistics:view` - View all data
- `logistics:update` - Update shipments
- `logistics:warehouse` - Warehouse operations
- `logistics:fleet` - Fleet management
- `logistics:optimize` - Load optimization

### Rate Limits

- General requests: 100 per 15 minutes

### Response Codes

- `200` - Success
- `201` - Created
- `400` - Invalid input
- `401` - Unauthorized
- `403` - Insufficient scope
- `404` - Not found
- `500` - Server error
