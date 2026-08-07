import { Module } from '@nestjs/common';
import { PlatformUserController } from './platform-user.controller';
import { PlatformService } from '../../../../services/platform/platform.service';
import { PlatformUserService } from '../../../../services/platform/platform-user.service';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [SubscriptionModule],
  controllers: [PlatformUserController],
  providers: [PlatformService, PlatformUserService],
  exports: [PlatformService, PlatformUserService],
})
export class PlatformModule {}
