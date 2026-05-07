import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  // CORS configurado para desenvolvimento
  // Em produção, especifique a URL exata do frontend
  const isProduction = process.env.NODE_ENV === 'production';
  app.enableCors({
    origin: isProduction ? process.env.FRONTEND_URL : true, // Em dev, permite qualquer origem (necessário para acessar por IP)
    credentials: true,
  });

  await app.listen(3001, '0.0.0.0'); // Escuta em todos os IPs
}

bootstrap();
