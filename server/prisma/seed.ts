import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditItem.deleteMany();
  await prisma.auditAssignment.deleteMany();
  await prisma.auditCycle.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.transferRequest.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.assetCategory.deleteMany();
  
  // Resolve circular reference for Department head
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Password123!", 10);

  // 1. Create Departments (initially without heads)
  const hrDept = await prisma.department.create({
    data: { name: "Human Resources" }
  });
  const engDept = await prisma.department.create({
    data: { name: "Engineering" }
  });
  const designDept = await prisma.department.create({
    data: { name: "Design" }
  });
  const opsDept = await prisma.department.create({
    data: { name: "Operations" }
  });

  // 2. Create Users
  const admin = await prisma.user.create({
    data: {
      name: "System Admin",
      email: "admin@assetflow.com",
      passwordHash,
      role: "ADMIN",
      departmentId: opsDept.id,
    }
  });

  const manager = await prisma.user.create({
    data: {
      name: "Asset Manager",
      email: "manager@assetflow.com",
      passwordHash,
      role: "ASSET_MANAGER",
      departmentId: opsDept.id,
    }
  });

  const head1 = await prisma.user.create({
    data: {
      name: "Sarah Connor (Eng Head)",
      email: "depthead1@assetflow.com",
      passwordHash,
      role: "DEPT_HEAD",
      departmentId: engDept.id,
    }
  });

  const head2 = await prisma.user.create({
    data: {
      name: "John Doe (HR Head)",
      email: "depthead2@assetflow.com",
      passwordHash,
      role: "DEPT_HEAD",
      departmentId: hrDept.id,
    }
  });

  const emp1 = await prisma.user.create({
    data: { name: "Alice Smith", email: "employee1@assetflow.com", passwordHash, role: "EMPLOYEE", departmentId: engDept.id }
  });
  const emp2 = await prisma.user.create({
    data: { name: "Bob Jones", email: "employee2@assetflow.com", passwordHash, role: "EMPLOYEE", departmentId: engDept.id }
  });
  const emp3 = await prisma.user.create({
    data: { name: "Charlie Brown", email: "employee3@assetflow.com", passwordHash, role: "EMPLOYEE", departmentId: hrDept.id }
  });
  const emp4 = await prisma.user.create({
    data: { name: "David Miller", email: "employee4@assetflow.com", passwordHash, role: "EMPLOYEE", departmentId: designDept.id }
  });

  // 3. Update Department heads
  await prisma.department.update({
    where: { id: engDept.id },
    data: { headId: head1.id }
  });
  await prisma.department.update({
    where: { id: hrDept.id },
    data: { headId: head2.id }
  });

  // 4. Create Asset Categories
  const laptopsCat = await prisma.assetCategory.create({
    data: { name: "Laptops", customFields: { ram: "string", storage: "string", processor: "string" } }
  });
  const vehiclesCat = await prisma.assetCategory.create({
    data: { name: "Vehicles", customFields: { licensePlate: "string", modelYear: "number" } }
  });
  const roomsCat = await prisma.assetCategory.create({
    data: { name: "Conference Rooms", customFields: { capacity: "number", projecter: "boolean" } }
  });
  const mobileCat = await prisma.assetCategory.create({
    data: { name: "Mobile Devices", customFields: { os: "string", screen: "string" } }
  });
  const furnitureCat = await prisma.assetCategory.create({
    data: { name: "Office Furniture", customFields: { material: "string" } }
  });

  // 5. Create Assets
  const assetsData = [
    { name: "MacBook Pro 16\"", categoryId: laptopsCat.id, tag: "AF-0001", isBookable: false, status: "ALLOCATED" as const },
    { name: "Dell XPS 15", categoryId: laptopsCat.id, tag: "AF-0002", isBookable: false, status: "ALLOCATED" as const },
    { name: "ThinkPad T14", categoryId: laptopsCat.id, tag: "AF-0003", isBookable: false, status: "AVAILABLE" as const },
    { name: "MacBook Air M2", categoryId: laptopsCat.id, tag: "AF-0004", isBookable: false, status: "UNDER_MAINTENANCE" as const },
    { name: "HP EliteBook", categoryId: laptopsCat.id, tag: "AF-0005", isBookable: false, status: "AVAILABLE" as const },
    
    { name: "Company Tesla Model 3", categoryId: vehiclesCat.id, tag: "AF-0006", isBookable: true, status: "RESERVED" as const },
    { name: "Delivery Van", categoryId: vehiclesCat.id, tag: "AF-0007", isBookable: true, status: "AVAILABLE" as const },
    { name: "Ford Transit", categoryId: vehiclesCat.id, tag: "AF-0008", isBookable: true, status: "AVAILABLE" as const },

    { name: "Boardroom A (12 Pax)", categoryId: roomsCat.id, tag: "AF-0009", isBookable: true, status: "AVAILABLE" as const },
    { name: "Meeting Room B (6 Pax)", categoryId: roomsCat.id, tag: "AF-0010", isBookable: true, status: "AVAILABLE" as const },
    { name: "Design Studio (20 Pax)", categoryId: roomsCat.id, tag: "AF-0011", isBookable: true, status: "AVAILABLE" as const },

    { name: "iPhone 15 Pro", categoryId: mobileCat.id, tag: "AF-0012", isBookable: false, status: "ALLOCATED" as const },
    { name: "iPad Pro 12.9\"", categoryId: mobileCat.id, tag: "AF-0013", isBookable: false, status: "AVAILABLE" as const },
    { name: "Samsung Galaxy S24", categoryId: mobileCat.id, tag: "AF-0014", isBookable: false, status: "LOST" as const },

    { name: "Ergonomic Office Chair A", categoryId: furnitureCat.id, tag: "AF-0015", isBookable: false, status: "AVAILABLE" as const },
    { name: "Standing Desk B", categoryId: furnitureCat.id, tag: "AF-0016", isBookable: false, status: "AVAILABLE" as const },
    { name: "Executive Leather Sofa", categoryId: furnitureCat.id, tag: "AF-0017", isBookable: false, status: "RETIRED" as const },
    { name: "Conference Table", categoryId: furnitureCat.id, tag: "AF-0018", isBookable: false, status: "AVAILABLE" as const },
  ];

  const assets: any[] = [];
  for (const item of assetsData) {
    const a = await prisma.asset.create({
      data: {
        assetTag: item.tag,
        name: item.name,
        categoryId: item.categoryId,
        serialNumber: "SN-" + Math.floor(Math.random() * 1000000),
        acquisitionDate: new Date("2025-01-10"),
        acquisitionCost: 120000.00,
        condition: "Excellent",
        location: "Headquarters",
        isBookable: item.isBookable,
        status: item.status,
      }
    });
    assets.push(a);
  }

  // 6. Allocations
  const asset1 = assets.find(a => a.assetTag === "AF-0001");
  await prisma.allocation.create({
    data: {
      assetId: asset1.id,
      employeeId: emp1.id,
      departmentId: engDept.id,
      allocatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      expectedReturnDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    }
  });

  const asset2 = assets.find(a => a.assetTag === "AF-0002");
  await prisma.allocation.create({
    data: {
      assetId: asset2.id,
      employeeId: emp2.id,
      departmentId: engDept.id,
      allocatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      expectedReturnDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    }
  });

  const asset3 = assets.find(a => a.assetTag === "AF-0003");
  await prisma.allocation.create({
    data: {
      assetId: asset3.id,
      employeeId: emp3.id,
      departmentId: hrDept.id,
      allocatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      expectedReturnDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      returnedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      checkinCondition: "Good",
      checkinNotes: "Returned on time",
    }
  });

  const asset12 = assets.find(a => a.assetTag === "AF-0012");
  await prisma.allocation.create({
    data: {
      assetId: asset12.id,
      employeeId: emp4.id,
      departmentId: designDept.id,
      allocatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      expectedReturnDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }
  });

  // 7. Bookings
  const tesla = assets.find(a => a.assetTag === "AF-0006");
  await prisma.booking.create({
    data: {
      assetId: tesla.id,
      bookedById: emp1.id,
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      purpose: "Client visit in other city",
      status: "UPCOMING"
    }
  });

  // 8. Maintenance requests
  const mbAir = assets.find(a => a.assetTag === "AF-0004");
  await prisma.maintenanceRequest.create({
    data: {
      assetId: mbAir.id,
      raisedById: emp2.id,
      description: "Keyboard keys repeating and screen flickering",
      priority: "HIGH",
      status: "APPROVED",
      technicianName: "iStore Service Center",
    }
  });

  // 9. Audit Cycles
  const audit = await prisma.auditCycle.create({
    data: {
      name: "Q3 2026 IT Assets Audit",
      departmentId: engDept.id,
      location: "Headquarters - 4th Floor",
      startDate: new Date(),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: "OPEN",
      createdById: admin.id,
    }
  });

  await prisma.auditAssignment.create({
    data: {
      cycleId: audit.id,
      auditorId: manager.id,
    }
  });

  const engAssets = assets.filter(a => a.categoryId === laptopsCat.id);
  for (const ea of engAssets) {
    await prisma.auditItem.create({
      data: {
        cycleId: audit.id,
        assetId: ea.id,
        result: "PENDING",
      }
    });
  }

  // 10. Activity logs
  await prisma.activityLog.create({
    data: {
      actorId: admin.id,
      action: "REGISTER_ASSET",
      entityType: "ASSET",
      entityId: asset1.id,
      details: { message: "Asset MacBook Pro 16\" registered successfully" }
    }
  });

  // 11. Notifications
  await prisma.notification.create({
    data: {
      userId: emp1.id,
      type: "ALLOCATION",
      title: "New Asset Allocated",
      body: "You have been allocated a MacBook Pro (AF-0001). Please verify details.",
    }
  });

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
