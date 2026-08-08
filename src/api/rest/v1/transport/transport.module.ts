import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from '../../../../models/entities/transport/vehicle.entity';
import { TransportRoute } from '../../../../models/entities/transport/transport-route.entity';
import { PickupPoint } from '../../../../models/entities/transport/pickup-point.entity';
import { Driver } from '../../../../models/entities/transport/driver.entity';
import { StudentTransportAllocation } from '../../../../models/entities/transport/student-transport-allocation.entity';
import { VehicleAssignment } from '../../../../models/entities/transport/vehicle-assignment.entity';
import { TransportSettings } from '../../../../models/entities/transport/transport-settings.entity';
import { TransportService } from '../../../../services/transport/transport.service';
import { TransportController } from './transport.controller';

import { RBACModule } from '../school-roles/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vehicle,
      TransportRoute,
      PickupPoint,
      Driver,
      StudentTransportAllocation,
      VehicleAssignment,
      TransportSettings,
    ]),
    RBACModule,
  ],
  controllers: [TransportController],
  providers: [TransportService],
  exports: [TransportService],
})
export class TransportModule {}
