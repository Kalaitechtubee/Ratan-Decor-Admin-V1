// src/hooks/useRoleAccess.js - Updated to match role table, removed Manager
import { useMemo } from "react";
import { getCurrentUser } from "../utils/auth";
import {
  moduleAccess,
  hasRoleAccess,
  canPerformAction as checkAction,
  getAllowedActions,
} from "../utils/roleAccess";

/**
 * Role-based access hook
 */
export const useRoleAccess = () => {
  const user = getCurrentUser();

  const access = useMemo(() => {
    if (!user) {
      return {
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        isStaff: false,
        canAccessAdmin: false,
        canAccessSales: false,
        canAccessSupport: false,
        canAccessBusiness: false,
        allowedActions: [],
      };
    }

    return {
      user,
      isAuthenticated: true,

      isAdmin: moduleAccess.requireAdmin(user),
      isStaff: moduleAccess.requireStaffAccess(user),

      canAccessAdmin: moduleAccess.requireAdmin(user),
      canAccessSales: moduleAccess.requireSalesAccess(user),
      canAccessSupport: moduleAccess.requireSupportAccess(user),
      canAccessBusiness: moduleAccess.requireBusinessTypesAccess(user),

      hasRoleAccess: (roles) => hasRoleAccess(user, roles),
      canPerformAction: (targetUser, action) =>
        checkAction(user, targetUser, action),

      allowedActions: getAllowedActions(user),

      moduleAccess: {
        requireDashboardAccess: () => moduleAccess.requireDashboardAccess(user),
        requireOrdersAccess: () => moduleAccess.requireOrdersAccess(user),
        requireEnquiriesAccess: () => moduleAccess.requireEnquiriesAccess(user),
        requireCustomersAccess: () => moduleAccess.requireCustomersAccess(user),
        requireProductsAccess: () => moduleAccess.requireProductsAccess(user),
        requireStaffManagementAccess: () => moduleAccess.requireStaffManagementAccess(user),
        requireBusinessTypesAccess: () => moduleAccess.requireBusinessTypesAccess(user),
        requireCategoriesAccess: () => moduleAccess.requireCategoriesAccess(user),
        requireSlidersAccess: () => moduleAccess.requireSlidersAccess(user),
        requireSeoAccess: () => moduleAccess.requireSeoAccess(user),
        requireContactsAccess: () => moduleAccess.requireContactsAccess(user),
        requireAdmin: () => moduleAccess.requireAdmin(user),
        requireManagerOrAdmin: () => moduleAccess.requireManagerOrAdmin(user),
        requireSalesAccess: () => moduleAccess.requireSalesAccess(user),
        requireSupportAccess: () => moduleAccess.requireSupportAccess(user),
        requireBusinessUser: () => moduleAccess.requireBusinessUser(user),
        requireAuth: () => moduleAccess.requireAuth(user),
        requireStaffAccess: () => moduleAccess.requireStaffAccess(user),
      },
    };
  }, [user]);

  return access;
};

export default useRoleAccess;