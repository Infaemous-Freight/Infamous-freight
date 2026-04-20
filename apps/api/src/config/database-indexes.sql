-- INFAMOUS FREIGHT - Database Performance Indexes
-- Run these against your PostgreSQL database after Prisma migrations

-- Core lookup indexes
CREATE INDEX IF NOT EXISTS idx_loads_status ON loads(status) WHERE status IN ('available', 'in_transit', 'delivered');
CREATE INDEX IF NOT EXISTS idx_loads_pickup_date ON loads(pickupDate);
CREATE INDEX IF NOT EXISTS idx_loads_delivery_date ON loads(deliveryDate);
CREATE INDEX IF NOT EXISTS idx_loads_broker_id ON loads(brokerId);
CREATE INDEX IF NOT EXISTS idx_loads_created_at ON loads(createdAt DESC);

-- Geospatial indexes for lane matching (if using PostGIS)
CREATE INDEX IF NOT EXISTS idx_loads_origin ON loads USING gist(originLat, originLng);
CREATE INDEX IF NOT EXISTS idx_loads_destination ON loads USING gist(destLat, destLng);

-- Driver indexes
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status) WHERE status = 'available';
CREATE INDEX IF NOT EXISTS idx_drivers_current_lat_lng ON drivers(currentLat, currentLng) WHERE status = 'available';
CREATE INDEX IF NOT EXISTS idx_drivers_hos_status ON drivers(hosStatus);

-- Shipper/Broker indexes
CREATE INDEX IF NOT EXISTS idx_shippers_credit_tier ON shippers(creditTier);
CREATE INDEX IF NOT EXISTS idx_shippers_active ON shippers(isActive) WHERE isActive = true;

-- Document indexes
CREATE INDEX IF NOT EXISTS idx_documents_load_id ON documents(loadId);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entityType, entityId);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(userId);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(userId, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(createdAt DESC);

-- Auction/Bid indexes
CREATE INDEX IF NOT EXISTS idx_bids_load_id ON bids(loadId);
CREATE INDEX IF NOT EXISTS idx_bids_driver_id ON bids(driverId);
CREATE INDEX IF NOT EXISTS idx_bids_amount ON bids(amount ASC);

-- Payment indexes
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_id ON payments(stripePaymentIntentId);

-- Rate negotiation indexes
CREATE INDEX IF NOT EXISTS idx_rate_negotiations_load ON rate_negotiations(loadId);
CREATE INDEX IF NOT EXISTS idx_rate_negotiations_status ON rate_negotiations(status);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_loads_origin_destination ON loads(originCity, destCity);
CREATE INDEX IF NOT EXISTS idx_loads_equipment_weight ON loads(equipmentType, weight);

-- Partial indexes for hot paths
CREATE INDEX IF NOT EXISTS idx_available_loads ON loads(status, equipmentType, pickupDate) WHERE status = 'available';
CREATE INDEX IF NOT EXISTS idx_active_drivers ON drivers(status, currentLat, currentLng, hosStatus) WHERE status = 'available';

-- Full-text search (if needed)
CREATE INDEX IF NOT EXISTS idx_loads_shipper_name ON loads USING gin(to_tsvector('english', shipperName));

-- Cleanup old data (run monthly via cron)
-- DELETE FROM audit_logs WHERE createdAt < NOW() - INTERVAL '90 days';
-- DELETE FROM notifications WHERE createdAt < NOW() - INTERVAL '30 days' AND read = true;
