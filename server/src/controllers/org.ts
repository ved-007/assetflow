import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as orgService from '../services/org';

export async function getDepartments(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await orgService.getDepartments();
    res.json({ ok: true, data });
  } catch (err) { next(err); }
}

const deptSchema = z.object({
  name: z.string().min(1),
  headId: z.number().optional(),
  parentId: z.number().optional(),
});

export async function createDepartment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = deptSchema.parse(req.body);
    const result = await orgService.createDepartment(data);
    res.status(201).json({ ok: true, data: result });
  } catch (err) { next(err); }
}

export async function updateDepartment(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const data = deptSchema.partial().parse(req.body);
    const result = await orgService.updateDepartment(id, data);
    res.json({ ok: true, data: result });
  } catch (err) { next(err); }
}

export async function getCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await orgService.getCategories();
    res.json({ ok: true, data });
  } catch (err) { next(err); }
}

const categorySchema = z.object({
  name: z.string().min(1),
});

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const data = categorySchema.parse(req.body);
    const result = await orgService.createCategory(data);
    res.status(201).json({ ok: true, data: result });
  } catch (err) { next(err); }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const data = categorySchema.partial().parse(req.body);
    const result = await orgService.updateCategory(id, data);
    res.json({ ok: true, data: result });
  } catch (err) { next(err); }
}

export async function getEmployees(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await orgService.getEmployees();
    res.json({ ok: true, data });
  } catch (err) { next(err); }
}

const roleSchema = z.object({
  role: z.enum(['ADMIN', 'ASSET_MANAGER', 'DEPT_HEAD', 'EMPLOYEE']),
});

export async function updateEmployeeRole(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const { role } = roleSchema.parse(req.body);
    const result = await orgService.updateEmployeeRole(id, role);
    res.json({ ok: true, data: result });
  } catch (err) { next(err); }
}
