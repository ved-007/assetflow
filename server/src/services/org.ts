import { prisma } from '../lib/prisma';
import { Role } from '@prisma/client';

export async function getDepartments() {
  return prisma.department.findMany({ include: { head: true, parent: true } });
}

export async function createDepartment(data: { name: string; headId?: number; parentId?: number }) {
  return prisma.department.create({ data });
}

export async function updateDepartment(id: number, data: { name?: string; headId?: number; parentId?: number }) {
  return prisma.department.update({ where: { id }, data });
}

export async function getCategories() {
  return prisma.assetCategory.findMany();
}

export async function createCategory(data: { name: string }) {
  return prisma.assetCategory.create({ data });
}

export async function updateCategory(id: number, data: { name?: string }) {
  return prisma.assetCategory.update({ where: { id }, data });
}

export async function getEmployees() {
  return prisma.user.findMany({ 
    select: { id: true, name: true, email: true, role: true, status: true, department: true }
  });
}

export async function updateEmployeeRole(id: number, role: 'ADMIN' | 'ASSET_MANAGER' | 'DEPT_HEAD' | 'EMPLOYEE') {
  return prisma.user.update({
    where: { id },
    data: { role: role as Role },
    select: { id: true, name: true, role: true }
  });
}
