import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

/**
 * Authorization utility functions to reduce code duplication
 */

/**
 * Checks if user is the creator of a resource or has admin role
 * Throws ForbiddenException if neither condition is met
 */
export function requireCreatorOrAdmin(
  userId: string,
  creatorId: string,
  userRole: Role,
  resourceName: string = 'resource',
): void {
  if (userId !== creatorId && userRole !== Role.ADMIN) {
    throw new ForbiddenException(
      `Only the creator or an admin can modify this ${resourceName}`,
    );
  }
}

/**
 * Checks if user is an organizer of a resource or has admin role
 * Throws ForbiddenException if neither condition is met
 */
export function requireOrganizerOrAdmin(
  userId: string,
  organizerId: string,
  userRole: Role,
  resourceName: string = 'resource',
): void {
  if (userId !== organizerId && userRole !== Role.ADMIN) {
    throw new ForbiddenException(
      `Only the organizer or an admin can modify this ${resourceName}`,
    );
  }
}

/**
 * Checks if user has admin role
 * Throws ForbiddenException if not an admin
 */
export function requireAdmin(userRole: Role): void {
  if (userRole !== Role.ADMIN) {
    throw new ForbiddenException('Only administrators can perform this action');
  }
}

/**
 * Checks if user has one of the specified roles
 * Throws ForbiddenException if role doesn't match
 */
export function requireRoles(
  userRole: Role,
  allowedRoles: Role[],
  action: string = 'perform this action',
): void {
  if (!allowedRoles.includes(userRole)) {
    throw new ForbiddenException(
      `Only ${allowedRoles.join(' or ')} can ${action}`,
    );
  }
}
