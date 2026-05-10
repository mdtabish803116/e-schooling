import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createOrmConfig } from '../../core/database/postgres/create-typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => createOrmConfig(),
    }),
  ],
  providers: [],
})
export class WorkerModule {}
