import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common'
import express from 'express'
import { AuthService } from './auth.service'
import { SignupDto } from './dto/signup.dto'
import { LoginDto } from './dto/login.dto'
import { JwtAuthGuard } from './jwt-auth.guard'
import { UpdateAuthDto } from './dto/update-auth.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto)
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password)
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: express.Request) {
    const u: any = (req as any).user
    const userId = u?.userId || u?._id || u?.sub
    if (!userId) throw new BadRequestException('Invalid token payload')
    return this.authService.getMe(String(userId))
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@Req() req: express.Request, @Body() dto: UpdateAuthDto) {
    const u: any = (req as any).user
    const userId = u?.userId || u?._id || u?.sub
    const requesterRole = u?.role
    if (!userId) throw new BadRequestException('Invalid token payload')
    return this.authService.updateMe(String(userId), requesterRole, dto)
  }
}
