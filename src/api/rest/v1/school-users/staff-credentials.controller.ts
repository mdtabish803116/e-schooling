import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  NotFoundException,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { SchoolUser } from '../../../../models/entities/school/school-user.entity';
import * as bcrypt from 'bcrypt';

@ApiTags('Staff Credentials')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('staff-credentials')
export class StaffCredentialsController {
  constructor(private dataSource: DataSource) {}

  @ApiOperation({ summary: 'Generate credentials' })
  @Post('generate')
  async generateCredential(@Body() body: { staffId: string }) {
    const { staffId } = body;
    const user = await this.dataSource
      .getRepository(SchoolUser)
      .findOne({ where: { id: staffId } });
    if (!user) throw new NotFoundException('Staff member not found');

    if (user.username) {
      return {
        staffId: user.id,
        username: user.username,
        status: user.isActive ? 'ACTIVE' : 'LOCKED',
        temporaryPassword: '',
      };
    }

    const username = `EMP-STF-${user.id}`;
    const rawPass = Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPass, salt);

    user.username = username;
    user.passwordHash = passwordHash;
    await this.dataSource.getRepository(SchoolUser).save(user);

    return {
      staffId: user.id,
      username: username,
      status: 'ACTIVE',
      temporaryPassword: rawPass,
    };
  }

  @ApiOperation({ summary: 'Reset password' })
  @Post(':staffId/reset-password')
  @HttpCode(200)
  async resetPassword(
    @Param('staffId') staffId: string,
    @Body() body?: { password?: string },
  ) {
    const user = await this.dataSource
      .getRepository(SchoolUser)
      .findOne({ where: { id: staffId } });
    if (!user) throw new NotFoundException('Staff member not found');

    const rawPass = body?.password || Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPass, salt);

    user.passwordHash = passwordHash;
    await this.dataSource.getRepository(SchoolUser).save(user);

    return {
      message: 'Password reset successfully',
      username: user.username,
      temporaryPassword: rawPass,
    };
  }
}
