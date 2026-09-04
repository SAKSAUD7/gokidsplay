export type Permission = string; // Format: "entity:action" e.g., "bookings:write"

export interface PermissionCheck {
    entity: string;
    action: 'read' | 'write' | 'delete' | '*';
}

/**
 * Check if a permission list includes a specific permission
 */
export function hasPermission(
    userPermissions: Permission[],
    check: PermissionCheck
): boolean {
    const { entity, action } = check;

    // Check for wildcard permission (super admin)
    if (userPermissions.includes('*:*')) return true;

    // Check for entity wildcard
    if (userPermissions.includes(`${entity}:*`)) return true;

    // Check for specific permission
    if (userPermissions.includes(`${entity}:${action}`)) return true;

    return false;
}

/**
 * Check multiple permissions (AND logic - must have all)
 */
export function hasAllPermissions(
    userPermissions: Permission[],
    checks: PermissionCheck[]
): boolean {
    return checks.every(check => hasPermission(userPermissions, check));
}

/**
 * Check multiple permissions (OR logic - must have at least one)
 */
export function hasAnyPermission(
    userPermissions: Permission[],
    checks: PermissionCheck[]
): boolean {
    return checks.some(check => hasPermission(userPermissions, check));
}

/**
 * Get permissions from admin user by ID
 */

