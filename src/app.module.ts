import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { ScheduleModule } from '@nestjs/schedule'

import { AppController } from './app.controller'
import { AppService } from './app.service'

import { UsersModule } from './user/user.module'
import { AuthModule } from './auth/auth.module'
import { DoctorLeadModule } from './doctor-lead/doctor-lead.module'
import { LenderModule } from './lender/lender.module'
import { LenderPolicyModule } from './lender-policy/lender-policy.module';
import { OcrModule } from './ocr/ocr.module';
import { AiModule } from './ai/ai.module';
import { PolicyUploadModule } from './policy-upload/policy-upload.module';

@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ScheduleModule.forRoot(),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
        retryAttempts: 5,
        retryDelay: 3000,
      }),
    }),

    UsersModule,
    AuthModule,
    DoctorLeadModule,
    LenderModule,
    LenderPolicyModule,
    OcrModule,
    AiModule,
    PolicyUploadModule,
  ],

  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}