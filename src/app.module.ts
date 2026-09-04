import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createOrmConfig } from './core/database/postgres/create-typeorm';
import { RestModule } from './api/rest/rest.module';
import { WorkerModule } from './api/worker/worker.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ApiDecryptionMiddleware } from './middlewares/api-decryption.middleware';
import { ApiEncryptionInterceptor } from './shared/interceptors/api-encryption.interceptor';
import { ApiCryptoService } from './shared/crypto/api-crypto.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => createOrmConfig(),
    }),
    RestModule,
    WorkerModule,
    NotificationModule,
  ],
  controllers: [],
  providers: [
    ApiCryptoService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiEncryptionInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ApiDecryptionMiddleware).forRoutes('*');
  }
}
