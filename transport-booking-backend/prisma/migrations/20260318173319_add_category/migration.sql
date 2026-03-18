/*
  Warnings:

  - You are about to drop the column `ownerProfileId` on the `Bus` table. All the data in the column will be lost.
  - You are about to drop the column `saccoName` on the `OwnerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `ownerProfileId` on the `Trip` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[bookingCode]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tripId,seatId]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[plateNumber]` on the table `Bus` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bookingId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transactionRef]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[checkoutRequestId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[merchantRequestId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `amount` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bookingCode` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nationalId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seatId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tripId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plateNumber` to the `Bus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `saccoId` to the `Bus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seatCapacity` to the `Bus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Bus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amount` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bookingId` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneNumber` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `arrivalTime` to the `Trip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `basePrice` to the `Trip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `busId` to the `Trip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departureTime` to the `Trip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `routeId` to the `Trip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `saccoId` to the `Trip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Trip` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TripType" AS ENUM ('ONE_WAY', 'ROUND_TRIP');

-- CreateEnum
CREATE TYPE "SeatClass" AS ENUM ('BUSINESS', 'FIRST_CLASS', 'VIP');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('SCHEDULED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('MPESA', 'CASH', 'CARD');

-- DropForeignKey
ALTER TABLE "Bus" DROP CONSTRAINT "Bus_ownerProfileId_fkey";

-- DropForeignKey
ALTER TABLE "Trip" DROP CONSTRAINT "Trip_ownerProfileId_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "amount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "bookingCode" TEXT NOT NULL,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "nationalId" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "residence" TEXT,
ADD COLUMN     "seatId" TEXT NOT NULL,
ADD COLUMN     "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "tripId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Bus" DROP COLUMN "ownerProfileId",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "plateNumber" TEXT NOT NULL,
ADD COLUMN     "saccoId" TEXT NOT NULL,
ADD COLUMN     "seatCapacity" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "OwnerProfile" DROP COLUMN "saccoName";

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "amount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "bookingId" TEXT NOT NULL,
ADD COLUMN     "checkoutRequestId" TEXT,
ADD COLUMN     "merchantRequestId" TEXT,
ADD COLUMN     "method" "PaymentMethod" NOT NULL DEFAULT 'MPESA',
ADD COLUMN     "phoneNumber" TEXT NOT NULL,
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "transactionRef" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Trip" DROP COLUMN "ownerProfileId",
ADD COLUMN     "arrivalTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "basePrice" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "busId" TEXT NOT NULL,
ADD COLUMN     "departureTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "routeId" TEXT NOT NULL,
ADD COLUMN     "saccoId" TEXT NOT NULL,
ADD COLUMN     "status" "TripStatus" NOT NULL DEFAULT 'SCHEDULED',
ADD COLUMN     "tripType" "TripType" NOT NULL DEFAULT 'ONE_WAY',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sacco" (
    "id" TEXT NOT NULL,
    "ownerProfileId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "supportPhone" TEXT,
    "supportEmail" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sacco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION,
    "estimatedTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seat" (
    "id" TEXT NOT NULL,
    "busId" TEXT NOT NULL,
    "seatNumber" TEXT NOT NULL,
    "seatClass" "SeatClass" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Seat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Sacco_ownerProfileId_key" ON "Sacco"("ownerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Sacco_slug_key" ON "Sacco"("slug");

-- CreateIndex
CREATE INDEX "Sacco_categoryId_idx" ON "Sacco"("categoryId");

-- CreateIndex
CREATE INDEX "Route_origin_destination_idx" ON "Route"("origin", "destination");

-- CreateIndex
CREATE INDEX "Seat_busId_seatClass_idx" ON "Seat"("busId", "seatClass");

-- CreateIndex
CREATE UNIQUE INDEX "Seat_busId_seatNumber_key" ON "Seat"("busId", "seatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingCode_key" ON "Booking"("bookingCode");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- CreateIndex
CREATE INDEX "Booking_tripId_idx" ON "Booking"("tripId");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_tripId_seatId_key" ON "Booking"("tripId", "seatId");

-- CreateIndex
CREATE UNIQUE INDEX "Bus_plateNumber_key" ON "Bus"("plateNumber");

-- CreateIndex
CREATE INDEX "Bus_saccoId_idx" ON "Bus"("saccoId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_bookingId_key" ON "Payment"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionRef_key" ON "Payment"("transactionRef");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_checkoutRequestId_key" ON "Payment"("checkoutRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_merchantRequestId_key" ON "Payment"("merchantRequestId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Trip_saccoId_idx" ON "Trip"("saccoId");

-- CreateIndex
CREATE INDEX "Trip_busId_idx" ON "Trip"("busId");

-- CreateIndex
CREATE INDEX "Trip_routeId_idx" ON "Trip"("routeId");

-- CreateIndex
CREATE INDEX "Trip_departureTime_idx" ON "Trip"("departureTime");

-- CreateIndex
CREATE INDEX "Trip_status_idx" ON "Trip"("status");

-- AddForeignKey
ALTER TABLE "Sacco" ADD CONSTRAINT "Sacco_ownerProfileId_fkey" FOREIGN KEY ("ownerProfileId") REFERENCES "OwnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sacco" ADD CONSTRAINT "Sacco_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bus" ADD CONSTRAINT "Bus_saccoId_fkey" FOREIGN KEY ("saccoId") REFERENCES "Sacco"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seat" ADD CONSTRAINT "Seat_busId_fkey" FOREIGN KEY ("busId") REFERENCES "Bus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_saccoId_fkey" FOREIGN KEY ("saccoId") REFERENCES "Sacco"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_busId_fkey" FOREIGN KEY ("busId") REFERENCES "Bus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
