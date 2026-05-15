import { SetMetadata } from '@nestjs/common';
import { PermissionKeyEnum } from '../../models/enums/enums';

export const PERMISSION_KEY = 'rbac_permission';
export const Permission = (permission: PermissionKeyEnum) => SetMetadata(PERMISSION_KEY, permission);
