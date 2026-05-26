import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());

  app.enableCors({
  origin: ['http://localhost:5173', 'http://172.20.10.5:5173'],
  credentials: true,
});


  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  const config = new DocumentBuilder()
    .setTitle('NextSound Backend')
    .setDescription('NextSound Api Description')
    .setVersion('0.0.1')
    .addTag('NextSound')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  const port = process.env.PORT || 3000;
  await app.listen(3000, '0.0.0.0');
  
  console.log(`🚀 Server is running on port ${port}`);
  console.log(`📝 Swagger docs available at /api`);
}
bootstrap();