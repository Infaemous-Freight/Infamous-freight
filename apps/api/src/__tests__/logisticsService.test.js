const { LogisticsService } = require('../services/logisticsService');

describe('LogisticsService', () => {
    let service;
    let mockPrisma;

    beforeEach(() => {
        mockPrisma = {
            shipment: {
                create: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
                update: jest.fn(),
            },
            warehouse: {
                findUnique: jest.fn(),
                findMany: jest.fn(),
            },
            inventory: {
                findMany: jest.fn(),
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                upsert: jest.fn(),
            },
            vehicle: {
                findMany: jest.fn(),
                findUnique: jest.fn(),
                update: jest.fn(),
            },
            shipmentEvent: {
                create: jest.fn(),
            },
            warehouseReceiving: {
                create: jest.fn(),
            },
            pickList: {
                create: jest.fn(),
            },
            inventoryMovement: {
                create: jest.fn(),
            },
            inventoryReservation: {
                create: jest.fn(),
            },
            inventoryTransfer: {
                create: jest.fn(),
            },
            inventoryAdjustment: {
                create: jest.fn(),
            },
            cycleCount: {
                create: jest.fn(),
            },
            vehicleMaintenance: {
                create: jest.fn(),
            },
        };

        service = new LogisticsService(mockPrisma);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Shipment Management', () => {
        it('should create a new shipment with routing and assignment', async () => {
            const shipmentData = {
                customerId: 'cust_123',
                origin: {
                    address: '123 Main St, New York, NY',
                    lat: 40.7128,
                    lng: -74.0060,
                },
                destination: {
                    address: '456 Oak Ave, Los Angeles, CA',
                    lat: 34.0522,
                    lng: -118.2437,
                },
                cargo: {
                    type: 'palletized',
                    weight: 500,
                    volume: 2.5,
                },
                priority: 'standard',
            };

            mockPrisma.shipment.create.mockResolvedValue({
                id: 'ship_123',
                trackingNumber: 'IFE123ABC',
                ...shipmentData,
            });

            const result = await service.createShipment(shipmentData);

            expect(result).toHaveProperty('shipment');
            expect(result).toHaveProperty('route');
            expect(result).toHaveProperty('assignment');
            expect(result).toHaveProperty('tracking');
            expect(result.tracking.trackingNumber).toMatch(/^IFE/);
            expect(mockPrisma.shipment.create).toHaveBeenCalled();
        });

        it('should track shipment with real-time location', async () => {
            mockPrisma.shipment.findUnique.mockResolvedValue({
                id: 'ship_123',
                trackingNumber: 'IFE123ABC',
                status: 'in_transit',
                originLatitude: 40.7128,
                originLongitude: -74.0060,
                destinationLatitude: 34.0522,
                destinationLongitude: -118.2437,
                driver: { name: 'John Doe', phone: '555-0100', rating: 4.8 },
                vehicle: { type: 'box_truck', licensePlate: 'ABC123', capacity: 5000 },
                events: [],
            });

            const tracking = await service.trackShipment('IFE123ABC');

            expect(tracking).toHaveProperty('shipment');
            expect(tracking).toHaveProperty('currentLocation');
            expect(tracking).toHaveProperty('eta');
            expect(tracking).toHaveProperty('progress');
            expect(tracking).toHaveProperty('timeline');
            expect(tracking.driver).toBeDefined();
            expect(tracking.vehicle).toBeDefined();
        });

        it('should update shipment status and send notifications', async () => {
            mockPrisma.shipment.update.mockResolvedValue({
                id: 'ship_123',
                status: 'delivered',
            });

            mockPrisma.shipmentEvent.create.mockResolvedValue({
                id: 'event_123',
                eventType: 'delivered',
            });

            const result = await service.updateShipmentStatus(
                'ship_123',
                'delivered',
                { lat: 34.0522, lng: -118.2437 },
                'Package delivered successfully'
            );

            expect(result.status).toBe('delivered');
            expect(mockPrisma.shipment.update).toHaveBeenCalled();
            expect(mockPrisma.shipmentEvent.create).toHaveBeenCalled();
        });

        it('should generate unique tracking numbers', () => {
            const trackingNumber1 = service.generateTrackingNumber();
            const trackingNumber2 = service.generateTrackingNumber();

            expect(trackingNumber1).toMatch(/^IFE/);
            expect(trackingNumber2).toMatch(/^IFE/);
            expect(trackingNumber1).not.toBe(trackingNumber2);
        });

        it('should calculate shipment progress correctly', () => {
            const shipment = {
                originLatitude: 40.7128,
                originLongitude: -74.0060,
                destinationLatitude: 34.0522,
                destinationLongitude: -118.2437,
            };

            const currentLocation = {
                lat: 37.7749, // San Francisco (roughly midway)
                lng: -96.0,
            };

            const progress = service.calculateProgress(shipment, currentLocation);

            expect(progress).toBeGreaterThan(0);
            expect(progress).toBeLessThanOrEqual(100);
        });
    });

    describe('Warehouse Management', () => {
        it('should get comprehensive warehouse status', async () => {
            mockPrisma.warehouse.findUnique.mockResolvedValue({
                id: 'wh_123',
                name: 'Main Distribution Center',
                location: { city: 'New York' },
                type: 'distribution_center',
                totalArea: 10000,
                storageCapacity: 50000,
                inventory: [
                    {
                        productId: 'prod_1',
                        quantity: 100,
                        unitValue: 50,
                        reorderPoint: 20,
                        product: { name: 'Product 1' },
                    },
                ],
                zones: [
                    { id: 'zone_1', name: 'A1', type: 'storage', capacity: 1000, utilization: 75 },
                ],
                equipment: [],
            });

            const status = await service.getWarehouseStatus('wh_123');

            expect(status).toHaveProperty('warehouse');
            expect(status).toHaveProperty('capacity');
            expect(status).toHaveProperty('inventory');
            expect(status).toHaveProperty('shipments');
            expect(status).toHaveProperty('zones');
            expect(status).toHaveProperty('metrics');
            expect(status.capacity.utilization).toBeDefined();
        });

        it('should receive incoming goods and update inventory', async () => {
            const receivingData = {
                warehouseId: 'wh_123',
                shipmentId: 'ship_123',
                items: [
                    { productId: 'prod_1', quantity: 50, unitValue: 25 },
                    { productId: 'prod_2', quantity: 100, unitValue: 15 },
                ],
                receivedBy: 'emp_123',
                condition: 'good',
            };

            mockPrisma.warehouse.findUnique.mockResolvedValue({
                id: 'wh_123',
                name: 'Main Warehouse',
                location: { city: 'New York' },
            });

            mockPrisma.warehouseReceiving.create.mockResolvedValue({
                id: 'rec_123',
            });

            mockPrisma.inventory.upsert.mockResolvedValue({
                id: 'inv_123',
                quantity: 150,
            });

            const result = await service.receiveGoods(receivingData);

            expect(result).toHaveProperty('receiving');
            expect(result).toHaveProperty('inventoryUpdates');
            expect(result).toHaveProperty('message');
            expect(mockPrisma.warehouseReceiving.create).toHaveBeenCalled();
            expect(mockPrisma.inventory.upsert).toHaveBeenCalledTimes(2);
        });

        it('should create pick list with optimized route', async () => {
            const pickData = {
                warehouseId: 'wh_123',
                orderId: 'ord_123',
                items: [
                    { productId: 'prod_1', quantity: 5, location: 'A1' },
                    { productId: 'prod_2', quantity: 10, location: 'B2' },
                ],
                pickerId: 'emp_123',
            };

            mockPrisma.warehouse.findUnique.mockResolvedValue({
                id: 'wh_123',
                name: 'Main Warehouse',
            });

            mockPrisma.pickList.create.mockResolvedValue({
                id: 'pick_123',
                status: 'in_progress',
            });

            mockPrisma.inventory.findUnique
                .mockResolvedValueOnce({ quantity: 100 })
                .mockResolvedValueOnce({ quantity: 200 });

            mockPrisma.inventoryReservation.create.mockResolvedValue({
                id: 'res_123',
            });

            mockPrisma.inventory.update.mockResolvedValue({ quantity: 95 });

            const result = await service.pickItems(pickData);

            expect(result).toHaveProperty('pickList');
            expect(result).toHaveProperty('optimizedRoute');
            expect(result).toHaveProperty('reservations');
            expect(result).toHaveProperty('estimatedPickTime');
            expect(result.optimizedRoute.sequence).toBeDefined();
        });

        it('should throw error when picking insufficient inventory', async () => {
            mockPrisma.warehouse.findUnique.mockResolvedValue({
                id: 'wh_123',
                name: 'Main Warehouse',
            });

            mockPrisma.pickList.create.mockResolvedValue({ id: 'pick_123' });

            mockPrisma.inventory.findUnique.mockResolvedValue({ quantity: 5 });

            await expect(
                service.pickItems({
                    warehouseId: 'wh_123',
                    orderId: 'ord_123',
                    items: [{ productId: 'prod_1', quantity: 10 }],
                    pickerId: 'emp_123',
                })
            ).rejects.toThrow('Insufficient inventory');
        });
    });

    describe('Inventory Management', () => {
        it('should generate comprehensive inventory report', async () => {
            mockPrisma.inventory.findMany.mockResolvedValue([
                {
                    id: 'inv_1',
                    warehouseId: 'wh_123',
                    productId: 'prod_1',
                    quantity: 50,
                    unitValue: 25,
                    reorderPoint: 20,
                    warehouse: { name: 'Main Warehouse' },
                    product: { name: 'Product 1', sku: 'SKU001', category: 'electronics' },
                },
                {
                    id: 'inv_2',
                    warehouseId: 'wh_123',
                    productId: 'prod_2',
                    quantity: 5,
                    unitValue: 15,
                    reorderPoint: 20,
                    warehouse: { name: 'Main Warehouse' },
                    product: { name: 'Product 2', sku: 'SKU002', category: 'electronics' },
                },
            ]);

            const report = await service.getInventoryReport();

            expect(report).toHaveProperty('inventory');
            expect(report).toHaveProperty('analytics');
            expect(report).toHaveProperty('byCategory');
            expect(report).toHaveProperty('reorderNeeded');
            expect(report.analytics.totalItems).toBe(2);
            expect(report.analytics.lowStockCount).toBeGreaterThan(0);
            expect(report.reorderNeeded.length).toBeGreaterThan(0);
        });

        it('should transfer inventory between warehouses', async () => {
            const transferData = {
                productId: 'prod_1',
                fromWarehouseId: 'wh_123',
                toWarehouseId: 'wh_456',
                quantity: 50,
                reason: 'rebalancing',
                requestedBy: 'user_123',
            };

            mockPrisma.inventory.findUnique.mockResolvedValue({
                quantity: 100,
            });

            mockPrisma.inventoryTransfer.create.mockResolvedValue({
                id: 'transfer_123',
                status: 'pending',
            });

            mockPrisma.inventory.update.mockResolvedValue({
                quantity: 50,
            });

            mockPrisma.inventoryMovement.create.mockResolvedValue({
                id: 'move_123',
            });

            const result = await service.transferInventory(transferData);

            expect(result).toHaveProperty('transfer');
            expect(result).toHaveProperty('message');
            expect(mockPrisma.inventoryTransfer.create).toHaveBeenCalled();
            expect(mockPrisma.inventory.update).toHaveBeenCalled();
        });

        it('should perform cycle count and identify discrepancies', async () => {
            const cycleCountData = {
                warehouseId: 'wh_123',
                zone: 'A1',
                items: [
                    { productId: 'prod_1', countedQuantity: 48 },
                    { productId: 'prod_2', countedQuantity: 100 },
                ],
                countedBy: 'emp_123',
            };

            mockPrisma.cycleCount.create.mockResolvedValue({
                id: 'count_123',
            });

            mockPrisma.inventory.findUnique
                .mockResolvedValueOnce({ quantity: 50 })
                .mockResolvedValueOnce({ quantity: 100 });

            mockPrisma.inventoryAdjustment.create.mockResolvedValue({
                id: 'adj_123',
            });

            mockPrisma.inventory.update.mockResolvedValue({ quantity: 48 });

            const result = await service.cycleCount(cycleCountData);

            expect(result).toHaveProperty('cycleCount');
            expect(result).toHaveProperty('itemsCounted');
            expect(result).toHaveProperty('discrepancies');
            expect(result).toHaveProperty('adjustments');
            expect(result).toHaveProperty('accuracy');
            expect(result.discrepancies.length).toBeGreaterThan(0);
            expect(result.accuracy).toBeGreaterThan(0);
        });

        it('should filter low stock items', async () => {
            mockPrisma.inventory.findMany.mockResolvedValue([
                {
                    quantity: 5,
                    reorderPoint: 20,
                    unitValue: 25,
                    warehouse: { name: 'Main' },
                    product: { name: 'Product 1', sku: 'SKU001' },
                },
            ]);

            const report = await service.getInventoryReport({ lowStock: true });

            expect(report.inventory.length).toBeGreaterThan(0);
            report.inventory.forEach(item => {
                expect(item.quantity).toBeLessThanOrEqual(item.reorderPoint);
            });
        });
    });

    describe('Fleet Management', () => {
        it('should get fleet status and analytics', async () => {
            mockPrisma.vehicle.findMany.mockResolvedValue([
                {
                    id: 'veh_1',
                    type: 'box_truck',
                    licensePlate: 'ABC123',
                    status: 'active',
                    capacity: 5000,
                    fuelType: 'diesel',
                    currentLocation: { lat: 40.7128, lng: -74.0060 },
                    driver: { id: 'drv_1', name: 'John Doe' },
                    currentShipment: null,
                    mileage: 50000,
                    nextMaintenanceDate: new Date('2026-02-01'),
                    year: 2022,
                    maintenanceRecords: [],
                },
                {
                    id: 'veh_2',
                    type: 'semi_truck',
                    licensePlate: 'XYZ789',
                    status: 'idle',
                    capacity: 20000,
                    fuelType: 'diesel',
                    year: 2020,
                    maintenanceRecords: [],
                },
            ]);

            const status = await service.getFleetStatus();

            expect(status).toHaveProperty('vehicles');
            expect(status).toHaveProperty('analytics');
            expect(status).toHaveProperty('byType');
            expect(status.analytics.total).toBe(2);
            expect(status.analytics.active).toBeGreaterThan(0);
            expect(status.analytics.utilization).toBeDefined();
        });

        it('should schedule vehicle maintenance', async () => {
            const maintenanceData = {
                vehicleId: 'veh_123',
                maintenanceType: 'oil_change',
                scheduledDate: '2026-02-15T10:00:00Z',
                description: 'Regular oil change',
                estimatedCost: 150,
                priority: 'routine',
            };

            mockPrisma.vehicle.findUnique.mockResolvedValue({
                id: 'veh_123',
                type: 'box_truck',
            });

            mockPrisma.vehicleMaintenance.create.mockResolvedValue({
                id: 'maint_123',
                ...maintenanceData,
            });

            const result = await service.scheduleMaintenance(maintenanceData);

            expect(result).toHaveProperty('id');
            expect(result.maintenanceType).toBe('oil_change');
            expect(mockPrisma.vehicleMaintenance.create).toHaveBeenCalled();
        });

        it('should optimize fleet deployment', async () => {
            const shipments = [
                {
                    id: 'ship_1',
                    cargoWeight: 1000,
                    cargoVolume: 2,
                    origin: { lat: 40.7128, lng: -74.0060 },
                },
                {
                    id: 'ship_2',
                    cargoWeight: 2000,
                    cargoVolume: 4,
                    origin: { lat: 40.7128, lng: -74.0060 },
                },
            ];

            mockPrisma.vehicle.findMany.mockResolvedValue([
                {
                    id: 'veh_1',
                    capacity: 5000,
                    volumeCapacity: 10,
                    status: 'idle',
                    driver: { id: 'drv_1' },
                },
                {
                    id: 'veh_2',
                    capacity: 10000,
                    volumeCapacity: 20,
                    status: 'idle',
                    driver: { id: 'drv_2' },
                },
            ]);

            const result = await service.optimizeFleetDeployment(shipments);

            expect(result).toHaveProperty('assignments');
            expect(result).toHaveProperty('utilizationRate');
            expect(result).toHaveProperty('unassigned');
            expect(result.assignments.length).toBeGreaterThan(0);
        });

        it('should calculate fleet utilization correctly', () => {
            const vehicles = [
                { status: 'active' },
                { status: 'active' },
                { status: 'idle' },
                { status: 'idle' },
            ];

            const utilization = service.calculateFleetUtilization(vehicles);

            expect(utilization).toBe(50);
        });
    });

    describe('Load Optimization', () => {
        it('should optimize load consolidation', async () => {
            const shipments = [
                {
                    id: 'ship_1',
                    cargoWeight: 1000,
                    cargoVolume: 2,
                    destination: { lat: 34.0522, lng: -118.2437 },
                    distance: 100,
                },
                {
                    id: 'ship_2',
                    cargoWeight: 1500,
                    cargoVolume: 3,
                    destination: { lat: 34.0522, lng: -118.2437 },
                    distance: 100,
                },
            ];

            mockPrisma.vehicle.findFirst.mockResolvedValue({
                id: 'veh_1',
                capacity: 5000,
                volumeCapacity: 10,
            });

            const result = await service.optimizeLoadConsolidation(shipments);

            expect(result).toHaveProperty('consolidations');
            expect(result).toHaveProperty('totalSavings');
            expect(result).toHaveProperty('shipmentsConsolidated');
            expect(result.consolidations.length).toBeGreaterThan(0);
        });

        it('should calculate load distribution across vehicles', () => {
            const items = [
                { weight: 1000 },
                { weight: 800 },
                { weight: 1200 },
                { weight: 500 },
            ];

            const vehicleCapacity = 2000;

            const result = service.calculateLoadDistribution(items, vehicleCapacity);

            expect(result).toHaveProperty('bins');
            expect(result).toHaveProperty('vehiclesNeeded');
            expect(result).toHaveProperty('averageUtilization');
            expect(result.vehiclesNeeded).toBeGreaterThan(0);
            expect(result.averageUtilization).toBeGreaterThan(0);
        });
    });

    describe('Supply Chain Analytics', () => {
        it('should generate comprehensive analytics', async () => {
            mockPrisma.shipment.findMany.mockResolvedValue([
                {
                    createdAt: new Date(),
                    status: 'delivered',
                    deliveredAt: new Date(),
                    estimatedDeliveryTime: new Date(),
                },
            ]);

            const analytics = await service.getSupplyChainAnalytics(30);

            expect(analytics).toHaveProperty('timeRange');
            expect(analytics).toHaveProperty('shipmentAnalytics');
            expect(analytics).toHaveProperty('warehouseMetrics');
            expect(analytics).toHaveProperty('fleetMetrics');
            expect(analytics).toHaveProperty('costAnalysis');
            expect(analytics).toHaveProperty('bottlenecks');
            expect(analytics).toHaveProperty('recommendations');
        });

        it('should identify bottlenecks', async () => {
            const bottlenecks = await service.identifyBottlenecks();

            expect(Array.isArray(bottlenecks)).toBe(true);
            bottlenecks.forEach(bottleneck => {
                expect(bottleneck).toHaveProperty('area');
                expect(bottleneck).toHaveProperty('issue');
                expect(bottleneck).toHaveProperty('impact');
                expect(bottleneck).toHaveProperty('recommendation');
            });
        });

        it('should generate supply chain recommendations', () => {
            const data = {
                shipmentAnalytics: { onTimeRate: 85 },
                fleetMetrics: { utilizationRate: 75 },
                warehouseMetrics: {},
                costAnalysis: {},
                bottlenecks: [],
            };

            const recommendations = service.generateSupplyChainRecommendations(data);

            expect(Array.isArray(recommendations)).toBe(true);
            expect(recommendations.length).toBeGreaterThan(0);
            recommendations.forEach(rec => {
                expect(rec).toHaveProperty('type');
                expect(rec).toHaveProperty('priority');
                expect(rec).toHaveProperty('title');
                expect(rec).toHaveProperty('description');
            });
        });
    });

    describe('Helper Methods', () => {
        it('should calculate distance correctly', () => {
            const point1 = { lat: 40.7128, lng: -74.0060 }; // New York
            const point2 = { lat: 34.0522, lng: -118.2437 }; // Los Angeles

            const distance = service.calculateDistance(point1, point2);

            expect(distance).toBeGreaterThan(3900);
            expect(distance).toBeLessThan(4100);
        });

        it('should estimate pick time correctly', () => {
            const items = [
                { productId: 'prod_1', quantity: 5 },
                { productId: 'prod_2', quantity: 10 },
            ];

            const route = { estimatedDistance: 200 };

            const estimatedTime = service.estimatePickTime(items, route);

            expect(estimatedTime).toBeGreaterThan(0);
        });

        it('should group inventory by category', () => {
            const inventory = [
                {
                    product: { category: 'electronics' },
                    quantity: 100,
                    unitValue: 50,
                },
                {
                    product: { category: 'electronics' },
                    quantity: 50,
                    unitValue: 25,
                },
                {
                    product: { category: 'furniture' },
                    quantity: 20,
                    unitValue: 200,
                },
            ];

            const grouped = service.groupInventoryByCategory(inventory);

            expect(grouped).toHaveProperty('electronics');
            expect(grouped).toHaveProperty('furniture');
            expect(grouped.electronics.count).toBe(2);
            expect(grouped.furniture.count).toBe(1);
        });
    });
});
