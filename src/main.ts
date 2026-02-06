import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'https://mil-client.vercel.app'],
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
    .setDescription(
      'Mil Shop API Documentation - Military Workshop Management System',
    )
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
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 3001);
  console.log(
    `Application is running on: http://localhost:${process.env.PORT ?? 3001}`,
  );
  console.log(`Swagger UI: http://localhost:${process.env.PORT ?? 3001}/api`);
}
bootstrap();
