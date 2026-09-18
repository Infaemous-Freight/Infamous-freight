CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_tracking_devices_driver_id ON public.tracking_devices(driver_id);
CREATE INDEX IF NOT EXISTS idx_tracking_devices_vehicle_id ON public.tracking_devices(vehicle_id);
