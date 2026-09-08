import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors();

  // ---------------------------------------------------------------
  // Global validation pipe
  // TODO: DTO validatsiyasi ishlamayapti, sababini toping
  // ---------------------------------------------------------------

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  )
  const config = new DocumentBuilder()
    .setTitle('Debug Shop API')
    .setDescription(
      'Backend debugging mashqlari uchun API. Loyihada ataylab xatolar qoldirilgan.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Server:  http://localhost:${port}/api`);
  console.log(`Swagger: http://localhost:${port}/api/docs`);
}
bootstrap();
