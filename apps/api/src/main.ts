import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS — canonical www host and apex redirect in production; localhost for dev.
  app.enableCors({
    origin: [
      'https://www.infamousfreight.com',
      'https://infamousfreight.com',
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

  const port = process.env.PORT || 3001;
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
