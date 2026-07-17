const IMPLICIT_PERMISSIONS: { [key: string]: string[] } = {
    "ai_search.view": ["candidates.view", "positions.view", "pipelines.view"],
    "interviews.view": ["candidates.view", "positions.view"],
    "interviews.create": ["candidates.view", "positions.view", "interviews.view"],
    "interviews.update": ["candidates.view", "positions.view", "interviews.view"],
    "interviews.delete": ["candidates.view", "positions.view", "interviews.view"],
    "pipelines.manage": ["pipelines.view", "candidates.view", "positions.view"],
    "pipelines.view": ["candidates.view", "positions.view"],
    "positions.create": ["positions.view"],
    "positions.update": ["positions.view"],
    "positions.delete": ["positions.view"],
    "candidates.create": ["candidates.view"],
    "candidates.update": ["candidates.view"],
    "candidates.delete": ["candidates.view"],
    "users.create": ["users.view"],
    "users.update": ["users.view"],
    "users.delete": ["users.view"],
    "roles.create": ["roles.view", "users.view"],
    "roles.update": ["roles.view", "users.view"],
    "roles.delete": ["roles.view", "users.view"],
    "roles.view": ["users.view"],
    "settings.manage": ["settings.view"],
    "ai_settings.manage": ["ai_settings.view"],
    "offers.create": ["offers.view"],
    "offers.update": ["offers.view"],
    "offers.delete": ["offers.view"],
};

export const getAllUserPermissions = (basePermissions: string[]): string[] => {
    const allPerms = new Set<string>(basePermissions);
    const queue = [...basePermissions];
    while (queue.length > 0) {
        const current = queue.shift()!;
        const implied = IMPLICIT_PERMISSIONS[current] || [];
        for (const imp of implied) {
            if (!allPerms.has(imp)) {
                allPerms.add(imp);
                queue.push(imp);
            }
        }
    }
    return Array.from(allPerms);
};

export const hasPermission = (
    permission: string,
    checkImplicit: boolean = true
): boolean => {
    if (typeof window === "undefined") {
        return false;
    }

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    // COMPANY_OWNER acts as superuser with all permissions
    if (user.role === "COMPANY_OWNER") {
        return true;
    }

    const basePermissions = user.permissions || [];
    const permissions = checkImplicit ? getAllUserPermissions(basePermissions) : basePermissions;

    return permissions.includes(permission);
};

export const hasAdminPortalAccess = (): boolean => {
    if (typeof window === "undefined") {
        return false;
    }

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    if (
        user.role === "COMPANY_OWNER" ||
        user.role === "ADMIN" ||
        user.role === "SUPER_ADMIN"
    ) {
        return true;
    }

    const basePermissions = user.permissions || [];
    const permissions = getAllUserPermissions(basePermissions);
    
    const adminResources = [
        "users",
        "roles",
        "settings",
        "security",
        "notifications",
        "audit",
        "ai_settings",
        "analytics"
    ];

    return permissions.some(p => {
        const resource = p.split(".")[0];
        return adminResources.includes(resource);
    });
};

export const hasRecruiterPortalAccess = (): boolean => {
    if (typeof window === "undefined") {
        return false;
    }

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    if (
        user.role === "COMPANY_OWNER" ||
        user.role === "ADMIN" ||
        user.role === "SUPER_ADMIN"
    ) {
        return true;
    }

    const basePermissions = user.permissions || [];
    const permissions = getAllUserPermissions(basePermissions);
    
    const recruiterResources = [
        "candidates",
        "ai_search",
        "interviews",
        "positions",
        "pipelines",
        "offers"
    ];

    return permissions.some(p => {
        const resource = p.split(".")[0];
        return recruiterResources.includes(resource);
    });
};