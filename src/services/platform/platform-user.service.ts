import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource, Like } from 'typeorm';
import { School } from '../../models/entities/school/school.entity';
import { Student } from '../../models/entities/student/student.entity';
import { SchoolUser } from '../../models/entities/school/school-user.entity';
import { PaginationDto } from '../../interfaces/request/common/pagination.dto';
import { SchoolOwner } from 'src/models/entities/school/school-owner.entity';
import { SchoolSubscription } from '../../models/entities/subscription/school-subscription.entity';
import { SubscriptionStatusEnum } from '../../models/enums/enums';
import { AuthContext } from '../../interfaces/auth-context.interface';

@Injectable()
export class PlatformUserService {
  constructor(private dataSource: DataSource) {}

  /**
   * List all schools with pagination and search
   */
  async listAllSchools(query: PaginationDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await this.dataSource
      .getRepository(School)
      .findAndCount({
        where: search ? { schoolName: Like(`%${search}%`) } : {},
        order: { createdAt: 'DESC' },
        take: limit,
        skip: skip,
      });

    return {
      items,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  /**
   * List all school owners with pagination and search
   */
  async listAllOwners(query: PaginationDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await this.dataSource
      .getRepository(SchoolOwner)
      .findAndCount({
        where: search
          ? [{ fullName: Like(`%${search}%`) }, { email: Like(`%${search}%`) }]
          : {},
        order: { createdAt: 'DESC' },
        take: limit,
        skip: skip,
      });

    return {
      items,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  /**
   * Toggle school active status
   */
  async toggleSchoolStatus(schoolId: string, isActive: boolean) {
    const school = await this.dataSource
      .getRepository(School)
      .findOne({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('School not found');

    school.isActive = isActive;
    return this.dataSource.getRepository(School).save(school);
  }

  /**
   * Toggle owner active status
   */
  async toggleOwnerStatus(ownerId: string, isActive: boolean) {
    const owner = await this.dataSource
      .getRepository(SchoolOwner)
      .findOne({ where: { id: ownerId } });
    if (!owner) throw new NotFoundException('Owner not found');

    owner.isActive = isActive;
    return this.dataSource.getRepository(SchoolOwner).save(owner);
  }

  /**
   * List students across all schools with filters
   */
  async listAllStudents(query: PaginationDto & { schoolId?: string }) {
    const { page = 1, limit = 10, search, schoolId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (schoolId) where.schoolId = schoolId;

    if (search) {
      return this.dataSource.getRepository(Student).findAndCount({
        where: [
          { ...where, firstName: Like(`%${search}%`) },
          { ...where, lastName: Like(`%${search}%`) },
          { ...where, studentCode: Like(`%${search}%`) },
        ],
        relations: ['school'],
        order: { createdAt: 'DESC' },
        take: limit,
        skip: skip,
      });
    }

    const [items, total] = await this.dataSource
      .getRepository(Student)
      .findAndCount({
        where,
        relations: ['school'],
        order: { createdAt: 'DESC' },
        take: limit,
        skip: skip,
      });

    return {
      items,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  /**
   * List school users (teachers/staff) across all schools
   */
  async listAllStaff(query: PaginationDto & { schoolId?: string }) {
    const { page = 1, limit = 10, search, schoolId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (schoolId) where.schoolId = schoolId;

    if (search) {
      return this.dataSource.getRepository(SchoolUser).findAndCount({
        where: [
          { ...where, name: Like(`%${search}%`) },
          { ...where, username: Like(`%${search}%`) },
        ],
        relations: ['school'],
        order: { createdAt: 'DESC' },
        take: limit,
        skip: skip,
      });
    }

    const [items, total] = await this.dataSource
      .getRepository(SchoolUser)
      .findAndCount({
        where,
        relations: ['school'],
        order: { createdAt: 'DESC' },
        take: limit,
        skip: skip,
      });

    return {
      items,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  /**
   * Admin capability to manually extend a school's trial or subscription duration.
   */
  async extendSubscriptionDuration(
    caller: AuthContext,
    schoolId: string,
    daysToExtend: number,
  ) {
    const sub = await this.dataSource
      .getRepository(SchoolSubscription)
      .findOne({
        where: { schoolId },
      });
    if (!sub)
      throw new NotFoundException(
        'No active subscription found for this school',
      );

    const now = new Date();
    if (sub.subscriptionState === SubscriptionStatusEnum.TRIAL) {
      const currentEnd =
        sub.trialEndAt && sub.trialEndAt > now
          ? new Date(sub.trialEndAt)
          : new Date(now);
      currentEnd.setDate(currentEnd.getDate() + daysToExtend);
      sub.trialEndAt = currentEnd;
    } else {
      const currentEnd =
        sub.currentPeriodEnd && sub.currentPeriodEnd > now
          ? new Date(sub.currentPeriodEnd)
          : new Date(now);
      currentEnd.setDate(currentEnd.getDate() + daysToExtend);
      sub.currentPeriodEnd = currentEnd;
    }

    await this.dataSource.getRepository(SchoolSubscription).save(sub);

    return {
      message: `Successfully extended subscription by ${daysToExtend} days.`,
      newExpiryDate:
        sub.subscriptionState === SubscriptionStatusEnum.TRIAL
          ? sub.trialEndAt
          : sub.currentPeriodEnd,
    };
  }
}
