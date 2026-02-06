import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestjsRedoxModule, RedocOptions } from 'nestjs-redox';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Mil Shop API')
    .setDescription('Mil Shop API Documentation - Military Workshop Management System')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'User authentication and authorization endpoints')
    .addTag('Workshops', 'Workshop management endpoints')
    .addTag('User Units', 'Military unit (weapons/vehicles) management')
    .addTag('Spare Parts', 'Spare parts catalog management')
    .addTag('Inventory', 'Workshop inventory management')
    .addTag('Consume Requests', 'Requests to consume spare parts')
    .addTag('Source Requests', 'Requests to source spare parts from suppliers')
    .addTag('Log Book', 'Maintenance and activity logs')
    .addTag('Chat', 'Unit-related messaging')
    .addTag('Users', 'User management')
    .addTag('General', 'General API endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Setup Swagger UI
  SwaggerModule.setup('api', app, document);

  // Redoc styling options
  const redocOptions: RedocOptions = {
    logo: {
      url: 'https://redocly.github.io/redoc/petstore-logo.png',
      altText: 'Mil Shop',
      backgroundColor: '#FFFFFF',
    },
    sortPropsAlphabetically: true,
    hideDownloadButton: false,
    hideHostname: false,
    requiredPropsFirst: true,
    expandResponses: '200,201',
    theme: {
      colors: {
        primary: {
          main: '#2563eb',
        },
      },
      typography: {
        fontSize: '14px',
        fontFamily: 'Roboto, sans-serif',
        headings: {
          fontFamily: 'Montserrat, sans-serif',
        },
      },
      sidebar: {
        width: '300px',
        backgroundColor: '#fafafa',
      },
      rightPanel: {
        backgroundColor: '#263238',
      },
    },
  };

  // Setup Redoc with nestjs-redox
  await NestjsRedoxModule.setup(
    'docs',
    app,
    document,
    {
      useGlobalPrefix: false,
      standalone: true,
      disableGoogleFont: false,
    },
    redocOptions,
  );

  await app.listen(process.env.PORT ?? 3001);
  console.log(`Application is running on: http://localhost:${process.env.PORT ?? 3001}`);
  console.log(`Swagger UI: http://localhost:${process.env.PORT ?? 3001}/api`);
  console.log(`Redoc: http://localhost:${process.env.PORT ?? 3001}/docs`);
}
bootstrap();
