import { Controller, Post, Body, Headers, UseGuards, Get, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../../../../services/auth/auth.service';
import { SchoolOwnerRegisterDto } from '../../../../interfaces/request/auth/school-owner-register.dto';
import { SchoolOwnerLoginDto } from '../../../../interfaces/request/auth/school-owner-login.dto';
import { SchoolUserLoginDto } from 'src/interfaces/request/auth/school-user-login.dto';
import { StudentLoginDto } from 'src/interfaces/request/auth/student-login.dto';
import { PlatformLoginDto } from '../../../../interfaces/request/auth/platform-login.dto';
import { PlatformRegisterDto } from '../../../../interfaces/request/auth/platform-register.dto';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { ChangePasswordDto } from 'src/interfaces/request/auth/change-password.dto';
import { ForgotPasswordDto } from 'src/interfaces/request/auth/forgot-password.dto';
import { ResetPasswordDto } from 'src/interfaces/request/auth/reset-password.dto';

@ApiTags('Auth Management')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a school owner account' })
  @ApiResponse({
    status: 201,
    description: 'Owner registered successfully',
    schema: {
      example: {
        message: 'Registration successful',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        owner: { id: '1', fullName: 'Rahul Sharma', email: 'rahul@school.com' },
      },
    },
  })
  @Post('register')
  async register(
    @Body() registerDto: SchoolOwnerRegisterDto,
    @Headers() headers: any,
  ) {
    return this.authService.register(registerDto, headers);
  }

  @ApiOperation({ summary: 'Login as a school owner' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        owner: { id: '1', fullName: 'Rahul Sharma', email: 'rahul@school.com' },
      },
    },
  })
  @Post('login')
  async login(
    @Body() loginDto: SchoolOwnerLoginDto,
    @Headers() headers: any,
  ) {
    return this.authService.login(loginDto, headers);
  }

  @ApiOperation({
    summary: 'Login as a school user (Teacher / Accountant / Staff / Admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'User login successful',
    schema: {
      example: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '5',
          name: 'Rahul Teacher',
          username: 'teacher_rahul',
          roles: ['teacher'],
        },
      },
    },
  })
  @Post('user/login')
  async userLogin(
    @Body() loginDto: SchoolUserLoginDto,
    @Headers() headers: any,
  ) {
    return this.authService.schoolUserLogin(loginDto, headers);
  }

  @ApiOperation({ summary: 'Login as a student' })
  @ApiResponse({
    status: 200,
    description: 'Student login successful',
    schema: {
      example: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        student: {
          id: '10',
          studentCode: 'SCH-BLUE-2024-001',
          firstName: 'Amit',
          lastName: 'Kumar',
          roles: ['student'],
        },
      },
    },
  })
  @Post('student/login')
  async studentLogin(
    @Body() loginDto: StudentLoginDto,
    @Headers() headers: any,
  ) {
    return this.authService.studentLogin(loginDto, headers);
  }

  @ApiOperation({ summary: 'Login as a platform admin' })
  @ApiResponse({
    status: 200,
    description: 'Platform admin login successful',
    schema: {
      example: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '1',
          name: 'Super Admin',
          email: 'admin@eschool.com',
          roles: ['super_admin'],
        },
      },
    },
  })
  @Post('platform/login')
  async platformLogin(
    @Body() loginDto: PlatformLoginDto,
    @Headers() headers: any,
  ) {
    return this.authService.platformLogin(loginDto, headers);
  }

  @ApiOperation({ summary: 'Register a platform admin (Internal)' })
  @ApiResponse({
    status: 201,
    description: 'Platform admin registered successfully',
    schema: {
      example: {
        message: 'Platform user registered successfully with 2 roles',
        id: '2',
        email: 'ops@eschool.com',
      },
    },
  })
  @Post('platform/register')
  async platformRegister(
    @Body() registerDto: PlatformRegisterDto,
    @Headers('x-api-key') apiKey: string,
  ) {
    return this.authService.platformRegister(registerDto, apiKey);
  }

  @ApiOperation({ summary: 'Change password for logged-in user' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @CurrentUser() caller: any,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(caller, dto);
  }

  @ApiOperation({ summary: 'Request password reset code' })
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @ApiOperation({ summary: 'Reset password with token/OTP' })
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @ApiOperation({ summary: 'Get current user profile (Owner/Staff)' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() caller: any) {
    return this.authService.getProfile(caller);
  }

  @ApiOperation({ summary: 'Update current user profile (Owner/Staff)' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @CurrentUser() caller: any,
    @Body() body: any,
  ) {
    return this.authService.updateProfile(caller, body);
  }
}
