import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { UserService } from '../user/user.service'
import { SignupDto } from './dto/signup.dto'
import { UpdateAuthDto } from './dto/update-auth.dto'


@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  private signToken(payload: any) {
    return this.jwtService.signAsync(payload)
  }

  async signup(dto: SignupDto) {
    const email = dto.email.toLowerCase().trim()

    const existing = await this.userService.findByEmail(email)
    if (existing) throw new BadRequestException('Email already exists')

    const createdSafe = await this.userService.create({
      name: dto.name.trim(),
      email,
      password: dto.password, // plain, hashing userService karega
      designation: dto.designation.trim(),
      role: dto.role || 'USER',
    } as any)

    const access_token = await this.signToken({
      sub: String((createdSafe as any)._id),
      email: createdSafe.email,
      role: createdSafe.role,
    })

    return { access_token, user: createdSafe }
  }

  async login(email: string, password: string) {
    const cleanEmail = String(email || '').toLowerCase().trim()
    const cleanPass = String(password || '').trim()

    const user = await this.userService.findByEmailWithPassword(cleanEmail)
    if (!user) throw new UnauthorizedException('Invalid credentials')

    if (!user.password) throw new UnauthorizedException('Invalid credentials')

    const match = await bcrypt.compare(cleanPass, user.password)
    if (!match) throw new UnauthorizedException('Invalid credentials')

    const obj = user.toObject()
    const { password: _p, ...safeUser } = obj

    const access_token = await this.signToken({
      sub: String(user._id),
      email: user.email,
      role: user.role,
    })

    return { access_token, user: safeUser }
  }

  // ✅ NEW: logged in user info
  async getMe(userId: string) {
    return this.userService.findById(userId) // -password
  }

   async updateMe(userId: string, requesterRole: string, dto: UpdateAuthDto) {
    const patch: any = {}

    // ✅ always allowed for self
    if (dto.name !== undefined) patch.name = String(dto.name).trim()
    if (dto.designation !== undefined) patch.designation = String(dto.designation).trim()

    // ✅ role/status only ADMIN/SUPER_ADMIN
    const isAdmin = requesterRole === 'ADMIN' || requesterRole === 'SUPER_ADMIN'
    if (dto.role !== undefined || dto.status !== undefined) {
      if (!isAdmin) throw new ForbiddenException('Only ADMIN/SUPER_ADMIN can change role/status')
      if (dto.role !== undefined) patch.role = dto.role
      if (dto.status !== undefined) patch.status = dto.status
    }

    return this.userService.update(userId, patch)
  }
}
