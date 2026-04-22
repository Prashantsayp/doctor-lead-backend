import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'
import { NestExpressApplication } from '@nestjs/platform-express'

import * as dotenv from 'dotenv'
dotenv.config()

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  // ✅ CORS (single config only)
  app.enableCors({
    origin: [
      'https://doctor-lead.netlify.app',
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })

  // ✅ Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )

  const config = app.get(ConfigService)
  const port = Number(process.env.PORT || config.get('PORT') || 3001)

  await app.listen(port, '0.0.0.0')
  console.log(`🚀 Server running on port ${port}`)
}

bootstrap()