import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { INestApplication, INestApplicationContext } from '@nestjs/common';
import { AppModule } from './app.module';
import { WorkerModule } from './api/worker/worker.module';
import { Config } from './config/index';
import { ServerMode } from './config/enums_config';
import { GlobalHttpExceptionFilter } from './shared/filters/http-exception.filter';
import { SwaggerMiddleWare } from './middlewares/swagger.middleware';

const createServer = async (): Promise<{
  app: INestApplication | INestApplicationContext;
  mode: string;
}> => {
  const mode = Config.getSecret(
    'SERVER_MODE',
    String,
  ) as keyof typeof ServerMode;

  if (!(mode === 'rest' || mode === 'worker')) {
    throw new Error('SERVER_MODE not provided or invalid!');
  }

  if (mode === 'worker') {
    const app = await NestFactory.createApplicationContext(WorkerModule);
    return { app, mode };
  } else {
    const app = await NestFactory.create(AppModule);

    // CORS configuration
    if (!process.env.ORIGINS) {
      throw new Error('ORIGINS not configured in environment variables');
    }

    const allowedDomains: string[] = process.env.ORIGINS?.split(',') || [];

    if (allowedDomains.includes('*')) {
      app.enableCors({ origin: '*' });
    } else {
      app.enableCors({
        origin: (origin: string | undefined, callback) => {
          if (!origin || allowedDomains.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'), false);
          }
        },
      });
    }

    // Global filters
    app.useGlobalFilters(new GlobalHttpExceptionFilter());

    // Swagger — only available outside production
    if (process.env.NODE_ENV !== 'prod') {
      const swagger = new SwaggerMiddleWare(app);
      swagger.register();
    }

    return { app, mode };
  }
};

const startServer = async (serverData: {
  app: INestApplication | INestApplicationContext;
  mode: string;
}): Promise<void> => {
  const { app, mode } = serverData;

  if (mode === 'worker') {
    // ApplicationContext has no listen method, worker processes run in background
    console.log(`[e-school] Worker application is running.`);
    // Initialize any queue workers or background jobs here
    app.enableShutdownHooks();
  } else {
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || '0.0.0.0';
    const restApp = app as INestApplication;
    await restApp.listen(port, host);
    console.log(`[e-school] Rest API is running on: ${await restApp.getUrl()}`);
  }
};

const bootstrap = async (): Promise<void> => {
  try {
    const serverData = await createServer();
    await startServer(serverData);
  } catch (e: unknown) {
    console.error('Failed to start server:', e);
  }
};

void bootstrap();
