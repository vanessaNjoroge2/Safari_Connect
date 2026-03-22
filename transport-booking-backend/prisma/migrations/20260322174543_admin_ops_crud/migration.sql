-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'ESCALATED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "SupportTicketCategory" AS ENUM ('BOOKING', 'PAYMENT', 'DISPUTE', 'APP_BUG', 'GENERAL');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationTargetRole" AS ENUM ('ADMIN', 'OWNER', 'USER', 'ALL');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HelpArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "PlatformSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "commissionRate" INTEGER NOT NULL DEFAULT 5,
    "minimumFare" INTEGER NOT NULL DEFAULT 50,
    "aiPricing" BOOLEAN NOT NULL DEFAULT true,
    "fraudBlockThreshold" INTEGER NOT NULL DEFAULT 80,
    "delayRiskAlert" TEXT NOT NULL DEFAULT 'medium',
    "voiceLanguages" TEXT NOT NULL DEFAULT 'en-sw',
    "smsBooking" BOOLEAN NOT NULL DEFAULT true,
    "emailTicket" BOOLEAN NOT NULL DEFAULT true,
    "pushDeparture" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "saccoRevenueReport" BOOLEAN NOT NULL DEFAULT false,
    "adminFraudAlert" BOOLEAN NOT NULL DEFAULT true,
    "sessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 60,
    "maxFailedLogins" INTEGER NOT NULL DEFAULT 5,
    "require2fa" BOOLEAN NOT NULL DEFAULT true,
    "version" TEXT NOT NULL DEFAULT '3.0.0',
    "environment" TEXT NOT NULL DEFAULT 'Production',
    "build" TEXT NOT NULL DEFAULT '20260319',
    "apiStatus" TEXT NOT NULL DEFAULT 'Operational',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "ticketCode" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "category" "SupportTicketCategory" NOT NULL,
    "priority" "SupportTicketPriority" NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "assignedTo" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminNotification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "targetRole" "NotificationTargetRole" NOT NULL DEFAULT 'ALL',
    "status" "NotificationStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "HelpArticleStatus" NOT NULL DEFAULT 'PUBLISHED',
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HelpArticle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_ticketCode_key" ON "SupportTicket"("ticketCode");

-- CreateIndex
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");

-- CreateIndex
CREATE INDEX "SupportTicket_category_idx" ON "SupportTicket"("category");

-- CreateIndex
CREATE INDEX "SupportTicket_priority_idx" ON "SupportTicket"("priority");

-- CreateIndex
CREATE INDEX "SupportTicket_createdAt_idx" ON "SupportTicket"("createdAt");

-- CreateIndex
CREATE INDEX "AdminNotification_status_idx" ON "AdminNotification"("status");

-- CreateIndex
CREATE INDEX "AdminNotification_channel_idx" ON "AdminNotification"("channel");

-- CreateIndex
CREATE INDEX "AdminNotification_targetRole_idx" ON "AdminNotification"("targetRole");

-- CreateIndex
CREATE INDEX "AdminNotification_createdAt_idx" ON "AdminNotification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HelpArticle_slug_key" ON "HelpArticle"("slug");

-- CreateIndex
CREATE INDEX "HelpArticle_status_idx" ON "HelpArticle"("status");

-- CreateIndex
CREATE INDEX "HelpArticle_category_idx" ON "HelpArticle"("category");

-- CreateIndex
CREATE INDEX "HelpArticle_createdAt_idx" ON "HelpArticle"("createdAt");
