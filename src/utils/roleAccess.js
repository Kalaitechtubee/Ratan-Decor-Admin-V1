// src/utils/roleAccess.js
/**
 * ============================================================
 * ROLE-BASED ACCESS CONTROL (Frontend)
 * Aligned exactly with backend moduleAccess and role table
 * No Manager role (not in table)
 * ============================================================
 */

/**
 * Check if user has one of the allowed roles
 */
export const hasRoleAccess = (user, allowedRoles) => {
  if (!user || !user.role) return false;
  const userRole = user.role;
  // SuperAdmin overrides all
  if (userRole === "SuperAdmin") return true;
  return allowedRoles.includes(userRole);
};

/**
 * MODULE ACCESS — exactly matches backend and role table
 */
export const moduleAccess = {
  // New module-specific access matching table
  requireDashboardAccess: (user) => hasRoleAccess(user, ["SuperAdmin", "Admin", "Support", "Sales"]),
  requireOrdersAccess: (user) => hasRoleAccess(user, ["SuperAdmin", "Admin", "Sales"]),
  requireEnquiriesAccess: (user) => hasRoleAccess(user, ["SuperAdmin", "Admin", "Sales"]),
  requireCustomersAccess: (user) => hasRoleAccess(user, ["SuperAdmin", "Admin", "Sales"]),
  requireProductsAccess: (user) => hasRoleAccess(user, ["SuperAdmin", "Admin", "Support"]),
  requireStaffManagementAccess: (user) => hasRoleAccess(user, ["SuperAdmin", "Admin"]),
  requireBusinessTypesAccess: (user) => hasRoleAccess(user, ["SuperAdmin", "Admin", "Support"]),
  requireCategoriesAccess: (user) => hasRoleAccess(user, ["SuperAdmin", "Admin", "Support"]),
  requireSlidersAccess: (user) => hasRoleAccess(user, ["SuperAdmin", "Admin", "Support"]),
  requireSeoAccess: (user) => hasRoleAccess(user, ["SuperAdmin", "Admin", "Support"]),
  requireContactsAccess: (user) => hasRoleAccess(user, ["SuperAdmin", "Admin", "Support", "Sales"]),
  // Legacy/Adjusted (removed Manager)
  requireAdmin: (user) => hasRoleAccess(user, ["SuperAdmin", "Admin"]),
  requireManagerOrAdmin: (user) => hasRoleAccess(user, ["SuperAdmin", "Admin"]),
  requireSalesAccess: (user) => hasRoleAccess(user, ["SuperAdmin", "Admin", "Sales"]),
  requireSupportAccess: (user) => hasRoleAccess(user, ["SuperAdmin", "Admin", "Support"]),
  requireBusinessUser: (user) => hasRoleAccess(user, ["SuperAdmin", "Admin", "Support"]),
  requireAuth: (user) => hasRoleAccess(user, ["SuperAdmin", "Admin", "Support", "Sales"]),
  requireStaffAccess: (user) => hasRoleAccess(user, ["SuperAdmin", "Admin", "Support", "Sales"]),
};

/**
 * Role Hierarchy (removed Manager)
 */
export const getRoleLevel = (role) => {
  const roleHierarchy = {
    SuperAdmin: 100,
    Admin: 90,
    Sales: 60,
    Support: 50,
    Dealer: 40,
    Architect: 40,
    General: 30,
    customer: 20,
  };
  return roleHierarchy[role] || 0;
};

/**
 * Check if user can perform an action on another user (removed Manager logic)
 */
export const canPerformAction = (
  currentUser,
  targetUser,
  action = "view"
) => {
  if (!currentUser || !currentUser.role) return false;
  const currentRole = currentUser.role;
  const currentLevel = getRoleLevel(currentRole);
  // SuperAdmin → full access
  if (currentRole === "SuperAdmin") return true;
  // Users can edit/view their own data
  if (currentUser.id === targetUser?.id) {
    return action === "view" || action === "edit";
  }
  // Check level-based access
  if (targetUser && targetUser.role) {
    const targetLevel = getRoleLevel(targetUser.role);
    if (currentLevel <= targetLevel) return false;
  }
  // Admin → can act on all except SuperAdmin
  if (currentRole === "Admin" && targetUser?.role !== "SuperAdmin") {
    return true;
  }
  // Sales/Support → view only
  if (["Sales", "Support"].includes(currentRole)) {
    return (
      action === "view" &&
      ["customer", "General", "Dealer", "Architect"].includes(
        targetUser?.role
      )
    );
  }
  return false;
};

/**
 * Allowed actions list (removed Manager)
 */
export const getAllowedActions = (user) => {
  if (!user || !user.role) return [];
  const actions = {
    SuperAdmin: ["view", "create", "edit", "delete", "manage"],
    Admin: ["view", "create", "edit", "delete", "manage"],
    Sales: ["view", "create", "edit"],
    Support: ["view", "edit"],
    Dealer: ["view"],
    Architect: ["view"],
    General: ["view"],
    customer: ["view"],
  };
  return actions[user.role] || [];
};

/**
 * Check access inside route config
 */
export const canAccessRoute = (user, route) => {
  if (!user || !route) return false;
  if (route.isPublic) return true;
  if (!route.requiredRole && !route.requiredAccess) {
    return moduleAccess.requireAuth(user);
  }
  if (route.requiredRole) {
    return hasRoleAccess(
      user,
      Array.isArray(route.requiredRole)
        ? route.requiredRole
        : [route.requiredRole]
    );
  }
  if (route.requiredAccess && moduleAccess[route.requiredAccess]) {
    return moduleAccess[route.requiredAccess](user);
  }
  return false;
};

export default {
  hasRoleAccess,
  moduleAccess,
  getRoleLevel,
  canPerformAction,
  getAllowedActions,
  canAccessRoute,
};