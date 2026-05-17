import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createOrmConfig } from './core/database/postgres/create-typeorm';
import { RestModule } from './api/rest/rest.module';
import { WorkerModule } from './api/worker/worker.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => createOrmConfig(),
    }),
    RestModule,
    WorkerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
