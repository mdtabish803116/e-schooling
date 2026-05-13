import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'required_permission';

/**
 * Marks an endpoint as requiring a specific permission.
 * Must be used together with PermissionsGuard (after JwtAuthGuard).
 *
 * School owners bypass this check — they always have full access to their schools.
 * School users must have a role assigned that contains the required permission.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, PermissionsGuard)
 *   @RequirePermission(PermissionKeyEnum.ATTENDANCE_CREATE)
 *   @Post('/attendance')
 *   createAttendance() { ... }
 */
export const RequirePermission = (permissionKey: string) =>
  SetMetadata(PERMISSION_KEY, permissionKey);
