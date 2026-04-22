import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS — configure for your custom domains
  app.enableCors({
    origin: [
      'https://www.infamousfreight.com',
      'https://infamousfreight.com',
      'https://infamous-freight.netlify.app',
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global validation pipe
  app.useGlobalPipe(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // API prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
  ╔══════════════════════════════════════════════════════════╗
  ║                                                          ║
  ║   🚛  INFAMOUS FREIGHT API                               ║
  ║                                                          ║
  ║   Version: 1.0.0                                         ║
  ║   Port: ${port}                                              ║
  ║   Health: http://localhost:${port}/health                       ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}                          ║
  ║                                                          ║
  ╚══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
