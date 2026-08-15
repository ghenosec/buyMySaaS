import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } }))
      throw new ConflictException('Este email já está cadastrado');
    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        passwordHash: await hash(dto.password, { type: 2 }),
      },
    });
    return this.session(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });
    if (!user || !(await verify(user.passwordHash, dto.password)))
      throw new UnauthorizedException('Email ou senha inválidos');
    return this.session(user);
  }

  async me(id: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
    });
  }

  private session(user: {
    id: string;
    email: string;
    name: string;
    role: 'USER' | 'ADMIN';
    avatarUrl: string | null;
  }) {
    const token = this.jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      { secret: process.env.AUTH_SECRET, expiresIn: '7d' },
    );
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    };
  }
}
