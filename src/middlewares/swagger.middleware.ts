import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

export class SwaggerMiddleWare {
  private server: INestApplication;

  constructor(server: INestApplication) {
    this.server = server;
  }

  register = (): void => {
    const config = new DocumentBuilder()
      .setTitle('E-School Platform - OpenAPI V1')
      .setDescription(
        'E-School multi-tenant school management platform REST API documentation.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter your JWT Bearer token. Obtain it via /rest/v1/auth/login or /rest/v1/auth/register.',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    const serverConfig = [{ url: '/' }];

    const document: OpenAPIObject = SwaggerModule.createDocument(this.server, {
      ...config,
      servers: serverConfig,
    });

    // Custom sorting for parameters: Header > Path > Query, and Required > Optional
    if (document.paths) {
      Object.values(document.paths).forEach((pathItem) => {
        if (pathItem) {
          const methods = ['get', 'post', 'put', 'delete', 'patch'] as const;
          methods.forEach((method) => {
            const operation = pathItem[method];
            if (operation && operation.parameters) {
              operation.parameters.sort((a, b) => {
                const paramA = a as { in: string; required?: boolean; name: string };
                const paramB = b as { in: string; required?: boolean; name: string };

                // Type priority: header=1, path=2, query=3, others=4
                const typePriority: Record<string, number> = {
                  header: 1,
                  path: 2,
                  query: 3,
                };
                const aPriority = typePriority[paramA.in] ?? 4;
                const bPriority = typePriority[paramB.in] ?? 4;

                if (aPriority !== bPriority) return aPriority - bPriority;

                // Required before optional
                if (paramA.required && !paramB.required) return -1;
                if (!paramA.required && paramB.required) return 1;

                // Alphabetical as final tie-breaker
                return paramA.name.localeCompare(paramB.name);
              });
            }
          });
        }
      });
    }

    SwaggerModule.setup('/rest/v1/documentation', this.server, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
      customCssUrl: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
      ],
      customJs: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js',
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js',
      ],
    });
  };
}
