import { prisma } from "../../config/prisma.js";
import { hashPassword, comparePassword } from "../../utils/hash.js";
import { generateToken } from "../../utils/jwt.js";

export const registerUser = async (payload) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    password,
    role = "USER",
  } = payload;

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, ...(phone ? [{ phone }] : [])],
    },
  });

  if (existingUser) {
    throw new Error("User with this email or phone already exists");
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      role,
      ownerProfile:
        role === "OWNER"
          ? {
              create: {},
            }
          : undefined,
    },
    include: {
      ownerProfile: true,
    },
  });

  const token = generateToken({
    userId: user.id,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      ownerProfile: user.ownerProfile,
    },
  };
};

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      ownerProfile: true,
    },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("Account is not active");
  }

  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken({
    userId: user.id,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      ownerProfile: user.ownerProfile,
    },
  };
};

export const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      ownerProfile: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    ownerProfile: user.ownerProfile,
  };
};

export const updateCurrentUser = async (userId, payload) => {
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { ownerProfile: true },
  });

  if (!currentUser) {
    throw new Error("User not found");
  }

  const firstName = payload.firstName?.trim();
  const lastName = payload.lastName?.trim();
  const email = payload.email?.trim().toLowerCase();
  const phone = payload.phone?.trim();

  if (email || phone) {
    const conflictingUser = await prisma.user.findFirst({
      where: {
        id: { not: userId },
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (conflictingUser) {
      throw new Error("Email or phone is already in use");
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(firstName ? { firstName } : {}),
      ...(lastName ? { lastName } : {}),
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
    },
    include: { ownerProfile: true },
  });

  return {
    id: updated.id,
    firstName: updated.firstName,
    lastName: updated.lastName,
    email: updated.email,
    phone: updated.phone,
    role: updated.role,
    status: updated.status,
    ownerProfile: updated.ownerProfile,
  };
};

export const changeCurrentUserPassword = async (userId, payload) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new Error("User not found");
  }

  const validCurrentPassword = await comparePassword(payload.currentPassword, user.password);
  if (!validCurrentPassword) {
    throw new Error("Current password is incorrect");
  }

  const hashedNewPassword = await hashPassword(payload.newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword },
  });

  return true;
};