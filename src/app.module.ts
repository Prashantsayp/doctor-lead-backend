import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { ScheduleModule } from '@nestjs/schedule'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { UsersModule } from './user/user.module'
import { AuthModule } from './auth/auth.module'
import { DoctorLeadModule } from './doctor-lead/doctor-lead.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ScheduleModule.forRoot(),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
      }),
    }),

    UsersModule,
    AuthModule,
    DoctorLeadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}