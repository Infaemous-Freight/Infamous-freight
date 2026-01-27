/*
 * Lightweight Database Layer - In-Memory with JSON Persistence
 * Used for Week 2 implementation without external database dependencies
 */

const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data.json');

/**
 * Database class with JSON file persistence
 */
class Database {
    constructor() {
        this.shipments = [];
        this.users = [];
        this.load();
    }

    /**
     * Load data from JSON file
     */
    load() {
        try {
            if (fs.existsSync(DB_FILE)) {
                const data = fs.readFileSync(DB_FILE, 'utf8');
                const parsed = JSON.parse(data);
                this.shipments = parsed.shipments || [];
                this.users = parsed.users || [];
                console.log(`✅ Loaded ${this.shipments.length} shipments from database`);
            } else {
                this.seed();
            }
        } catch (err) {
            console.error('Error loading database:', err.message);
            this.seed();
        }
    }

    /**
     * Save data to JSON file
     */
    save() {
        try {
            const data = {
                shipments: this.shipments,
                users: this.users,
                lastSaved: new Date().toISOString(),
            };
            fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        } catch (err) {
            console.error('Error saving database:', err.message);
        }
    }

    /**
     * Seed initial data
     */
    seed() {
        console.log('🌱 Seeding initial data...');

        // Create default user
        this.users = [
            {
                id: 'user-123',
                email: 'admin@example.com',
                password: 'hashed_password',
                role: 'admin',
                createdAt: new Date().toISOString(),
            },
        ];

        // Create initial shipments
        this.shipments = [
            {
                id: 1,
                trackingNumber: 'IFE-001',
                status: 'IN_TRANSIT',
                origin: 'Los Angeles',
                destination: 'New York',
                weight: 150,
                value: 5000,
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 86400000).toISOString(),
                createdBy: 'user-123',
            },
            {
                id: 2,
                trackingNumber: 'IFE-002',
                status: 'DELIVERED',
                origin: 'Chicago',
                destination: 'Miami',
                weight: 200,
                value: 7500,
                createdAt: new Date(Date.now() - 172800000).toISOString(),
                updatedAt: new Date(Date.now() - 3600000).toISOString(),
                createdBy: 'user-123',
            },
            {
                id: 3,
                trackingNumber: 'IFE-003',
                status: 'PENDING',
                origin: 'Seattle',
                destination: 'Boston',
                weight: 100,
                value: 3000,
                createdAt: new Date(Date.now() - 7200000).toISOString(),
                updatedAt: new Date(Date.now() - 7200000).toISOString(),
                createdBy: 'user-123',
            },
        ];

        this.save();
        console.log(`✅ Seeded ${this.shipments.length} shipments`);
    }

    /**
     * Get all shipments with filtering and pagination
     */
    getShipments(options = {}) {
        const {
            page = 1,
            limit = 10,
            status,
            search,
            sortBy = 'createdAt',
            order = 'desc',
        } = options;

        let filtered = this.shipments;

        // Filter by status
        if (status) {
            filtered = filtered.filter(s => s.status === status);
        }

        // Filter by search term
        if (search) {
            const term = search.toLowerCase();
            filtered = filtered.filter(s =>
                s.trackingNumber.toLowerCase().includes(term) ||
                s.origin.toLowerCase().includes(term) ||
                s.destination.toLowerCase().includes(term)
            );
        }

        // Sort
        filtered.sort((a, b) => {
            const aVal = a[sortBy];
            const bVal = b[sortBy];
            const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            return order === 'desc' ? -comparison : comparison;
        });

        // Paginate
        const total = filtered.length;
        const skip = (page - 1) * limit;
        const paginated = filtered.slice(skip, skip + limit);

        return {
            data: paginated,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get single shipment by ID
     */
    getShipment(id) {
        return this.shipments.find(s => s.id === parseInt(id));
    }

    /**
     * Create new shipment
     */
    createShipment(data) {
        // Check if tracking number exists
        if (this.shipments.some(s => s.trackingNumber === data.trackingNumber)) {
            throw new Error('Tracking number already exists');
        }

        const newShipment = {
            id: Math.max(0, ...this.shipments.map(s => s.id)) + 1,
            trackingNumber: data.trackingNumber,
            status: data.status || 'PENDING',
            origin: data.origin,
            destination: data.destination,
            weight: data.weight || 0,
            value: data.value || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: data.createdBy,
        };

        this.shipments.push(newShipment);
        this.save();
        return newShipment;
    }

    /**
     * Update shipment
     */
    updateShipment(id, data) {
        const shipment = this.getShipment(id);
        if (!shipment) {
            throw new Error('Shipment not found');
        }

        Object.assign(shipment, data, {
            updatedAt: new Date().toISOString(),
        });

        this.save();
        return shipment;
    }

    /**
     * Delete shipment
     */
    deleteShipment(id) {
        const index = this.shipments.findIndex(s => s.id === parseInt(id));
        if (index === -1) {
            return null; // Return null if not found instead of throwing
        }

        const deleted = this.shipments.splice(index, 1)[0];
        this.save();
        return deleted;
    }

    /**
     * Get database statistics
     */
    stats() {
        const statuses = {};
        this.shipments.forEach(s => {
            statuses[s.status] = (statuses[s.status] || 0) + 1;
        });

        return {
            totalShipments: this.shipments.length,
            totalUsers: this.users.length,
            byStatus: statuses,
            lastSaved: fs.existsSync(DB_FILE) ?
                fs.statSync(DB_FILE).mtime.toISOString() : null,
        };
    }

    /**
     * Clear all data (for testing)
     */
    clear() {
        this.shipments = [];
        this.users = [];
        this.save();
    }

    /**
     * Export data as JSON
     */
    export() {
        return {
            shipments: this.shipments,
            users: this.users,
            stats: this.stats(),
        };
    }

    /**
     * Import data from JSON
     */
    import(data) {
        if (data.shipments) this.shipments = data.shipments;
        if (data.users) this.users = data.users;
        this.save();
    }
}

// Create and export singleton instance
const db = new Database();

module.exports = db;
