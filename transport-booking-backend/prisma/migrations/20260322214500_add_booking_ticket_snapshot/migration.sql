-- Add immutable ticket snapshot payload to bookings
ALTER TABLE "Booking"
ADD COLUMN "ticketSnapshot" JSONB;
