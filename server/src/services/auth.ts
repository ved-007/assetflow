import bcrypt from "bcrypt";
import type { Prisma, users as DbUser, users_role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { signToken } from "../lib/jwt";
import { AppError } from "../lib/AppError";

const SALT_ROUNDS = 10;

type AuthUser = {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: "ADMIN" | "ASSET_MANAGER" | "DEPT_HEAD" | "EMPLOYEE";
  departmentId: string | null;
};

function mapRole(role: users_role): AuthUser["role"] {
  switch (role) {
    case "Admin":
      return "ADMIN";
    case "Manager":
      return "ASSET_MANAGER";
    case "Employee":
      return "EMPLOYEE";
  }
}

function toAuthUser(user: DbUser): AuthUser {
  return {
    id: user.user_id,
    name: user.full_name,
    email: user.email,
    passwordHash: user.password,
    role: mapRole(user.role),
    departmentId: user.department ?? null,
  };
}

export async function signup(name: string, email: string, password: string) {
  const existing = await prisma.users.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.users.create({
    data: {
      full_name: name,
      email,
      password: passwordHash,
      role: "Employee",
      department: null,
    },
  });

  const mappedUser = toAuthUser(user);
  const token = signToken({
    id: mappedUser.id,
    role: mappedUser.role,
    departmentId: mappedUser.departmentId,
  });

  return { token, user: mappedUser };
}

export async function login(email: string, password: string) {
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new AppError(401, "Invalid email or password");
  }

  const mappedUser = toAuthUser(user);
  const token = signToken({
    id: mappedUser.id,
    role: mappedUser.role,
    departmentId: mappedUser.departmentId,
  });

  return { token, user: mappedUser };
}

export async function getMe(userId: number) {
  const user = await prisma.users.findUnique({ where: { user_id: userId } });
  if (!user) {
    throw new AppError(404, "User not found");
  }
  return toAuthUser(user);
}
