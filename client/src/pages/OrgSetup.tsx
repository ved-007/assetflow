import React, { useState } from "react";
import { 
  Building2, 
  Users, 
  Tags,
  Plus,
  PlusCircle,
  X
} from "lucide-react";

interface Department {
  id: number;
  name: string;
  headName: string;
  status: "Active" | "Inactive";
}

interface Category {
  id: number;
  name: string;
  prefix: string;
  fieldCount: number;
  status: "Active" | "Inactive";
}

interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
  status: "Active" | "Inactive";
}

export const OrgSetup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"departments" | "categories" | "employees">("departments");
  const [showAddModal, setShowAddModal] = useState(false);

  // Core organization list states
  const [departments, setDepartments] = useState<Department[]>([
    { id: 1, name: "Engineering", headName: "Priya Shah", status: "Active" },
    { id: 2, name: "Facilities", headName: "Rohan Mehta", status: "Active" },
    { id: 3, name: "Human Resources", headName: "Arjun Dev", status: "Active" },
    { id: 4, name: "Field Ops (test)", headName: "Sameer Iqbal", status: "Inactive" },
  ]);

  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: "Laptops", prefix: "AF-LAP", fieldCount: 6, status: "Active" },
    { id: 2, name: "Meeting Rooms", prefix: "AF-RM", fieldCount: 4, status: "Active" },
    { id: 3, name: "Vehicles", prefix: "AF-VEH", fieldCount: 8, status: "Active" },
    { id: 4, name: "Projectors", prefix: "AF-PROJ", fieldCount: 3, status: "Active" },
  ]);

  const [employees, setEmployees] = useState<Employee[]>([
    { id: 1, name: "Priya Shah", email: "priya@company.com", department: "Engineering", role: "DEPT_HEAD", status: "Active" },
    { id: 2, name: "Rohan Mehta", email: "rohan@company.com", department: "Facilities", role: "ASSET_MANAGER", status: "Active" },
    { id: 3, name: "Arjun Dev", email: "arjun@company.com", department: "Human Resources", role: "DEPT_HEAD", status: "Active" },
    { id: 4, name: "Sameer Iqbal", email: "sameer@company.com", department: "Field Ops (test)", role: "EMPLOYEE", status: "Active" },
  ]);

  // Form states for modals
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptHead, setNewDeptHead] = useState("");
  
  const [newCatName, setNewCatName] = useState("");
  const [newCatPrefix, setNewCatPrefix] = useState("");
  
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpEmail, setNewEmpEmail] = useState("");
  const [newEmpDept, setNewEmpDept] = useState("Engineering");
  const [newEmpRole, setNewEmpRole] = useState("EMPLOYEE");

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "departments") {
      if (!newDeptName || !newDeptHead) return;
      const d: Department = {
        id: departments.length + 1,
        name: newDeptName,
        headName: newDeptHead,
        status: "Active",
      };
      setDepartments([...departments, d]);
      setNewDeptName("");
      setNewDeptHead("");
    } else if (activeTab === "categories") {
      if (!newCatName || !newCatPrefix) return;
      const c: Category = {
        id: categories.length + 1,
        name: newCatName,
        prefix: newCatPrefix.toUpperCase(),
        fieldCount: 4,
        status: "Active",
      };
      setCategories([...categories, c]);
      setNewCatName("");
      setNewCatPrefix("");
    } else if (activeTab === "employees") {
      if (!newEmpName || !newEmpEmail) return;
      const emp: Employee = {
        id: employees.length + 1,
        name: newEmpName,
        email: newEmpEmail,
        department: newEmpDept,
        role: newEmpRole,
        status: "Active",
      };
      setEmployees([...employees, emp]);
      setNewEmpName("");
      setNewEmpEmail("");
    }
    setShowAddModal(false);
  };

  const toggleStatus = (id: number, type: "dept" | "cat" | "emp") => {
    if (type === "dept") {
      setDepartments(
        departments.map((d) => (d.id === id ? { ...d, status: d.status === "Active" ? "Inactive" : "Active" } : d))
      );
    } else if (type === "cat") {
      setCategories(
        categories.map((c) => (c.id === id ? { ...c, status: c.status === "Active" ? "Inactive" : "Active" } : c))
      );
    } else if (type === "emp") {
      setEmployees(
        employees.map((e) => (e.id === id ? { ...e, status: e.status === "Active" ? "Inactive" : "Active" } : e))
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Organization Setup</h1>
          <p className="text-slate-400 text-sm">Configure departments, customizable asset categories, and control roles.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/10 transition-all self-start sm:self-auto border border-blue-400/20"
        >
          <Plus className="w-4 h-4" /> Add{" "}
          {activeTab === "departments" ? "Department" : activeTab === "categories" ? "Category" : "Employee"}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80 max-w-md">
        <button
          onClick={() => setActiveTab("departments")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "departments" ? "bg-slate-800 text-white shadow-sm border border-slate-700" : "text-slate-400 hover:text-white"
          }`}
        >
          <Building2 className="w-4 h-4" /> Departments
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "categories" ? "bg-slate-800 text-white shadow-sm border border-slate-700" : "text-slate-400 hover:text-white"
          }`}
        >
          <Tags className="w-4 h-4" /> Categories
        </button>
        <button
          onClick={() => setActiveTab("employees")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "employees" ? "bg-slate-800 text-white shadow-sm border border-slate-700" : "text-slate-400 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" /> Employees
        </button>
      </div>

      {/* Tabs Content */}
      <div className="glass-panel border border-slate-900 rounded-3xl overflow-hidden">
        {activeTab === "departments" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-900/40 text-slate-400 font-semibold text-xs tracking-wider uppercase">
                  <th className="px-6 py-4">Department Name</th>
                  <th className="px-6 py-4">Head of Department</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-900/20 transition-all">
                    <td className="px-6 py-4 font-bold text-white">{dept.name}</td>
                    <td className="px-6 py-4 text-slate-300">{dept.headName}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                          dept.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {dept.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleStatus(dept.id, "dept")}
                        className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
                      >
                        Toggle Active
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "categories" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-900/40 text-slate-400 font-semibold text-xs tracking-wider uppercase">
                  <th className="px-6 py-4">Category Name</th>
                  <th className="px-6 py-4">Asset Tag Prefix</th>
                  <th className="px-6 py-4">Field Specifications</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-900/20 transition-all">
                    <td className="px-6 py-4 font-bold text-white">{cat.name}</td>
                    <td className="px-6 py-4 text-slate-300 font-mono">{cat.prefix}</td>
                    <td className="px-6 py-4 text-slate-400 font-medium">{cat.fieldCount} Custom Fields</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                          cat.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {cat.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleStatus(cat.id, "cat")}
                        className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
                      >
                        Toggle Active
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "employees" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-900/40 text-slate-400 font-semibold text-xs tracking-wider uppercase">
                  <th className="px-6 py-4">Employee Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">System Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-900/20 transition-all">
                    <td className="px-6 py-4 font-bold text-white">{emp.name}</td>
                    <td className="px-6 py-4 text-slate-400 font-medium">{emp.email}</td>
                    <td className="px-6 py-4 text-slate-300">{emp.department}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block text-[10px] font-black px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 uppercase tracking-wide">
                        {emp.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                          emp.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleStatus(emp.id, "emp")}
                        className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
                      >
                        Toggle Active
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add dialog modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden relative shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-400" /> Add{" "}
                {activeTab === "departments" ? "Department" : activeTab === "categories" ? "Category" : "Employee"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {activeTab === "departments" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Department Name
                    </label>
                    <input
                      type="text"
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      placeholder="e.g. Sales, Marketing"
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 px-4 text-sm placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Head of Department
                    </label>
                    <input
                      type="text"
                      value={newDeptHead}
                      onChange={(e) => setNewDeptHead(e.target.value)}
                      placeholder="e.g. Rohan Mehta"
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 px-4 text-sm placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      required
                    />
                  </div>
                </>
              )}

              {activeTab === "categories" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Category Name
                    </label>
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="e.g. Smart Vehicles, Audio Gear"
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 px-4 text-sm placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Asset Tag Prefix
                    </label>
                    <input
                      type="text"
                      value={newCatPrefix}
                      onChange={(e) => setNewCatPrefix(e.target.value)}
                      placeholder="e.g. AF-VEH, AF-AUDIO"
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 px-4 text-sm placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 uppercase"
                      required
                    />
                  </div>
                </>
              )}

              {activeTab === "employees" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={newEmpName}
                      onChange={(e) => setNewEmpName(e.target.value)}
                      placeholder="e.g. Priya Shah"
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 px-4 text-sm placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={newEmpEmail}
                      onChange={(e) => setNewEmpEmail(e.target.value)}
                      placeholder="e.g. priya@company.com"
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 px-4 text-sm placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Department
                    </label>
                    <select
                      value={newEmpDept}
                      onChange={(e) => setNewEmpDept(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      System Role
                    </label>
                    <select
                      value={newEmpRole}
                      onChange={(e) => setNewEmpRole(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="DEPT_HEAD">Department Head</option>
                      <option value="ASSET_MANAGER">Asset Manager</option>
                      <option value="ADMIN">System Admin</option>
                    </select>
                  </div>
                </>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800/80 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/10 transition-colors"
                >
                  Add Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
