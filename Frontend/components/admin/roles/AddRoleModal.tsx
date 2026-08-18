"use client";

import { X, Plus, Trash2, ChevronDown, Check, Briefcase, ShieldCheck, UserCheck, CheckSquare, Layers } from "lucide-react";
import { useState, useEffect } from "react";
import { createRole, updateRole } from "@/services/adminService";
import { toast } from "sonner";
import api from "@/lib/api";

interface AddRoleModalProps {
  open: boolean;
  onClose: () => void;
  onRoleCreated: () => void;
  editRole?: any;
}

const ROLE_TYPE_OPTIONS = [
  { value: "recruiter", label: "Recruiter", icon: UserCheck, desc: "Pipeline, candidates & recruitment operations", color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
  { value: "admin", label: "Admin", icon: ShieldCheck, desc: "System settings, users, roles & security", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  { value: "hiring_manager", label: "Hiring Manager", icon: Briefcase, desc: "Department interview feedback & position reviews", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
];

const ADMIN_RESOURCES = [
  { value: "users", label: "Users" },
  { value: "roles", label: "Roles" },
  { value: "settings", label: "Settings" },
  { value: "security", label: "Security" },
  { value: "notifications", label: "Notifications" },
  { value: "audit", label: "Audit Logs" },
  { value: "ai_settings", label: "AI Settings" },
  { value: "analytics", label: "Analytics" },
];

const RECRUITER_RESOURCES = [
  { value: "candidates", label: "Candidates" },
  { value: "ai_search", label: "AI Search" },
  { value: "interviews", label: "Interviews" },
  { value: "positions", label: "Positions" },
  { value: "pipelines", label: "Pipelines" },
  { value: "offers", label: "Offers" },
];

const HIRING_MANAGER_DEFAULT_PERMS = [
  "candidates.view",
  "interviews.view",
  "interviews.feedback",
  "pipelines.view",
];

const OPERATIONS = [
  { value: "create", label: "Create" },
  { value: "view", label: "Read/View" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "manage", label: "Manage" },
];

export default function AddRoleModal({
  open,
  onClose,
  onRoleCreated,
  editRole,
}: AddRoleModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    permissions: "",
    description: "",
  });

  const [selectedRoleTypes, setSelectedRoleTypes] = useState<string[]>(["recruiter"]);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [availablePositions, setAvailablePositions] = useState<any[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [posDropdownOpen, setPosDropdownOpen] = useState(false);

  const [adminPermissions, setAdminPermissions] = useState<{ resource: string; operations: string[] }[]>([]);
  const [recruiterPermissions, setRecruiterPermissions] = useState<{ resource: string; operations: string[] }[]>([]);
  const [openDropdownIndex, setOpenDropdownIndex] = useState<string | null>(null);

  // Fetch positions from system
  useEffect(() => {
    if (!open) return;
    const fetchPositions = async () => {
      try {
        const res = await api.get("/positions/");
        setAvailablePositions(res.data || []);
      } catch {
        try {
          const res = await api.get("/positions");
          setAvailablePositions(res.data || []);
        } catch {
          // fallback positions
          setAvailablePositions([
            { id: 1, title: "Full Stack Developer", department: "Engineering" },
            { id: 2, title: "Frontend Developer", department: "Engineering" },
            { id: 3, title: "Data Analyst", department: "Data & BI" },
            { id: 4, title: "AI/ML Engineer", department: "AI Lab" },
          ]);
        }
      }
    };
    fetchPositions();
  }, [open]);

  // Parse comma-separated permissions string to structured lists
  // Parse comma-separated permissions string to structured lists
  const parsePermissionsString = (permStr: string) => {
    if (!permStr) return { adminList: [], recruiterList: [], types: ["recruiter"] as string[], pos: [] as string[] };
    
    const parts = permStr.split(",").map(p => p.trim()).filter(Boolean);
    const adminMap: { [key: string]: string[] } = {};
    const recruiterMap: { [key: string]: string[] } = {};
    const detectedTypes = new Set<string>();
    const detectedPositions: string[] = [];
    
    // First pass: scan for explicit type and position tags
    parts.forEach(part => {
      if (part.startsWith("position:")) {
        detectedPositions.push(part.replace("position:", ""));
        detectedTypes.add("hiring_manager");
      } else if (part.startsWith("type:")) {
        detectedTypes.add(part.replace("type:", ""));
      }
    });

    const isOnlyHM = detectedTypes.has("hiring_manager") && !detectedTypes.has("recruiter") && !detectedTypes.has("admin");

    // Second pass: scan module permissions for admin and recruiter
    parts.forEach(part => {
      if (part.startsWith("position:") || part.startsWith("type:")) {
        return;
      }

      // If the role is explicitly isolated as a Hiring Manager, skip recruiter permissions
      if (isOnlyHM) {
        return;
      }

      const lastDot = part.lastIndexOf(".");
      if (lastDot !== -1) {
        const resource = part.substring(0, lastDot);
        const op = part.substring(lastDot + 1);
        
        const isAdmin = ADMIN_RESOURCES.some(r => r.value === resource);
        if (isAdmin) {
          detectedTypes.add("admin");
          if (!adminMap[resource]) adminMap[resource] = [];
          if (!adminMap[resource].includes(op)) adminMap[resource].push(op);
        } else {
          detectedTypes.add("recruiter");
          if (!recruiterMap[resource]) recruiterMap[resource] = [];
          if (!recruiterMap[resource].includes(op)) recruiterMap[resource].push(op);
        }
      } else {
        const isAdmin = ADMIN_RESOURCES.some(r => r.value === part);
        if (isAdmin) {
          detectedTypes.add("admin");
          if (!adminMap[part]) adminMap[part] = ["view"];
        } else {
          detectedTypes.add("recruiter");
          if (!recruiterMap[part]) recruiterMap[part] = ["view"];
        }
      }
    });
    
    const adminList = isOnlyHM ? [] : Object.entries(adminMap).map(([resource, operations]) => ({
      resource,
      operations
    }));
    
    const recruiterList = isOnlyHM ? [] : Object.entries(recruiterMap).map(([resource, operations]) => ({
      resource,
      operations
    }));

    if (detectedTypes.size === 0) detectedTypes.add("recruiter");
    
    return {
      adminList,
      recruiterList,
      types: Array.from(detectedTypes),
      pos: detectedPositions
    };
  };

  // Format structured lists to comma-separated permissions string
  const formatPermissionsList = (
    adminList: { resource: string; operations: string[] }[],
    recruiterList: { resource: string; operations: string[] }[],
    types: string[],
    positions: string[]
  ) => {
    const parts: string[] = [];

    // Tag role types
    types.forEach(t => parts.push(`type:${t}`));

    // If Hiring Manager, tag assigned positions only (NO automatic recruiter permissions)
    if (types.includes("hiring_manager")) {
      positions.forEach(p => parts.push(`position:${p}`));
    }
    
    if (types.includes("admin")) {
      adminList.forEach(item => {
        if (item.resource && item.operations.length > 0) {
          item.operations.forEach(op => {
            const p = `${item.resource}.${op}`;
            if (!parts.includes(p)) parts.push(p);
          });
        }
      });
    }
    
    if (types.includes("recruiter")) {
      recruiterList.forEach(item => {
        if (item.resource && item.operations.length > 0) {
          item.operations.forEach(op => {
            const p = `${item.resource}.${op}`;
            if (!parts.includes(p)) parts.push(p);
          });
        }
      });
    }
    
    return parts.join(",");
  };

  const toggleRoleType = (typeVal: string) => {
    if (typeVal === "hiring_manager") {
      if (selectedRoleTypes.includes("hiring_manager")) {
        // Unselecting hiring manager
        setSelectedRoleTypes(["recruiter"]);
        if (recruiterPermissions.length === 0) {
          setRecruiterPermissions([
            { resource: "candidates", operations: ["view", "update"] },
            { resource: "pipelines", operations: ["view", "update"] }
          ]);
        }
      } else {
        // Selecting hiring manager: isolate to hiring_manager only
        setSelectedRoleTypes(["hiring_manager"]);
        setAdminPermissions([]);
        setRecruiterPermissions([]);
        toast.info("Hiring Manager role isolated: Scoped to department positions, candidate interviewing, and feedback.");
      }
    } else {
      // typeVal is "recruiter" or "admin"
      if (selectedRoleTypes.includes("hiring_manager")) {
        // Clear hiring_manager and select the chosen recruiter/admin type
        const newTypes = [typeVal];
        setSelectedRoleTypes(newTypes);
        if (typeVal === "recruiter" && recruiterPermissions.length === 0) {
          setRecruiterPermissions([
            { resource: "candidates", operations: ["view", "update"] },
            { resource: "pipelines", operations: ["view", "update"] }
          ]);
        }
        if (typeVal === "admin" && adminPermissions.length === 0) {
          setAdminPermissions([
            { resource: "users", operations: ["view", "update"] },
            { resource: "settings", operations: ["view", "update"] }
          ]);
        }
      } else {
        // Toggle normally between recruiter and admin
        if (selectedRoleTypes.includes(typeVal)) {
          if (selectedRoleTypes.length === 1) {
            toast.error("At least one role type must be selected.");
            return;
          }
          setSelectedRoleTypes(selectedRoleTypes.filter(t => t !== typeVal));
        } else {
          setSelectedRoleTypes([...selectedRoleTypes, typeVal]);
          if (typeVal === "recruiter" && recruiterPermissions.length === 0) {
            setRecruiterPermissions([
              { resource: "candidates", operations: ["view", "update"] },
              { resource: "pipelines", operations: ["view", "update"] }
            ]);
          }
          if (typeVal === "admin" && adminPermissions.length === 0) {
            setAdminPermissions([
              { resource: "users", operations: ["view", "update"] },
              { resource: "settings", operations: ["view", "update"] }
            ]);
          }
        }
      }
    }
  };

  const togglePosition = (posTitle: string) => {
    if (selectedPositions.includes(posTitle)) {
      setSelectedPositions(selectedPositions.filter(p => p !== posTitle));
    } else {
      setSelectedPositions([...selectedPositions, posTitle]);
    }
  };

  // Admin Handlers
  const handleAdminResourceChange = (index: number, value: string) => {
    const newList = [...adminPermissions];
    newList[index].resource = value;
    setAdminPermissions(newList);
  };

  const handleAdminOperationToggle = (index: number, op: string) => {
    const newList = [...adminPermissions];
    const ops = newList[index].operations;
    if (ops.includes(op)) {
      newList[index].operations = ops.filter(o => o !== op);
    } else {
      newList[index].operations = [...ops, op];
    }
    setAdminPermissions(newList);
  };

  const addAdminPermissionRow = () => {
    setAdminPermissions([...adminPermissions, { resource: "", operations: [] }]);
  };

  const removeAdminPermissionRow = (index: number) => {
    setAdminPermissions(adminPermissions.filter((_, i) => i !== index));
  };

  // Recruiter Handlers
  const handleRecruiterResourceChange = (index: number, value: string) => {
    const newList = [...recruiterPermissions];
    newList[index].resource = value;
    setRecruiterPermissions(newList);
  };

  const handleRecruiterOperationToggle = (index: number, op: string) => {
    const newList = [...recruiterPermissions];
    const ops = newList[index].operations;
    if (ops.includes(op)) {
      newList[index].operations = ops.filter(o => o !== op);
    } else {
      newList[index].operations = [...ops, op];
    }
    setRecruiterPermissions(newList);
  };

  const addRecruiterPermissionRow = () => {
    setRecruiterPermissions([...recruiterPermissions, { resource: "", operations: [] }]);
  };

  const removeRecruiterPermissionRow = (index: number) => {
    setRecruiterPermissions(recruiterPermissions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRoleTypes.length === 0) {
      toast.error("Please select at least one role type (Recruiter, Admin, or Hiring Manager).");
      return;
    }

    const validAdmin = adminPermissions.filter(p => p.resource && p.operations.length > 0);
    const validRecruiter = recruiterPermissions.filter(p => p.resource && p.operations.length > 0);

    if (
      selectedRoleTypes.includes("admin") && validAdmin.length === 0 &&
      selectedRoleTypes.includes("recruiter") && validRecruiter.length === 0 &&
      !selectedRoleTypes.includes("hiring_manager")
    ) {
      toast.error("Please configure at least one complete permission in the selected role sections.");
      return;
    }

    try {
      const permissionsString = formatPermissionsList(validAdmin, validRecruiter, selectedRoleTypes, selectedPositions);
      const payload = {
        ...formData,
        permissions: permissionsString,
      };

      if (editRole) {
        await updateRole(editRole.id, payload);
        toast.success(`Role "${formData.name}" updated successfully!`);
      } else {
        await createRole(payload);
        toast.success(`Role "${formData.name}" created successfully!`);
      }

      onRoleCreated();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to save role.");
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownIndex(null);
      setTypeDropdownOpen(false);
      setPosDropdownOpen(false);
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    if (editRole) {
      setFormData({
        name: editRole.name || "",
        permissions: editRole.permissions || "",
        description: editRole.description || "",
      });
      const { adminList, recruiterList, types, pos } = parsePermissionsString(editRole.permissions);
      setAdminPermissions(adminList);
      setRecruiterPermissions(recruiterList);
      setSelectedRoleTypes(types.length > 0 ? types : ["recruiter"]);
      setSelectedPositions(pos);
    } else {
      setFormData({
        name: "",
        permissions: "",
        description: "",
      });
      setSelectedRoleTypes(["recruiter"]);
      setSelectedPositions([]);
      setAdminPermissions([]);
      setRecruiterPermissions([
        { resource: "candidates", operations: ["view", "update"] },
        { resource: "pipelines", operations: ["view", "update"] },
      ]);
    }
    setOpenDropdownIndex(null);
    setTypeDropdownOpen(false);
    setPosDropdownOpen(false);
  }, [editRole, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">
              {editRole ? "Edit Role & Permissions" : "Create New Role"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Configure role identity, base role types, and granular system permissions
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 hover:bg-secondary-surface transition"
          >
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* 1. Role Name */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-text-primary">
                Role Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Technical Recruiter, Engineering Hiring Lead, Admin"
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 2. Base Role Type Multi-Select Dropdown */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  Role Types (Multi-select) <span className="text-red-400">*</span>
                </label>
                <span className="text-xs text-muted">Select all applicable types for this role</span>
              </div>

              {/* Multi-Select Trigger Button */}
              <button
                type="button"
                onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
                className="w-full flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition focus:border-blue-500 hover:border-blue-500/50"
              >
                <div className="flex flex-wrap gap-2 items-center">
                  {selectedRoleTypes.length === 0 ? (
                    <span className="text-muted">Select Role Types (Recruiter, Admin, Hiring Manager)...</span>
                  ) : (
                    selectedRoleTypes.map((typeVal) => {
                      const opt = ROLE_TYPE_OPTIONS.find(o => o.value === typeVal);
                      if (!opt) return null;
                      const Icon = opt.icon;
                      return (
                        <span
                          key={typeVal}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${opt.color}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {opt.label}
                        </span>
                      );
                    })
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-muted transition-transform ${typeDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Multi-Select Dropdown Menu */}
              {typeDropdownOpen && (
                <div className="absolute z-20 left-0 right-0 mt-2 rounded-xl border border-border bg-surface p-2 shadow-2xl space-y-1">
                  {ROLE_TYPE_OPTIONS.map((opt) => {
                    const isSelected = selectedRoleTypes.includes(opt.value);
                    const Icon = opt.icon;
                    const isHMActive = selectedRoleTypes.includes("hiring_manager");
                    const willSwitch = (isHMActive && opt.value !== "hiring_manager") || (!isHMActive && opt.value === "hiring_manager");

                    return (
                      <div
                        key={opt.value}
                        onClick={() => toggleRoleType(opt.value)}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition ${
                          isSelected ? "bg-blue-600/15 border border-blue-500/30" : "hover:bg-secondary-surface"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg border ${opt.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-text-primary">{opt.label}</p>
                              {willSwitch && (
                                <span className="text-[10px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30 font-medium">
                                  Isolated Mode
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted">{opt.desc}</p>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                          isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-border bg-surface"
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Hiring Manager Assigned Positions Section (Shown ONLY if Hiring Manager is selected) */}
            {selectedRoleTypes.includes("hiring_manager") && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-5 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="text-sm font-bold text-emerald-400">
                        Hiring Manager — Assigned System Positions
                      </h3>
                      <p className="text-xs text-emerald-400/80">
                        Link this role to specific job openings in the system for candidate reviews & interviews
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 font-semibold px-2.5 py-1 rounded-full border border-emerald-500/30">
                    {selectedPositions.length} Selected
                  </span>
                </div>

                {/* Multi-select Positions Dropdown */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <label className="block mb-1.5 text-xs font-semibold text-emerald-300">
                    Available Positions in System
                  </label>
                  <button
                    type="button"
                    onClick={() => setPosDropdownOpen(!posDropdownOpen)}
                    className="w-full flex items-center justify-between rounded-lg border border-emerald-500/30 bg-surface px-4 py-2.5 text-sm text-text-primary outline-none hover:border-emerald-400 transition"
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPositions.length === 0 ? (
                        <span className="text-muted">Click to select positions for this Hiring Manager...</span>
                      ) : (
                        selectedPositions.map((pos) => (
                          <span
                            key={pos}
                            className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-md text-xs font-medium"
                          >
                            {pos}
                          </span>
                        ))
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-emerald-400 transition-transform ${posDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {posDropdownOpen && (
                    <div className="absolute z-20 left-0 right-0 mt-2 rounded-xl border border-emerald-500/30 bg-surface p-2 shadow-2xl max-h-56 overflow-y-auto space-y-1">
                      {availablePositions.length === 0 ? (
                        <p className="p-3 text-xs text-muted text-center">No positions found in the system.</p>
                      ) : (
                        availablePositions.map((pos: any) => {
                          const isChecked = selectedPositions.includes(pos.title);
                          return (
                            <label
                              key={pos.id || pos.title}
                              onClick={() => togglePosition(pos.title)}
                              className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer text-sm transition ${
                                isChecked ? "bg-emerald-500/20 text-emerald-200 font-semibold" : "hover:bg-secondary-surface text-secondary"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="rounded border-border text-emerald-500 focus:ring-emerald-500 h-4 w-4 cursor-pointer accent-emerald-500"
                                />
                                <span>{pos.title}</span>
                              </div>
                              {pos.department && (
                                <span className="text-[11px] text-muted">{pos.department}</span>
                              )}
                            </label>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2 text-xs text-emerald-400/80 flex items-center gap-2">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Automatically grants read access to candidates, resume reviews, scorecard grading & interview feedback for selected roles.</span>
                </div>
              </div>
            )}

            {/* 4. Recruiter Portal Permissions (Shown ONLY if Recruiter is selected) */}
            {selectedRoleTypes.includes("recruiter") && (
              <div className="space-y-3 rounded-xl border border-purple-500/30 bg-purple-950/10 p-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                  <div>
                    <label className="block text-sm font-bold text-purple-400">
                      Recruiter Portal Permissions
                    </label>
                    <p className="text-xs text-purple-400/80">Configure access to candidate sourcing, pipeline stages, interviews & offers</p>
                  </div>
                  <button
                    type="button"
                    onClick={addRecruiterPermissionRow}
                    className="flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1.5 text-xs font-medium text-purple-400 hover:bg-purple-500/20 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Permission
                  </button>
                </div>

                {recruiterPermissions.length === 0 ? (
                  <div className="text-center py-4 border border-dashed border-purple-500/30 rounded-xl text-xs text-muted">
                    No Recruiter Portal permissions added. Click &quot;Add Permission&quot; to define access.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recruiterPermissions.map((perm, index) => (
                      <div 
                        key={index} 
                        className="flex items-end gap-3 bg-surface/80 p-3 rounded-xl border border-purple-500/20 relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Resource Dropdown */}
                        <div className="flex-1">
                          <label className="block mb-1.5 text-xs text-muted font-medium">
                            Resource / Module
                          </label>
                          <select
                            value={perm.resource}
                            onChange={(e) => handleRecruiterResourceChange(index, e.target.value)}
                            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition focus:border-purple-500"
                          >
                            <option value="" disabled>Select Resource</option>
                            {RECRUITER_RESOURCES.map((res) => (
                              <option key={res.value} value={res.value}>
                                {res.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Operations Dropdown */}
                        <div className="flex-1 relative">
                          <label className="block mb-1.5 text-xs text-muted font-medium">
                            Operations (Multi-select)
                          </label>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownIndex(openDropdownIndex === `recruiter-${index}` ? null : `recruiter-${index}`);
                            }}
                            className="w-full text-left rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition focus:border-purple-500 flex justify-between items-center min-h-[38px]"
                          >
                            <span className="truncate mr-2">
                              {perm.operations.length > 0
                                ? perm.operations.map(op => {
                                    const found = OPERATIONS.find(o => o.value === op);
                                    return found ? found.label : op;
                                  }).join(", ")
                                : "Select Operations"}
                            </span>
                            <ChevronDown className="h-4 w-4 text-muted flex-shrink-0" />
                          </button>

                          {openDropdownIndex === `recruiter-${index}` && (
                            <div 
                              className="absolute z-20 left-0 right-0 w-full mt-2 rounded-lg border border-border bg-surface p-1.5 shadow-xl space-y-0.5 max-h-48 overflow-y-auto"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {OPERATIONS.map((op) => {
                                const isChecked = perm.operations.includes(op.value);
                                return (
                                  <label 
                                    key={op.value}
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer text-sm transition-colors ${isChecked ? 'bg-purple-600/20 text-white font-medium' : 'text-secondary hover:bg-secondary-surface hover:text-text-primary'}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleRecruiterOperationToggle(index, op.value)}
                                      className="rounded border-border bg-slate-850 text-purple-600 focus:ring-purple-500 h-4 w-4 cursor-pointer accent-purple-600"
                                    />
                                    <span className="select-none font-medium">{op.label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => removeRecruiterPermissionRow(index)}
                          className="p-2.5 rounded-lg border border-border bg-surface hover:bg-red-950/30 hover:border-red-900/50 hover:text-red-400 text-muted transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. Admin Portal Permissions (Shown ONLY if Admin is selected) */}
            {selectedRoleTypes.includes("admin") && (
              <div className="space-y-3 rounded-xl border border-blue-500/30 bg-blue-950/10 p-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
                  <div>
                    <label className="block text-sm font-bold text-blue-400">
                      Admin Portal Permissions
                    </label>
                    <p className="text-xs text-blue-400/80">Configure system security, users, roles, audit logs & workspace settings</p>
                  </div>
                  <button
                    type="button"
                    onClick={addAdminPermissionRow}
                    className="flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/20 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Permission
                  </button>
                </div>

                {adminPermissions.length === 0 ? (
                  <div className="text-center py-4 border border-dashed border-blue-500/30 rounded-xl text-xs text-muted">
                    No Admin Portal permissions added. Click &quot;Add Permission&quot; to define access.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {adminPermissions.map((perm, index) => (
                      <div 
                        key={index} 
                        className="flex items-end gap-3 bg-surface/80 p-3 rounded-xl border border-blue-500/20 relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Resource Dropdown */}
                        <div className="flex-1">
                          <label className="block mb-1.5 text-xs text-muted font-medium">
                            Resource / Module
                          </label>
                          <select
                            value={perm.resource}
                            onChange={(e) => handleAdminResourceChange(index, e.target.value)}
                            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition focus:border-blue-500"
                          >
                            <option value="" disabled>Select Resource</option>
                            {ADMIN_RESOURCES.map((res) => (
                              <option key={res.value} value={res.value}>
                                {res.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Operations Dropdown */}
                        <div className="flex-1 relative">
                          <label className="block mb-1.5 text-xs text-muted font-medium">
                            Operations (Multi-select)
                          </label>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownIndex(openDropdownIndex === `admin-${index}` ? null : `admin-${index}`);
                            }}
                            className="w-full text-left rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition focus:border-blue-500 flex justify-between items-center min-h-[38px]"
                          >
                            <span className="truncate mr-2">
                              {perm.operations.length > 0
                                ? perm.operations.map(op => {
                                    const found = OPERATIONS.find(o => o.value === op);
                                    return found ? found.label : op;
                                  }).join(", ")
                                : "Select Operations"}
                            </span>
                            <ChevronDown className="h-4 w-4 text-muted flex-shrink-0" />
                          </button>

                          {openDropdownIndex === `admin-${index}` && (
                            <div 
                              className="absolute z-20 left-0 right-0 w-full mt-2 rounded-lg border border-border bg-surface p-1.5 shadow-xl space-y-0.5 max-h-48 overflow-y-auto"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {OPERATIONS.map((op) => {
                                const isChecked = perm.operations.includes(op.value);
                                return (
                                  <label 
                                    key={op.value}
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer text-sm transition-colors ${isChecked ? 'bg-blue-600/20 text-white font-medium' : 'text-secondary hover:bg-secondary-surface hover:text-text-primary'}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleAdminOperationToggle(index, op.value)}
                                      className="rounded border-border bg-slate-850 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer accent-blue-600"
                                    />
                                    <span className="select-none font-medium">{op.label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => removeAdminPermissionRow(index)}
                          className="p-2.5 rounded-lg border border-border bg-surface hover:bg-red-950/30 hover:border-red-900/50 hover:text-red-400 text-muted transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block mb-2 text-sm font-medium text-secondary">
                Description (Optional)
              </label>
              <textarea
                placeholder="Enter role description and purpose..."
                rows={2}
                value={formData.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary outline-none transition focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4 bg-surface">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-surface-hover px-5 py-2.5 text-sm font-medium text-text-secondary hover:bg-border transition focus-ring"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover focus-ring shadow-md"
            >
              {editRole ? "Update Role" : "Create Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}