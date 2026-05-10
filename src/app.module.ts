import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createOrmConfig } from './core/database/postgres/create-typeorm';
import { RestModule } from './api/rest/rest.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => createOrmConfig(),
    }),
    RestModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
