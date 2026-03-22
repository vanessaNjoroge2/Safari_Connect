import { prisma } from "../../config/prisma.js";

function toUiNotificationChannel(channel) {
  if (channel === "IN_APP") return "In App";
  const lower = String(channel || "").toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function toUiNotificationStatus(status) {
  const lower = String(status || "").toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function toRoleTarget(role) {
  if (role === "OWNER") return "OWNER";
  return "USER";
}

export async function getPortalNotifications(user, query = {}) {
  const q = String(query.q || "").trim();
  const limit = Math.min(Math.max(Number(query.limit || 100), 1), 300);
  const roleTarget = toRoleTarget(user?.role);

  const rows = await prisma.adminNotification.findMany({
    where: {
      status: "SENT",
      targetRole: { in: [roleTarget, "ALL"] },
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { message: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    message: row.message,
    channel: toUiNotificationChannel(row.channel),
    targetRole: row.targetRole,
    status: toUiNotificationStatus(row.status),
    scheduledFor: row.scheduledFor,
    sentAt: row.sentAt,
    createdAt: row.createdAt,
  }));
}

export async function getPortalHelpArticles(query = {}) {
  const q = String(query.q || "").trim();
  const category = String(query.category || "").trim();
  const limit = Math.min(Math.max(Number(query.limit || 100), 1), 300);

  return prisma.helpArticle.findMany({
    where: {
      status: "PUBLISHED",
      ...(category ? { category: { contains: category, mode: "insensitive" } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { category: { contains: q, mode: "insensitive" } },
              { content: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}
