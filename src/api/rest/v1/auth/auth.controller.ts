import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from '../../../../services/auth/auth.service';
import { SchoolOwnerRegisterDto } from '../../../../interfaces/request/auth/school-owner-register.dto';
import { SchoolOwnerLoginDto } from '../../../../interfaces/request/auth/school-owner-login.dto';

@ApiTags('Auth — School Owner')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a school owner account' })
  @Post('register')
  async register(@Body() registerDto: SchoolOwnerRegisterDto) {
    return this.authService.register(registerDto);
  }

  @ApiOperation({ summary: 'Login as a school owner' })
  @Post('login')
  async login(@Body() loginDto: SchoolOwnerLoginDto) {
    return this.authService.login(loginDto);
  }
}

