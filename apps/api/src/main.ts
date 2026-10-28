import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { Env } from "@tomato/config";
import "reflect-metadata";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { createValidationPipe } from "./common/pipes/validation.pipe";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("rest");
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder().setTitle("Pea rest").setVersion("0.0.0").build(),
  );
  SwaggerModule.setup("rest/docs", app, document);

  const configService = app.get<ConfigService<Env, true>>(ConfigService);
  await app.listen(configService.get("PORT", { infer: true }));
}

void bootstrap();
