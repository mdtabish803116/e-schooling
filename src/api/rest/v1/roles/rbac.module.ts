import { Module } from '@nestjs/common';
import { RBACService } from '../../../../services/roles/rbac.service';

@Module({
  providers: [RBACService],
  exports: [RBACService],
})
export class RBACModule {}
