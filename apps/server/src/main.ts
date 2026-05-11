import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import { existsSync } from 'fs';

// Allow BigInt to be serialized to JSON as string
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Serve Vue frontend static files if dist/ folder exists
  const distPath = join(__dirname, '..', 'public');
  const altDistPath = join(process.cwd(), 'public');
  const staticPath = existsSync(distPath) ? distPath : existsSync(altDistPath) ? altDistPath : null;

  if (staticPath) {
    app.useStaticAssets(staticPath);
    // SPA fallback: serve index.html for all non-api routes
    const { join: pathJoin } = await import('path');
    app.setBaseViewsDir(staticPath);
    app.getHttpAdapter().getInstance().get(/^(?!\/api).*$/, (_req: any, res: any) => {
      res.sendFile(pathJoin(staticPath, 'index.html'));
    });
    console.log(`Serving frontend from ${staticPath}`);
  }

  const port = process.env.SERVER_PORT || process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
}
bootstrap();
