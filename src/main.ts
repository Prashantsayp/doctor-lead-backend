import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'
import { NestExpressApplication } from '@nestjs/platform-express'

import * as dotenv from 'dotenv'
dotenv.config()

async function bootstrap() {
  const app =
    await NestFactory.create<NestExpressApplication>(AppModule)

  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',

    'https://doctor-lead.netlify.app',
    'https://www.doctor-lead.netlify.app',

  ]

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true)
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        console.error(`❌ CORS Blocked Origin: ${origin}`)
        callback(new Error('Not allowed by CORS'))
      }
    },

    credentials: true,

    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
  })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )


  const configService = app.get(ConfigService)

  const port = Number(
    process.env.PORT || configService.get<number>('PORT') || 3001,
  )

  await app.listen(port, '0.0.0.0')

  console.log(`🚀 Server running on port ${port}`)
}

bootstrap()