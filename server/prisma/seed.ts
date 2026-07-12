import { PrismaClient, Role, AssetStatus, MaintenancePriority, MaintenanceStatus, BookingStatus, AuditItemResult } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PASSWORD = 'Password123!';

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function assetTag(id: number): string {
  return `AF-${String(id).padStart(4, '0')}`;
}

async function main() {
  console.log('Seeding AssetFlow demo data...');
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // --- Departments (created without heads first, headId set after users exist) ---
  const engineering = await prisma.department.create({ data: { name: 'Engineering' } });
  const sales = await prisma.department.create({ data: { name: 'Sales' } });
  const hr = await prisma.department.create({ data: { name: 'HR' } });
  const operations = await prisma.department.create({ data: { name: 'Operations' } });

  // --- Categories ---
  const catLaptops = await prisma.assetCategory.create({ data: { name: 'Laptops' } });
  const catVehicles = await prisma.assetCategory.create({ data: { name: 'Vehicles' } });
  const catFurniture = await prisma.assetCategory.create({ data: { name: 'Furniture' } });
  const catRooms = await prisma.assetCategory.create({ data: { name: 'Meeting Rooms' } });
  const catPeripherals = await prisma.assetCategory.create({ data: { name: 'Peripherals' } });

  // --- Users: 1 admin, 1 asset manager, 2 dept heads, 4 employees ---
  const admin = await prisma.user.create({
    data: { name: 'Aditi Admin', email: 'admin@assetflow.com', passwordHash, role: Role.ADMIN },
  });
  const assetManager = await prisma.user.create({
    data: { name: 'Manav Manager', email: 'manager@assetflow.com', passwordHash, role: Role.ASSET_MANAGER, departmentId: operations.id },
  });
  const deptHeadEng = await prisma.user.create({
    data: { name: 'Devika Deshpande', email: 'depthead.eng@assetflow.com', passwordHash, role: Role.DEPT_HEAD, departmentId: engineering.id },
  });
  const deptHeadSales = await prisma.user.create({
    data: { name: 'Rohan Rao', email: 'depthead.sales@assetflow.com', passwordHash, role: Role.DEPT_HEAD, departmentId: sales.id },
  });
  const emp1 = await prisma.user.create({
    data: { name: 'Priya Patel', email: 'priya@assetflow.com', passwordHash, role: Role.EMPLOYEE, departmentId: engineering.id },
  });
  const emp2 = await prisma.user.create({
    data: { name: 'Karan Kapoor', email: 'karan@assetflow.com', passwordHash, role: Role.EMPLOYEE, departmentId: engineering.id },
  });
  const emp3 = await prisma.user.create({
    data: { name: 'Sneha Shah', email: 'sneha@assetflow.com', passwordHash, role: Role.EMPLOYEE, departmentId: sales.id },
  });
  const emp4 = await prisma.user.create({
    data: { name: 'Vikram Verma', email: 'vikram@assetflow.com', passwordHash, role: Role.EMPLOYEE, departmentId: hr.id },
  });

  await prisma.department.update({ where: { id: engineering.id }, data: { headId: deptHeadEng.id } });
  await prisma.department.update({ where: { id: sales.id }, data: { headId: deptHeadSales.id } });

  // --- Assets (~18, spread across categories/statuses) ---
  // Created with a temp tag then updated, matching registerAsset's real behavior.
  type AssetSeed = {
    name: string;
    categoryId: number;
    serialNumber?: string;
    location?: string;
    isBookable?: boolean;
    status?: AssetStatus;
    condition?: string;
    acquisitionCost?: number;
  };

  const assetSeeds: AssetSeed[] = [
    { name: 'MacBook Pro 16"', categoryId: catLaptops.id, serialNumber: 'MBP-001', location: 'Bengaluru HQ', acquisitionCost: 220000, condition: 'Excellent' },
    { name: 'Dell XPS 15', categoryId: catLaptops.id, serialNumber: 'DXP-002', location: 'Bengaluru HQ', acquisitionCost: 140000, condition: 'Good' },
    { name: 'ThinkPad X1 Carbon', categoryId: catLaptops.id, serialNumber: 'TPX-003', location: 'Pune Office', acquisitionCost: 150000, condition: 'Good' },
    { name: 'MacBook Air M3', categoryId: catLaptops.id, serialNumber: 'MBA-004', location: 'Bengaluru HQ', acquisitionCost: 130000, condition: 'Excellent' },
    { name: 'HP EliteBook 840', categoryId: catLaptops.id, serialNumber: 'HPE-005', location: 'Pune Office', acquisitionCost: 95000, condition: 'Fair' },
    { name: 'Toyota Innova Crysta', categoryId: catVehicles.id, serialNumber: 'VEH-006', location: 'Bengaluru HQ', acquisitionCost: 1900000, condition: 'Good', isBookable: true },
    { name: 'Maruti Suzuki Ertiga', categoryId: catVehicles.id, serialNumber: 'VEH-007', location: 'Bengaluru HQ', acquisitionCost: 1200000, condition: 'Good', isBookable: true },
    { name: 'Honda City', categoryId: catVehicles.id, serialNumber: 'VEH-008', location: 'Pune Office', acquisitionCost: 1400000, condition: 'Excellent', isBookable: true },
    { name: 'Standing Desk', categoryId: catFurniture.id, serialNumber: 'FUR-009', location: 'Bengaluru HQ', acquisitionCost: 18000, condition: 'Good' },
    { name: 'Ergonomic Chair', categoryId: catFurniture.id, serialNumber: 'FUR-010', location: 'Bengaluru HQ', acquisitionCost: 12000, condition: 'Good' },
    { name: 'Conference Table', categoryId: catFurniture.id, serialNumber: 'FUR-011', location: 'Pune Office', acquisitionCost: 45000, condition: 'Good' },
    { name: 'Boardroom A', categoryId: catRooms.id, serialNumber: 'ROOM-012', location: 'Bengaluru HQ, Floor 3', acquisitionCost: 0, condition: 'Excellent', isBookable: true },
    { name: 'Huddle Room B', categoryId: catRooms.id, serialNumber: 'ROOM-013', location: 'Bengaluru HQ, Floor 2', acquisitionCost: 0, condition: 'Good', isBookable: true },
    { name: 'Training Room C', categoryId: catRooms.id, serialNumber: 'ROOM-014', location: 'Pune Office, Floor 1', acquisitionCost: 0, condition: 'Good', isBookable: true },
    { name: '27" Dell Monitor', categoryId: catPeripherals.id, serialNumber: 'MON-015', location: 'Bengaluru HQ', acquisitionCost: 22000, condition: 'Good' },
    { name: 'Logitech MX Keys Combo', categoryId: catPeripherals.id, serialNumber: 'PER-016', location: 'Bengaluru HQ', acquisitionCost: 8000, condition: 'Excellent' },
    { name: 'HP LaserJet Printer', categoryId: catPeripherals.id, serialNumber: 'PER-017', location: 'Pune Office', acquisitionCost: 25000, condition: 'Fair' },
    { name: 'Epson Projector', categoryId: catPeripherals.id, serialNumber: 'PER-018', location: 'Bengaluru HQ, Floor 3', acquisitionCost: 60000, condition: 'Good' },
  ];

  const assets = [];
  for (const seed of assetSeeds) {
    const created = await prisma.asset.create({
      data: {
        name: seed.name,
        categoryId: seed.categoryId,
        serialNumber: seed.serialNumber,
        acquisitionDate: daysFromNow(-365),
        acquisitionCost: seed.acquisitionCost,
        condition: seed.condition,
        location: seed.location,
        isBookable: seed.isBookable ?? false,
        assetTag: 'TMP',
        status: AssetStatus.AVAILABLE,
      },
    });
    const updated = await prisma.asset.update({
      where: { id: created.id },
      data: { assetTag: assetTag(created.id) },
    });
    assets.push(updated);
  }

  const [
    macbookPro, dellXps, thinkpad, macbookAir, hpElitebook,
    innova, ertiga, hondaCity,
    standingDesk, ergoChair, confTable,
    boardroomA, huddleB, trainingC,
    monitor, keyboardCombo, printer, projector,
  ] = assets;

  // --- Allocations: active, overdue, and returned (history) ---
  // Active: MacBook Pro -> Priya (this is the one to demo the double-allocation 409 against)
  const activeAlloc1 = await prisma.allocation.create({
    data: {
      assetId: macbookPro.id,
      employeeId: emp1.id,
      departmentId: emp1.departmentId,
      allocatedAt: daysFromNow(-20),
      expectedReturnDate: daysFromNow(10),
    },
  });
  await prisma.asset.update({ where: { id: macbookPro.id }, data: { status: AssetStatus.ALLOCATED } });

  // Active + overdue: ThinkPad -> Karan, expected return in the past
  await prisma.allocation.create({
    data: {
      assetId: thinkpad.id,
      employeeId: emp2.id,
      departmentId: emp2.departmentId,
      allocatedAt: daysFromNow(-45),
      expectedReturnDate: daysFromNow(-5),
    },
  });
  await prisma.asset.update({ where: { id: thinkpad.id }, data: { status: AssetStatus.ALLOCATED } });

  // Active: Dell XPS -> Sneha
  await prisma.allocation.create({
    data: {
      assetId: dellXps.id,
      employeeId: emp3.id,
      departmentId: emp3.departmentId,
      allocatedAt: daysFromNow(-3),
      expectedReturnDate: daysFromNow(27),
    },
  });
  await prisma.asset.update({ where: { id: dellXps.id }, data: { status: AssetStatus.ALLOCATED } });

  // Returned (history): MacBook Air was allocated to Vikram, returned last week
  await prisma.allocation.create({
    data: {
      assetId: macbookAir.id,
      employeeId: emp4.id,
      departmentId: emp4.departmentId,
      allocatedAt: daysFromNow(-60),
      expectedReturnDate: daysFromNow(-30),
      returnedAt: daysFromNow(-7),
      checkinCondition: 'Good',
      checkinNotes: 'Minor scuff on lid, fully functional.',
    },
  });
  // status stays AVAILABLE (already returned)

  // --- Bookings: a couple upcoming + one deliberately clashing pair to demo overlap 409 ---
  await prisma.booking.create({
    data: {
      assetId: innova.id,
      bookedById: emp3.id,
      startTime: new Date(new Date().setHours(14, 0, 0, 0) + 86400000), // tomorrow 2pm
      endTime: new Date(new Date().setHours(16, 0, 0, 0) + 86400000), // tomorrow 4pm
      purpose: 'Client site visit',
      status: BookingStatus.UPCOMING,
    },
  });
  // NOTE: a second booking request for `innova` tomorrow 3-5pm will collide with the one above (409 demo).

  await prisma.booking.create({
    data: {
      assetId: boardroomA.id,
      bookedById: deptHeadEng.id,
      startTime: new Date(new Date().setHours(10, 0, 0, 0) + 86400000),
      endTime: new Date(new Date().setHours(11, 0, 0, 0) + 86400000),
      purpose: 'Sprint planning',
      status: BookingStatus.UPCOMING,
    },
  });

  await prisma.booking.create({
    data: {
      assetId: huddleB.id,
      bookedById: emp1.id,
      startTime: new Date(new Date().setHours(15, 0, 0, 0) + 2 * 86400000),
      endTime: new Date(new Date().setHours(15, 30, 0, 0) + 2 * 86400000),
      purpose: '1:1 sync',
      status: BookingStatus.UPCOMING,
    },
  });

  // --- Maintenance: mixed statuses ---
  await prisma.maintenanceRequest.create({
    data: {
      assetId: printer.id,
      raisedById: emp4.id,
      description: 'Paper jam, prints streaky pages.',
      priority: MaintenancePriority.MEDIUM,
      status: MaintenanceStatus.PENDING,
    },
  });

  const approvedMaint = await prisma.maintenanceRequest.create({
    data: {
      assetId: hpElitebook.id,
      raisedById: emp2.id,
      description: 'Battery drains within an hour, needs replacement.',
      priority: MaintenancePriority.HIGH,
      status: MaintenanceStatus.APPROVED,
      approvedById: assetManager.id,
    },
  });
  await prisma.asset.update({ where: { id: hpElitebook.id }, data: { status: AssetStatus.UNDER_MAINTENANCE } });

  await prisma.maintenanceRequest.create({
    data: {
      assetId: ergoChair.id,
      raisedById: emp1.id,
      description: 'Gas lift no longer holds height.',
      priority: MaintenancePriority.LOW,
      status: MaintenanceStatus.RESOLVED,
      approvedById: assetManager.id,
      technicianName: 'FixIt Facilities Co.',
      resolvedAt: daysFromNow(-2),
    },
  });

  // --- Audit cycle: one OPEN cycle scoped to Engineering, with a couple of results already marked ---
  const engineeringAssetIds = [macbookPro, thinkpad, monitor, keyboardCombo, projector]
    .map((a) => a.id);

  const auditCycle = await prisma.auditCycle.create({
    data: {
      name: 'Q3 Engineering Asset Audit',
      departmentId: engineering.id,
      location: 'Bengaluru HQ',
      startDate: daysFromNow(-2),
      endDate: daysFromNow(12),
      createdById: admin.id,
      assignments: {
        create: [{ auditorId: deptHeadEng.id }, { auditorId: assetManager.id }],
      },
      items: {
        create: engineeringAssetIds.map((assetId) => ({ assetId })),
      },
    },
    include: { items: true },
  });

  // Mark a couple of items to make the discrepancy report non-empty
  const itemForMonitor = auditCycle.items.find((i) => i.assetId === monitor.id);
  const itemForProjector = auditCycle.items.find((i) => i.assetId === projector.id);
  if (itemForMonitor) {
    await prisma.auditItem.update({
      where: { id: itemForMonitor.id },
      data: { result: AuditItemResult.VERIFIED, checkedById: deptHeadEng.id, checkedAt: new Date() },
    });
  }
  if (itemForProjector) {
    await prisma.auditItem.update({
      where: { id: itemForProjector.id },
      data: { result: AuditItemResult.MISSING, notes: 'Not in storage room, last seen in Boardroom A.', checkedById: assetManager.id, checkedAt: new Date() },
    });
  }

  console.log('Seed complete.');
  console.log('--- Login credentials (all use password: Password123!) ---');
  console.log(`Admin:            admin@assetflow.com`);
  console.log(`Asset Manager:    manager@assetflow.com`);
  console.log(`Dept Head (Eng):  depthead.eng@assetflow.com`);
  console.log(`Dept Head (Sales):depthead.sales@assetflow.com`);
  console.log(`Employees:        priya@assetflow.com / karan@assetflow.com / sneha@assetflow.com / vikram@assetflow.com`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
