import { SetMetadata } from '@nestjs/common';
import { ResourceEnum, ActionEnum } from '../../models/enums/enums';

export const PERMISSION_KEY = 'rbac_permission';

export interface PermissionMetadata {
  resource: ResourceEnum | string;
  action: ActionEnum | string;
}

export const Permission = (resource: ResourceEnum | string, action: ActionEnum | string) =>
  SetMetadata(PERMISSION_KEY, { resource, action } as PermissionMetadata);
