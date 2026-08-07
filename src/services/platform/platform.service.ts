import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Config } from '../../config/index';
import { AuthContext } from '../../interfaces/auth-context.interface';
import {
  AssignPermissionDto,
  CreateModuleMasterDto,
  CreateOperationMasterDto,
  CreatePlatformFeatureDto,
} from '../../interfaces/request/platform/platform-management.dto';
import { PlatformFeature } from '../../models/entities/entitlement/platform-feature.entity';
import { ModuleMaster } from '../../models/entities/rbac/module-master.entity';
import { ModuleOperationPermission } from '../../models/entities/rbac/module-operation-permission.entity';
import { OperationMaster } from '../../models/entities/rbac/operation-master.entity';

// Seeding Imports
import { PlatformFeaturePrice } from '../../models/entities/entitlement/plaform-feature-price.entity';
import { SubscriptionPlanPlatformFeatureMapping } from '../../models/entities/entitlement/subscription-plan-platform-feature-mapping.entity';
import { SubscriptionPlanPrice } from '../../models/entities/subscription/subscription-plan-price.entity';
import { SubscriptionPlan } from '../../models/entities/subscription/subscription-plan.entity';
import {
  BillingCycleEnum,
  FeatureTypeEnum,
  PlanCodeEnum,
  UsageUnitEnum,
} from '../../models/enums/enums';

@Injectable()
export class PlatformService {
  constructor(private dataSource: DataSource) {}

  private generateCodeFromName(name: string): string {
    return name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  async createFeature(dto: CreatePlatformFeatureDto, caller: AuthContext) {
    const generatedCode = this.generateCodeFromName(dto.name);
    if (!generatedCode) {
      throw new BadRequestException(
        'Invalid feature name: code could not be generated',
      );
    }

    // Check if name OR code already exists
    const existing = await this.dataSource
      .getRepository(PlatformFeature)
      .findOne({
        where: [{ name: dto.name }, { code: generatedCode }],
      });
    if (existing) {
      throw new BadRequestException(
        'A feature with the same name or generated code already exists',
      );
    }

    const feature = new PlatformFeature();
    feature.name = dto.name;
    feature.code = generatedCode;
    feature.description = dto.description;
    feature.createdById = caller.id;
    feature.isActive = true;
    return this.dataSource.getRepository(PlatformFeature).save(feature);
  }

  async createModule(dto: CreateModuleMasterDto, caller: AuthContext) {
    const generatedCode = this.generateCodeFromName(dto.name);
    if (!generatedCode) {
      throw new BadRequestException(
        'Invalid module name: code could not be generated',
      );
    }

    // Check if name OR code already exists
    const existing = await this.dataSource.getRepository(ModuleMaster).findOne({
      where: [{ name: dto.name }, { code: generatedCode }],
    });
    if (existing) {
      throw new BadRequestException(
        'A module with the same name or generated code already exists',
      );
    }

    const module = new ModuleMaster();
    module.name = dto.name;
    module.code = generatedCode;
    module.description = dto.description;
    module.platformFeatureId = dto.platformFeatureId;
    module.parentModuleId = dto.parentModuleId;
    module.routePath = dto.routePath;
    module.icon = dto.icon;
    module.showInSidebar = dto.showInSidebar ?? true;
    module.isMenuGroup = dto.isMenuGroup ?? false;
    module.createdById = caller.id;
    module.isActive = true;
    return this.dataSource.getRepository(ModuleMaster).save(module);
  }

  async createOperation(dto: CreateOperationMasterDto, caller: AuthContext) {
    const generatedCode = this.generateCodeFromName(dto.name);
    if (!generatedCode) {
      throw new BadRequestException(
        'Invalid operation name: code could not be generated',
      );
    }

    // Check if name OR code already exists
    const existing = await this.dataSource
      .getRepository(OperationMaster)
      .findOne({
        where: [{ name: dto.name }, { code: generatedCode }],
      });
    if (existing) {
      throw new BadRequestException(
        'An operation with the same name or generated code already exists',
      );
    }

    const op = new OperationMaster();
    op.name = dto.name;
    op.code = generatedCode;
    op.description = dto.description;
    op.createdById = caller.id;
    op.isActive = true;
    return this.dataSource.getRepository(OperationMaster).save(op);
  }

  async assignPermission(dto: AssignPermissionDto) {
    const module = await this.dataSource.getRepository(ModuleMaster).findOne({
      where: { id: dto.moduleId },
    });
    if (!module) throw new NotFoundException('Module not found');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const permRepo = queryRunner.manager.getRepository(
        ModuleOperationPermission,
      );
      const opRepo = queryRunner.manager.getRepository(OperationMaster);

      const results: ModuleOperationPermission[] = [];

      for (const opId of dto.operationIds) {
        const operation = await opRepo.findOne({ where: { id: opId } });
        if (!operation)
          throw new NotFoundException(`Operation with ID ${opId} not found`);

        const generatedKey = `${module.code.toLowerCase()}:${operation.code.toLowerCase()}`;

        // Find existing mapping
        let perm = await permRepo.findOne({
          where: { moduleId: module.id, operationId: operation.id },
        });

        if (perm) {
          if (perm.isActive && !perm.isDeleted) {
            throw new BadRequestException(
              `Permission mapping with key '${generatedKey}' already exists and is active!`,
            );
          } else {
            // Upsert / Reactivate
            perm.isActive = true;
            perm.isDeleted = false;
            if (dto.description) perm.description = dto.description;
          }
        } else {
          // Create new
          perm = new ModuleOperationPermission();
          perm.moduleId = module.id;
          perm.operationId = operation.id;
          perm.description =
            dto.description ||
            `Grants permission to ${operation.name} in ${module.name}`;
          perm.isActive = true;
          perm.isDeleted = false;
        }

        const saved = await permRepo.save(perm);
        results.push(saved);
      }

      await queryRunner.commitTransaction();
      return {
        message: 'Permissions assigned successfully',
        permissions: results,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async listFeatures() {
    return this.dataSource
      .getRepository(PlatformFeature)
      .find({ where: { isActive: true, isDeleted: false } });
  }

  async listModules() {
    return this.dataSource.getRepository(ModuleMaster).find({
      where: { isActive: true, isDeleted: false },
      order: { displayOrder: 'ASC' },
    });
  }

  async listOperations() {
    return this.dataSource
      .getRepository(OperationMaster)
      .find({ where: { isActive: true, isDeleted: false } });
  }

  async seedPlatformData(apiKey?: string) {
    if (apiKey) {
      const secretKey = Config.getPlatformRegisterApiKey();
      if (apiKey !== secretKey) {
        throw new ForbiddenException('Invalid platform registration key');
      }
    }

    const featRepo = this.dataSource.getRepository(PlatformFeature);
    const priceRepo = this.dataSource.getRepository(PlatformFeaturePrice);
    const modRepo = this.dataSource.getRepository(ModuleMaster);
    const opRepo = this.dataSource.getRepository(OperationMaster);
    const permRepo = this.dataSource.getRepository(ModuleOperationPermission);
    const planRepo = this.dataSource.getRepository(SubscriptionPlan);
    const planPriceRepo = this.dataSource.getRepository(SubscriptionPlanPrice);
    const planMappingRepo = this.dataSource.getRepository(
      SubscriptionPlanPlatformFeatureMapping,
    );

    // 1. Platform Features
    const featuresData = [
      {
        name: 'Academic Management',
        desc: 'Manage classes, sections, and subjects',
        type: FeatureTypeEnum.CORE,
        usageUnit: UsageUnitEnum.NONE,
        isMetered: false,
        prices: [
          { cycle: BillingCycleEnum.MONTHLY, price: 150.0 },
          { cycle: BillingCycleEnum.QUARTERLY, price: 400.0 },
          { cycle: BillingCycleEnum.YEARLY, price: 1500.0 },
        ],
      },
      {
        name: 'Student Management',
        desc: 'Admit, track, and manage student lifecycle',
        type: FeatureTypeEnum.CORE,
        usageUnit: UsageUnitEnum.NONE,
        isMetered: false,
        prices: [
          { cycle: BillingCycleEnum.MONTHLY, price: 200.0 },
          { cycle: BillingCycleEnum.QUARTERLY, price: 550.0 },
          { cycle: BillingCycleEnum.YEARLY, price: 2000.0 },
        ],
      },
      {
        name: 'Attendance Management',
        desc: 'Real-time attendance tracking for students',
        type: FeatureTypeEnum.CORE,
        usageUnit: UsageUnitEnum.NONE,
        isMetered: false,
        prices: [
          { cycle: BillingCycleEnum.MONTHLY, price: 100.0 },
          { cycle: BillingCycleEnum.QUARTERLY, price: 280.0 },
          { cycle: BillingCycleEnum.YEARLY, price: 1000.0 },
        ],
      },
      {
        name: 'Fee Management',
        desc: 'Collect and track fee payments and structures',
        type: FeatureTypeEnum.CORE,
        usageUnit: UsageUnitEnum.NONE,
        isMetered: false,
        prices: [
          { cycle: BillingCycleEnum.MONTHLY, price: 250.0 },
          { cycle: BillingCycleEnum.QUARTERLY, price: 700.0 },
          { cycle: BillingCycleEnum.YEARLY, price: 2500.0 },
        ],
      },
      {
        name: 'Timetable Management',
        desc: 'Create and assign class/section schedules',
        type: FeatureTypeEnum.CORE,
        usageUnit: UsageUnitEnum.NONE,
        isMetered: false,
        prices: [
          { cycle: BillingCycleEnum.MONTHLY, price: 120.0 },
          { cycle: BillingCycleEnum.QUARTERLY, price: 320.0 },
          { cycle: BillingCycleEnum.YEARLY, price: 1200.0 },
        ],
      },
      {
        name: 'Exam Management',
        desc: 'Conduct online/offline exams and produce grade-sheets',
        type: FeatureTypeEnum.CORE,
        usageUnit: UsageUnitEnum.NONE,
        isMetered: false,
        prices: [
          { cycle: BillingCycleEnum.MONTHLY, price: 180.0 },
          { cycle: BillingCycleEnum.QUARTERLY, price: 500.0 },
          { cycle: BillingCycleEnum.YEARLY, price: 1800.0 },
        ],
      },
      {
        name: 'Report Management',
        desc: 'View comprehensive visual analytics and reports',
        type: FeatureTypeEnum.CORE,
        usageUnit: UsageUnitEnum.NONE,
        isMetered: false,
        prices: [
          { cycle: BillingCycleEnum.MONTHLY, price: 150.0 },
          { cycle: BillingCycleEnum.QUARTERLY, price: 400.0 },
          { cycle: BillingCycleEnum.YEARLY, price: 1500.0 },
        ],
      },
      {
        name: 'Dashboard Analytics',
        desc: 'Interactive charts and summary indicators of school stats',
        type: FeatureTypeEnum.CORE,
        usageUnit: UsageUnitEnum.NONE,
        isMetered: false,
        prices: [
          { cycle: BillingCycleEnum.MONTHLY, price: 100.0 },
          { cycle: BillingCycleEnum.QUARTERLY, price: 280.0 },
          { cycle: BillingCycleEnum.YEARLY, price: 1000.0 },
        ],
      },
      {
        name: 'Whatsapp Reminders',
        desc: 'Send automated student attendance & fee reminders via WhatsApp',
        type: FeatureTypeEnum.CORE,
        usageUnit: UsageUnitEnum.MESSAGES,
        isMetered: true,
        prices: [
          { cycle: BillingCycleEnum.MONTHLY, price: 300.0 },
          { cycle: BillingCycleEnum.QUARTERLY, price: 800.0 },
          { cycle: BillingCycleEnum.YEARLY, price: 3000.0 },
        ],
      },
    ];

    const seededFeatures: Record<string, PlatformFeature> = {};
    for (const fd of featuresData) {
      const generatedCode = this.generateCodeFromName(fd.name);
      let f = await featRepo.findOne({ where: { code: generatedCode } });
      if (!f) {
        f = new PlatformFeature();
        f.code = generatedCode;
        f.name = fd.name;
        f.description = fd.desc;
        f.featureType = fd.type;
        f.usageUnit = fd.usageUnit;
        f.isMetered = fd.isMetered;
        f.isActive = true;
        f = await featRepo.save(f);
      }
      seededFeatures[generatedCode] = f;

      // Seed prices for core features
      for (const fpData of fd.prices) {
        let fp = await priceRepo.findOne({
          where: { platformFeatureId: f.id, billingCycle: fpData.cycle },
        });
        if (!fp) {
          fp = new PlatformFeaturePrice();
          fp.platformFeatureId = f.id;
          fp.billingCycle = fpData.cycle;
          fp.price = fpData.price;
          fp.isActive = true;
          await priceRepo.save(fp);
        }
      }
    }

    // 2. Addon Features (Boosters / Metered Extras)
    const addonFeaturesData = [
      {
        code: 'STUDENT_BOOSTER_SMALL',
        name: 'Small Student Capacity Booster',
        desc: 'Adds 50 students capacity to your school',
        type: FeatureTypeEnum.ADDON,
        usageUnit: UsageUnitEnum.STUDENTS,
        isMetered: false,
        defaultLimit: '50',
        prices: [
          { cycle: BillingCycleEnum.MONTHLY, price: 500.0 },
          { cycle: BillingCycleEnum.QUARTERLY, price: 1350.0 },
          { cycle: BillingCycleEnum.YEARLY, price: 5000.0 },
        ],
      },
      {
        code: 'STUDENT_BOOSTER_MEDIUM',
        name: 'Medium Student Capacity Booster',
        desc: 'Adds 100 students capacity to your school',
        type: FeatureTypeEnum.ADDON,
        usageUnit: UsageUnitEnum.STUDENTS,
        isMetered: false,
        defaultLimit: '100',
        prices: [
          { cycle: BillingCycleEnum.MONTHLY, price: 800.0 },
          { cycle: BillingCycleEnum.QUARTERLY, price: 2200.0 },
          { cycle: BillingCycleEnum.YEARLY, price: 8000.0 },
        ],
      },
      {
        code: 'WHATSAPP_BOOSTER_SMALL',
        name: 'Small WhatsApp Message Booster',
        desc: 'Adds 100 messages to your WhatsApp reminders balance',
        type: FeatureTypeEnum.ADDON,
        usageUnit: UsageUnitEnum.MESSAGES,
        isMetered: false,
        defaultLimit: '100',
        prices: [
          { cycle: BillingCycleEnum.MONTHLY, price: 50.0 },
          { cycle: BillingCycleEnum.QUARTERLY, price: 135.0 },
          { cycle: BillingCycleEnum.YEARLY, price: 500.0 },
        ],
      },
      {
        code: 'WHATSAPP_BOOSTER_MEDIUM',
        name: 'Medium WhatsApp Message Booster',
        desc: 'Adds 1000 messages to your WhatsApp reminders balance',
        type: FeatureTypeEnum.ADDON,
        usageUnit: UsageUnitEnum.MESSAGES,
        isMetered: false,
        defaultLimit: '1000',
        prices: [
          { cycle: BillingCycleEnum.MONTHLY, price: 400.0 },
          { cycle: BillingCycleEnum.QUARTERLY, price: 1100.0 },
          { cycle: BillingCycleEnum.YEARLY, price: 4000.0 },
        ],
      },
    ];
    for (const afd of addonFeaturesData) {
      let f = await featRepo.findOne({ where: { code: afd.code } });
      if (!f) {
        f = new PlatformFeature();
        f.code = afd.code;
        f.name = afd.name;
        f.description = afd.desc;
        f.featureType = afd.type;
        f.usageUnit = afd.usageUnit;
        f.isMetered = afd.isMetered;
        f.defaultLimit = afd.defaultLimit;
        f.isActive = true;
        f = await featRepo.save(f);
      } else if (!f.defaultLimit) {
        f.defaultLimit = afd.defaultLimit;
        f = await featRepo.save(f);
      }
      seededFeatures[afd.code] = f;

      // Seed multiple prices for Addons
      for (const fpData of afd.prices) {
        let fp = await priceRepo.findOne({
          where: { platformFeatureId: f.id, billingCycle: fpData.cycle },
        });
        if (!fp) {
          fp = new PlatformFeaturePrice();
          fp.platformFeatureId = f.id;
          fp.billingCycle = fpData.cycle;
          fp.price = fpData.price;
          fp.isActive = true;
          await priceRepo.save(fp);
        }
      }
    }

    // 3. Module Masters (Sidebar navigation with nesting)
    const modulesData: Array<{
      name: string;
      route: string;
      icon: string;
      description?: string;
      displayOrder: number;
      isMenuGroup: boolean;
      featureCode: string | null;
      parentName: string | null;
      showInSidebar: boolean;
    }> = [
      {
        name: 'Dashboard',
        route: '/dashboard',
        icon: 'dashboard',
        displayOrder: 1,
        isMenuGroup: false,
        featureCode: 'DASHBOARD_ANALYTICS',
        parentName: null,
        showInSidebar: true,
      },
      {
        name: 'Academics',
        route: '/academics',
        icon: 'school',
        displayOrder: 2,
        isMenuGroup: true,
        featureCode: 'ACADEMIC_MANAGEMENT',
        parentName: null,
        showInSidebar: true,
      },
      {
        name: 'Classes',
        route: '/academics/classes',
        icon: 'class',
        displayOrder: 3,
        isMenuGroup: false,
        featureCode: 'ACADEMIC_MANAGEMENT',
        parentName: 'Academics',
        showInSidebar: true,
      },
      {
        name: 'Subjects',
        route: '/academics/subjects',
        icon: 'book',
        displayOrder: 4,
        isMenuGroup: false,
        featureCode: 'ACADEMIC_MANAGEMENT',
        parentName: 'Academics',
        showInSidebar: true,
      },
      {
        name: 'Sections',
        route: '/academics/sections',
        icon: 'view_list',
        displayOrder: 5,
        isMenuGroup: false,
        featureCode: 'ACADEMIC_MANAGEMENT',
        parentName: 'Academics',
        showInSidebar: true,
      },
      {
        name: 'Academic Mapping',
        route: '/academics/class-section-subject',
        icon: 'assignment_turned_in',
        displayOrder: 6,
        isMenuGroup: false,
        featureCode: 'ACADEMIC_MANAGEMENT',
        parentName: 'Academics',
        showInSidebar: true,
      },
      {
        name: 'Academic Sessions',
        route: '/academics/sessions',
        icon: 'date_range',
        displayOrder: 6,
        isMenuGroup: false,
        featureCode: 'ACADEMIC_MANAGEMENT',
        parentName: 'Academics',
        showInSidebar: true,
      },
      {
        name: 'Academic Years',
        route: '/academics/years',
        icon: 'calendar_today',
        displayOrder: 6.1,
        isMenuGroup: false,
        featureCode: 'ACADEMIC_MANAGEMENT',
        parentName: 'Academics',
        showInSidebar: true,
      },

      {
        name: 'Students',
        route: '/students',
        icon: 'people',
        displayOrder: 7,
        isMenuGroup: false,
        featureCode: 'STUDENT_MANAGEMENT',
        parentName: null,
        showInSidebar: true,
      },
      {
        name: 'Staff',
        route: '/staff',
        icon: 'badge',
        displayOrder: 7.5,
        isMenuGroup: false,
        featureCode: null,
        parentName: null,
        showInSidebar: true,
      },
      {
        name: 'Attendance',
        route: '/attendance',
        icon: 'check_circle',
        displayOrder: 8,
        isMenuGroup: true,
        featureCode: 'ATTENDANCE_MANAGEMENT',
        parentName: null,
        showInSidebar: true,
      },
      {
        name: 'Attendance History',
        route: '/attendance/history',
        icon: 'history',
        displayOrder: 81,
        isMenuGroup: false,
        featureCode: 'ATTENDANCE_MANAGEMENT',
        parentName: 'Attendance',
        showInSidebar: true,
      },
      {
        name: 'Take Attendance',
        route: '/attendance/take',
        icon: 'how_to_reg',
        displayOrder: 82,
        isMenuGroup: false,
        featureCode: 'ATTENDANCE_MANAGEMENT',
        parentName: 'Attendance',
        showInSidebar: true,
      },
      {
        name: 'Fees',
        route: '/fees',
        icon: 'attach_money',
        displayOrder: 9,
        isMenuGroup: false,
        featureCode: 'FEE_MANAGEMENT',
        parentName: null,
        showInSidebar: true,
      },
      {
        name: 'Timetable',
        route: '/timetable',
        icon: 'schedule',
        displayOrder: 10,
        isMenuGroup: false,
        featureCode: 'TIMETABLE_MANAGEMENT',
        parentName: null,
        showInSidebar: true,
      },
      {
        name: 'Exams',
        route: '/exams',
        icon: 'assignment',
        displayOrder: 11,
        isMenuGroup: false,
        featureCode: 'EXAM_MANAGEMENT',
        parentName: null,
        showInSidebar: true,
      },
      {
        name: 'Homework',
        route: '/homework',
        icon: 'assignment_turned_in',
        displayOrder: 11.5,
        isMenuGroup: false,
        featureCode: null,
        parentName: null,
        showInSidebar: true,
      },
      {
        name: 'Reports',
        route: '/reports',
        icon: 'bar_chart',
        displayOrder: 12,
        isMenuGroup: false,
        featureCode: 'REPORT_MANAGEMENT',
        parentName: null,
        showInSidebar: true,
      },
      {
        name: 'Announcements',
        route: '/announcements',
        icon: 'bell',
        description:
          'Create, publish, and view school announcements and notices',
        displayOrder: 16,
        isMenuGroup: false,
        featureCode: null,
        parentName: null,
        showInSidebar: true,
      },
      {
        name: 'Tasks',
        route: '/tasks',
        icon: 'check_square',
        description:
          'Assign, track, and complete operational tasks and checklists',
        displayOrder: 17,
        isMenuGroup: false,
        featureCode: null,
        parentName: null,
        showInSidebar: true,
      },

      {
        name: 'Administration',
        route: '/administration',
        icon: 'settings',
        displayOrder: 90,
        isMenuGroup: true,
        featureCode: null,
        parentName: null,
        showInSidebar: true,
      },
      {
        name: 'School Users',
        route: '/administration/users',
        icon: 'manage_accounts',
        displayOrder: 91,
        isMenuGroup: false,
        featureCode: null,
        parentName: 'Administration',
        showInSidebar: true,
      },
      {
        name: 'Student Credentials',
        route: '/students/credentials',
        icon: 'key',
        displayOrder: 91.1,
        isMenuGroup: false,
        featureCode: 'STUDENT_MANAGEMENT',
        parentName: null,
        showInSidebar: false,
      },
      {
        name: 'Staff Credentials',
        route: '/administration/staff-credentials',
        icon: 'badge',
        displayOrder: 91.2,
        isMenuGroup: false,
        featureCode: null,
        parentName: 'Administration',
        showInSidebar: false,
      },
      {
        name: 'School Roles',
        route: '/administration/roles',
        icon: 'admin_panel_settings',
        displayOrder: 92,
        isMenuGroup: false,
        featureCode: null,
        parentName: 'Administration',
        showInSidebar: true,
      },
      {
        name: 'Subscription',
        route: '/administration/subscription',
        icon: 'payment',
        displayOrder: 93,
        isMenuGroup: false,
        featureCode: null,
        parentName: 'Administration',
        showInSidebar: true,
      },
      {
        name: 'Finance Order',
        route: '/administration/orders',
        icon: 'shopping_cart',
        displayOrder: 94,
        isMenuGroup: false,
        featureCode: null,
        parentName: 'Administration',
        showInSidebar: true,
      },
      {
        name: 'Finance Invoice',
        route: '/administration/invoices',
        icon: 'receipt',
        displayOrder: 95,
        isMenuGroup: false,
        featureCode: null,
        parentName: 'Administration',
        showInSidebar: true,
      },
      {
        name: 'School Settings',
        route: '/settings/school',
        icon: 'settings',
        description:
          'Manage school identity, principal assignment, official signatures and session branding',
        displayOrder: 95.5,
        isMenuGroup: false,
        featureCode: null,
        parentName: 'Administration',
        showInSidebar: true,
      },
      {
        name: 'Schools',
        route: '/schools',
        icon: 'business',
        description: 'School workspace configuration and identity management',
        displayOrder: 95.6,
        isMenuGroup: false,
        featureCode: null,
        parentName: null,
        showInSidebar: true,
      },

      // Platform administration modules (not shown in school sidebar)
      {
        name: 'Platform Features',
        route: '/platform/features',
        icon: 'extension',
        displayOrder: 100,
        isMenuGroup: false,
        featureCode: null,
        parentName: null,
        showInSidebar: false,
      },
      {
        name: 'Platform Modules',
        route: '/platform/modules',
        icon: 'view_module',
        displayOrder: 101,
        isMenuGroup: false,
        featureCode: null,
        parentName: null,
        showInSidebar: false,
      },
      {
        name: 'Platform Schools',
        route: '/platform/schools',
        icon: 'business',
        displayOrder: 102,
        isMenuGroup: false,
        featureCode: null,
        parentName: null,
        showInSidebar: false,
      },
      {
        name: 'Platform Owners',
        route: '/platform/owners',
        icon: 'supervised_user_circle',
        displayOrder: 103,
        isMenuGroup: false,
        featureCode: null,
        parentName: null,
        showInSidebar: false,
      },
      {
        name: 'Platform Students',
        route: '/platform/students',
        icon: 'face',
        displayOrder: 104,
        isMenuGroup: false,
        featureCode: null,
        parentName: null,
        showInSidebar: false,
      },
      {
        name: 'Platform Staff',
        route: '/platform/staff',
        icon: 'badge',
        displayOrder: 105,
        isMenuGroup: false,
        featureCode: null,
        parentName: null,
        showInSidebar: false,
      },
    ];

    try {
      await this.dataSource.query(`
          SELECT setval(
            pg_get_serial_sequence('"e_schooling"."module_masters"', 'id'),
            COALESCE(MAX(id), 1)
          ) FROM "e_schooling"."module_masters";
        `);
    } catch (seqErr) {
      console.warn(
        'Could not reset sequence for module_masters:',
        (seqErr as Error).message,
      );
    }

    const seededModules: Record<string, ModuleMaster> = {};
    for (const md of modulesData) {
      const generatedCode = this.generateCodeFromName(md.name);
      let m = await modRepo.findOne({ where: { code: generatedCode } });
      if (!m) {
        m = await modRepo.findOne({ where: { name: md.name } });
      }
      if (!m) {
        m = new ModuleMaster();
        m.code = generatedCode;
        m.isActive = true;
      }
      m.name = md.name;
      m.routePath = md.route;
      m.icon = md.icon;
      m.description = md.description || undefined;
      m.displayOrder = Math.floor(md.displayOrder ?? 0);
      m.showInSidebar = md.showInSidebar !== false;
      m.isMenuGroup = md.isMenuGroup;
      if (md.featureCode && seededFeatures[md.featureCode]) {
        m.platformFeatureId = seededFeatures[md.featureCode].id;
      } else {
        m.platformFeatureId = undefined;
      }
      if (md.parentName) {
        const parentCode = this.generateCodeFromName(md.parentName);
        const parentMod = seededModules[parentCode];
        if (parentMod) {
          m.parentModuleId = parentMod.id;
        }
      } else {
        m.parentModuleId = undefined;
      }
      try {
        m = await modRepo.save(m);
      } catch (err) {
        const existing =
          (await modRepo.findOne({ where: { code: generatedCode } })) ||
          (await modRepo.findOne({ where: { name: md.name } }));
        if (existing) {
          existing.parentModuleId = m.parentModuleId;
          existing.displayOrder = m.displayOrder;
          m = await modRepo.save(existing);
        } else {
          console.error(
            `❌ Module seed save error for "${md.name}":`,
            (err as Error).message,
          );
        }
      }
      seededModules[generatedCode] = m;
    }

    // 4. Operations (view, create, update, delete)
    const opsData = [
      { name: 'view', desc: 'Allows read-only access to components' },
      { name: 'create', desc: 'Allows creating new records' },
      { name: 'update', desc: 'Allows modifying existing records' },
      { name: 'delete', desc: 'Allows soft-deleting/revoking records' },
      {
        name: 'view_assigned',
        desc: 'Allows viewing only assigned records (e.g. assigned classes/sections)',
      },
    ];
    const seededOps: Record<string, OperationMaster> = {};
    for (const od of opsData) {
      const generatedCode = this.generateCodeFromName(od.name);
      let o = await opRepo.findOne({ where: { code: generatedCode } });
      if (!o) {
        o = new OperationMaster();
        o.code = generatedCode;
        o.name = od.name;
        o.description = od.desc;
        o.isActive = true;
        try {
          o = await opRepo.save(o);
        } catch {
          const existing = await opRepo.findOne({
            where: { code: generatedCode },
          });
          if (existing) o = existing;
        }
      }
      seededOps[generatedCode] = o;
    }

    // 5. Module Operation Permissions (Linking Modules to Operations)
    const permsMap = [
      { modCode: 'DASHBOARD', opCode: 'VIEW' },

      { modCode: 'ATTENDANCE', opCode: 'VIEW' },
      { modCode: 'ATTENDANCE', opCode: 'CREATE' },
      { modCode: 'ATTENDANCE', opCode: 'UPDATE' },
      { modCode: 'ATTENDANCE', opCode: 'DELETE' },

      { modCode: 'ATTENDANCE_HISTORY', opCode: 'VIEW' },
      { modCode: 'ATTENDANCE_HISTORY', opCode: 'CREATE' },
      { modCode: 'ATTENDANCE_HISTORY', opCode: 'UPDATE' },
      { modCode: 'ATTENDANCE_HISTORY', opCode: 'DELETE' },

      { modCode: 'TAKE_ATTENDANCE', opCode: 'VIEW' },
      { modCode: 'TAKE_ATTENDANCE', opCode: 'CREATE' },
      { modCode: 'TAKE_ATTENDANCE', opCode: 'UPDATE' },
      { modCode: 'TAKE_ATTENDANCE', opCode: 'DELETE' },

      { modCode: 'CLASSES', opCode: 'VIEW' },
      { modCode: 'CLASSES', opCode: 'VIEW_ASSIGNED' },
      { modCode: 'CLASSES', opCode: 'CREATE' },
      { modCode: 'CLASSES', opCode: 'UPDATE' },
      { modCode: 'CLASSES', opCode: 'DELETE' },

      { modCode: 'SUBJECTS', opCode: 'VIEW' },
      { modCode: 'SUBJECTS', opCode: 'CREATE' },
      { modCode: 'SUBJECTS', opCode: 'UPDATE' },
      { modCode: 'SUBJECTS', opCode: 'DELETE' },

      { modCode: 'SECTIONS', opCode: 'VIEW' },
      { modCode: 'SECTIONS', opCode: 'VIEW_ASSIGNED' },
      { modCode: 'SECTIONS', opCode: 'CREATE' },
      { modCode: 'SECTIONS', opCode: 'UPDATE' },
      { modCode: 'SECTIONS', opCode: 'DELETE' },

      { modCode: 'ACADEMIC_MAPPING', opCode: 'VIEW' },
      { modCode: 'ACADEMIC_MAPPING', opCode: 'CREATE' },
      { modCode: 'ACADEMIC_MAPPING', opCode: 'UPDATE' },
      { modCode: 'ACADEMIC_MAPPING', opCode: 'DELETE' },
      { modCode: 'ACADEMIC_YEARS', opCode: 'VIEW' },
      { modCode: 'ACADEMIC_YEARS', opCode: 'CREATE' },
      { modCode: 'ACADEMIC_YEARS', opCode: 'UPDATE' },
      { modCode: 'ACADEMIC_YEARS', opCode: 'DELETE' },

      { modCode: 'ACADEMIC_SESSIONS', opCode: 'VIEW' },
      { modCode: 'ACADEMIC_SESSIONS', opCode: 'CREATE' },
      { modCode: 'ACADEMIC_SESSIONS', opCode: 'UPDATE' },
      { modCode: 'ACADEMIC_SESSIONS', opCode: 'DELETE' },

      { modCode: 'STUDENTS', opCode: 'VIEW' },
      { modCode: 'STUDENTS', opCode: 'CREATE' },
      { modCode: 'STUDENTS', opCode: 'UPDATE' },
      { modCode: 'STUDENTS', opCode: 'DELETE' },

      { modCode: 'FEES', opCode: 'VIEW' },
      { modCode: 'FEES', opCode: 'CREATE' },
      { modCode: 'FEES', opCode: 'UPDATE' },
      { modCode: 'FEES', opCode: 'DELETE' },

      { modCode: 'TIMETABLE', opCode: 'VIEW' },
      { modCode: 'TIMETABLE', opCode: 'VIEW_ASSIGNED' },
      { modCode: 'TIMETABLE', opCode: 'CREATE' },
      { modCode: 'TIMETABLE', opCode: 'UPDATE' },
      { modCode: 'TIMETABLE', opCode: 'DELETE' },

      { modCode: 'EXAMS', opCode: 'VIEW' },
      { modCode: 'EXAMS', opCode: 'CREATE' },
      { modCode: 'EXAMS', opCode: 'UPDATE' },
      { modCode: 'EXAMS', opCode: 'DELETE' },

      { modCode: 'HOMEWORK', opCode: 'VIEW' },
      { modCode: 'HOMEWORK', opCode: 'VIEW_ASSIGNED' },
      { modCode: 'HOMEWORK', opCode: 'CREATE' },
      { modCode: 'HOMEWORK', opCode: 'UPDATE' },
      { modCode: 'HOMEWORK', opCode: 'DELETE' },

      { modCode: 'STAFF', opCode: 'VIEW' },
      { modCode: 'STAFF', opCode: 'VIEW_ASSIGNED' },
      { modCode: 'STAFF', opCode: 'CREATE' },
      { modCode: 'STAFF', opCode: 'UPDATE' },
      { modCode: 'STAFF', opCode: 'DELETE' },

      { modCode: 'REPORTS', opCode: 'VIEW' },

      { modCode: 'ANNOUNCEMENTS', opCode: 'VIEW' },
      { modCode: 'ANNOUNCEMENTS', opCode: 'CREATE' },
      { modCode: 'ANNOUNCEMENTS', opCode: 'UPDATE' },
      { modCode: 'ANNOUNCEMENTS', opCode: 'DELETE' },

      { modCode: 'TASKS', opCode: 'VIEW' },
      { modCode: 'TASKS', opCode: 'CREATE' },
      { modCode: 'TASKS', opCode: 'UPDATE' },
      { modCode: 'TASKS', opCode: 'DELETE' },

      { modCode: 'SCHOOL_ROLES', opCode: 'VIEW' },
      { modCode: 'SCHOOL_ROLES', opCode: 'CREATE' },
      { modCode: 'SCHOOL_ROLES', opCode: 'UPDATE' },
      { modCode: 'SCHOOL_ROLES', opCode: 'DELETE' },

      { modCode: 'SCHOOL_USERS', opCode: 'VIEW' },
      { modCode: 'SCHOOL_USERS', opCode: 'CREATE' },
      { modCode: 'SCHOOL_USERS', opCode: 'UPDATE' },
      { modCode: 'SCHOOL_USERS', opCode: 'DELETE' },

      { modCode: 'STUDENT_CREDENTIALS', opCode: 'VIEW' },
      { modCode: 'STUDENT_CREDENTIALS', opCode: 'CREATE' },
      { modCode: 'STUDENT_CREDENTIALS', opCode: 'UPDATE' },
      { modCode: 'STUDENT_CREDENTIALS', opCode: 'DELETE' },

      { modCode: 'STAFF_CREDENTIALS', opCode: 'VIEW' },
      { modCode: 'STAFF_CREDENTIALS', opCode: 'CREATE' },
      { modCode: 'STAFF_CREDENTIALS', opCode: 'UPDATE' },
      { modCode: 'STAFF_CREDENTIALS', opCode: 'DELETE' },

      { modCode: 'SUBSCRIPTION', opCode: 'VIEW' },
      { modCode: 'SUBSCRIPTION', opCode: 'CREATE' },
      { modCode: 'SUBSCRIPTION', opCode: 'UPDATE' },
      { modCode: 'SUBSCRIPTION', opCode: 'DELETE' },

      { modCode: 'FINANCE_ORDER', opCode: 'VIEW' },
      { modCode: 'FINANCE_INVOICE', opCode: 'VIEW' },

      { modCode: 'SCHOOL_SETTINGS', opCode: 'VIEW' },
      { modCode: 'SCHOOL_SETTINGS', opCode: 'CREATE' },
      { modCode: 'SCHOOL_SETTINGS', opCode: 'UPDATE' },
      { modCode: 'SCHOOL_SETTINGS', opCode: 'DELETE' },

      { modCode: 'SCHOOLS', opCode: 'VIEW' },
      { modCode: 'SCHOOLS', opCode: 'CREATE' },
      { modCode: 'SCHOOLS', opCode: 'UPDATE' },
      { modCode: 'SCHOOLS', opCode: 'DELETE' },

      // Platform modules
      { modCode: 'PLATFORM_FEATURES', opCode: 'VIEW' },
      { modCode: 'PLATFORM_FEATURES', opCode: 'CREATE' },
      { modCode: 'PLATFORM_FEATURES', opCode: 'UPDATE' },
      { modCode: 'PLATFORM_FEATURES', opCode: 'DELETE' },

      { modCode: 'PLATFORM_MODULES', opCode: 'VIEW' },
      { modCode: 'PLATFORM_MODULES', opCode: 'CREATE' },
      { modCode: 'PLATFORM_MODULES', opCode: 'UPDATE' },
      { modCode: 'PLATFORM_MODULES', opCode: 'DELETE' },

      { modCode: 'PLATFORM_SCHOOLS', opCode: 'VIEW' },
      { modCode: 'PLATFORM_SCHOOLS', opCode: 'CREATE' },
      { modCode: 'PLATFORM_SCHOOLS', opCode: 'UPDATE' },
      { modCode: 'PLATFORM_SCHOOLS', opCode: 'DELETE' },

      { modCode: 'PLATFORM_OWNERS', opCode: 'VIEW' },
      { modCode: 'PLATFORM_OWNERS', opCode: 'CREATE' },
      { modCode: 'PLATFORM_OWNERS', opCode: 'UPDATE' },
      { modCode: 'PLATFORM_OWNERS', opCode: 'DELETE' },

      { modCode: 'PLATFORM_STUDENTS', opCode: 'VIEW' },
      { modCode: 'PLATFORM_STAFF', opCode: 'VIEW' },
    ];

    for (const pm of permsMap) {
      const mod = seededModules[pm.modCode];
      const op = seededOps[pm.opCode];
      if (mod && op) {
        let p = await permRepo.findOne({
          where: { moduleId: mod.id, operationId: op.id },
        });
        if (!p) {
          p = new ModuleOperationPermission();
          p.moduleId = mod.id;
          p.operationId = op.id;
          p.description = `Grants permission to ${op.name} in ${mod.name}`;
          p.isActive = true;
          try {
            await permRepo.save(p);
          } catch {
            // Ignore duplicate constraint
          }
        }
      }
    }

    // 6. Subscription Plans
    const plansData = [
      {
        code: PlanCodeEnum.TRIAL,
        name: 'Free Trial Plan',
        desc: '1 month trial capacity',
        maxSt: 20,
        maxSf: 5,
        maxCl: 5,
        maxSc: 5,
        prices: [],
      },
      {
        code: PlanCodeEnum.BASIC,
        name: 'Basic Plan',
        desc: 'For smaller schools starting out',
        maxSt: 100,
        maxSf: 20,
        maxCl: 10,
        maxSc: 20,
        prices: [
          { cycle: BillingCycleEnum.MONTHLY, price: 1000.0 },
          { cycle: BillingCycleEnum.QUARTERLY, price: 2700.0 },
          { cycle: BillingCycleEnum.YEARLY, price: 10000.0 },
        ],
      },
      {
        code: PlanCodeEnum.STANDARD,
        name: 'Standard Plan',
        desc: 'Ideal for medium size operations',
        maxSt: 500,
        maxSf: 50,
        maxCl: 30,
        maxSc: 60,
        prices: [
          { cycle: BillingCycleEnum.MONTHLY, price: 2500.0 },
          { cycle: BillingCycleEnum.QUARTERLY, price: 6800.0 },
          { cycle: BillingCycleEnum.YEARLY, price: 25000.0 },
        ],
      },
      {
        code: PlanCodeEnum.PREMIUM,
        name: 'Premium Plan',
        desc: 'Enterprise-grade unlimited capacity',
        maxSt: null,
        maxSf: null,
        maxCl: null,
        maxSc: null,
        prices: [
          { cycle: BillingCycleEnum.MONTHLY, price: 5000.0 },
          { cycle: BillingCycleEnum.QUARTERLY, price: 13500.0 },
          { cycle: BillingCycleEnum.YEARLY, price: 50000.0 },
        ],
      },
    ];

    for (const pd of plansData) {
      let plan = await planRepo.findOne({ where: { code: pd.code } });
      if (!plan) {
        plan = new SubscriptionPlan();
        plan.code = pd.code;
        plan.name = pd.name;
        plan.description = pd.desc;
        plan.maxStudents = pd.maxSt;
        plan.maxStaff = pd.maxSf;
        plan.maxClasses = pd.maxCl;
        plan.maxSections = pd.maxSc;
        plan.isActive = true;
        plan = await planRepo.save(plan);
      }

      // Seed prices
      for (const pp of pd.prices) {
        let priceObj = await planPriceRepo.findOne({
          where: { subscriptionPlanId: plan.id, billingCycle: pp.cycle },
        });
        if (!priceObj) {
          priceObj = new SubscriptionPlanPrice();
          priceObj.subscriptionPlanId = plan.id;
          priceObj.billingCycle = pp.cycle;
          priceObj.price = pp.price;
          priceObj.isActive = true;
          await planPriceRepo.save(priceObj);
        }
      }

      // 7. Associate core and metered features to plans
      const planFeatures: { code: string; limit: string | null }[] = [];
      if (pd.code === PlanCodeEnum.TRIAL) {
        planFeatures.push(
          { code: 'ACADEMIC_MANAGEMENT', limit: null },
          { code: 'STUDENT_MANAGEMENT', limit: null },
          { code: 'ATTENDANCE_MANAGEMENT', limit: null },
          { code: 'TIMETABLE_MANAGEMENT', limit: null },
        );
      } else if (pd.code === PlanCodeEnum.BASIC) {
        planFeatures.push(
          { code: 'ACADEMIC_MANAGEMENT', limit: null },
          { code: 'STUDENT_MANAGEMENT', limit: null },
          { code: 'ATTENDANCE_MANAGEMENT', limit: null },
        );
      } else if (pd.code === PlanCodeEnum.STANDARD) {
        planFeatures.push(
          { code: 'ACADEMIC_MANAGEMENT', limit: null },
          { code: 'STUDENT_MANAGEMENT', limit: null },
          { code: 'ATTENDANCE_MANAGEMENT', limit: null },
          { code: 'FEE_MANAGEMENT', limit: null },
          { code: 'TIMETABLE_MANAGEMENT', limit: null },
          { code: 'DASHBOARD_ANALYTICS', limit: null },
          { code: 'WHATSAPP_REMINDERS', limit: '1000' }, // 1,000 free monthly messages
        );
      } else if (pd.code === PlanCodeEnum.PREMIUM) {
        planFeatures.push(
          { code: 'ACADEMIC_MANAGEMENT', limit: null },
          { code: 'STUDENT_MANAGEMENT', limit: null },
          { code: 'ATTENDANCE_MANAGEMENT', limit: null },
          { code: 'FEE_MANAGEMENT', limit: null },
          { code: 'TIMETABLE_MANAGEMENT', limit: null },
          { code: 'EXAM_MANAGEMENT', limit: null },
          { code: 'REPORT_MANAGEMENT', limit: null },
          { code: 'DASHBOARD_ANALYTICS', limit: null },
          { code: 'WHATSAPP_REMINDERS', limit: '5000' }, // 5,000 free monthly messages
        );
      }

      for (const item of planFeatures) {
        const f = seededFeatures[item.code];
        if (f) {
          let mapping = await planMappingRepo.findOne({
            where: { subscriptionPlanId: plan.id, platformFeatureId: f.id },
          });
          if (!mapping) {
            mapping = new SubscriptionPlanPlatformFeatureMapping();
            mapping.subscriptionPlanId = plan.id;
            mapping.platformFeatureId = f.id;
          }
          mapping.isEnabled = true;
          mapping.limitValue = item.limit;
          mapping.isActive = true;
          await planMappingRepo.save(mapping);
        }
      }
    }

    return {
      message:
        'Metadata seeded successfully! Ready for manual and frontend testing.',
    };
  }
}
