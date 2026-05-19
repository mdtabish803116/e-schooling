import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PlatformFeature } from '../../models/entities/entitlement/platform-feature.entity';
import { ModuleMaster } from '../../models/entities/rbac/module-master.entity';
import { OperationMaster } from '../../models/entities/rbac/operation-master.entity';
import { ModuleOperationPermission } from '../../models/entities/rbac/module-operation-permission.entity';
import { CreatePlatformFeatureDto, CreateModuleMasterDto, CreateOperationMasterDto, AssignPermissionDto } from '../../interfaces/request/platform/platform-management.dto';
import { AuthContext } from '../../interfaces/auth-context.interface';
import { Config } from '../../config/index';

// Seeding Imports
import { PlatformFeaturePrice } from '../../models/entities/entitlement/plaform-feature-price.entity';
import { SubscriptionPlan } from '../../models/entities/subscription/subscription-plan.entity';
import { SubscriptionPlanPrice } from '../../models/entities/subscription/subscription-plan-price.entity';
import { SubscriptionPlanPlatformFeatureMapping } from '../../models/entities/entitlement/subscription-plan-platform-feature-mapping.entity';
import { BillingCycleEnum, FeatureTypeEnum, UsageUnitEnum, PlanCodeEnum } from '../../models/enums/enums';

@Injectable()
export class PlatformService {
  constructor(private dataSource: DataSource) { }

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
      throw new BadRequestException('Invalid feature name: code could not be generated');
    }

    // Check if name OR code already exists
    const existing = await this.dataSource.getRepository(PlatformFeature).findOne({
      where: [
        { name: dto.name },
        { code: generatedCode }
      ]
    });
    if (existing) {
      throw new BadRequestException('A feature with the same name or generated code already exists');
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
      throw new BadRequestException('Invalid module name: code could not be generated');
    }

    // Check if name OR code already exists
    const existing = await this.dataSource.getRepository(ModuleMaster).findOne({
      where: [
        { name: dto.name },
        { code: generatedCode }
      ]
    });
    if (existing) {
      throw new BadRequestException('A module with the same name or generated code already exists');
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
      throw new BadRequestException('Invalid operation name: code could not be generated');
    }

    // Check if name OR code already exists
    const existing = await this.dataSource.getRepository(OperationMaster).findOne({
      where: [
        { name: dto.name },
        { code: generatedCode }
      ]
    });
    if (existing) {
      throw new BadRequestException('An operation with the same name or generated code already exists');
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
      where: { id: dto.moduleId }
    });
    if (!module) throw new NotFoundException('Module not found');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const permRepo = queryRunner.manager.getRepository(ModuleOperationPermission);
      const opRepo = queryRunner.manager.getRepository(OperationMaster);

      const results: ModuleOperationPermission[] = [];

      for (const opId of dto.operationIds) {
        const operation = await opRepo.findOne({ where: { id: opId } });
        if (!operation) throw new NotFoundException(`Operation with ID ${opId} not found`);

        const generatedKey = `${module.code.toLowerCase()}:${operation.code.toLowerCase()}`;

        // Find existing mapping
        let perm = await permRepo.findOne({
          where: { moduleId: module.id, operationId: operation.id }
        });

        if (perm) {
          if (perm.isActive && !perm.isDeleted) {
            throw new BadRequestException(`Permission mapping with key '${generatedKey}' already exists and is active!`);
          } else {
            // Upsert / Reactivate
            perm.isActive = true;
            perm.isDeleted = false;
            perm.key = generatedKey;
            if (dto.description) perm.description = dto.description;
          }
        } else {
          // Create new
          perm = new ModuleOperationPermission();
          perm.moduleId = module.id;
          perm.operationId = operation.id;
          perm.key = generatedKey;
          perm.description = dto.description || `Grants permission to ${operation.name} in ${module.name}`;
          perm.isActive = true;
          perm.isDeleted = false;
        }

        const saved = await permRepo.save(perm);
        results.push(saved);
      }

      await queryRunner.commitTransaction();
      return {
        message: 'Permissions assigned successfully',
        permissions: results
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async removePermission(id: string) {
    const permRepo = this.dataSource.getRepository(ModuleOperationPermission);
    const perm = await permRepo.findOne({ where: { id } });
    if (!perm) throw new NotFoundException('Permission mapping not found');

    perm.isActive = false;
    perm.isDeleted = true;
    await permRepo.save(perm);

    return { message: 'Permission mapping soft-deleted successfully (isActive set to false, isDeleted set to true)' };
  }

  async listFeatures() {
    return this.dataSource.getRepository(PlatformFeature).find({ where: { isActive: true, isDeleted: false } });
  }

  async listModules() {
    return this.dataSource.getRepository(ModuleMaster).find({ where: { isActive: true, isDeleted: false }, order: { displayOrder: 'ASC' } });
  }

  async listOperations() {
    return this.dataSource.getRepository(OperationMaster).find({ where: { isActive: true, isDeleted: false } });
  }

  async seedPlatformData(apiKey: string) {
    const secretKey = Config.getPlatformRegisterApiKey();
    if (apiKey !== secretKey) {
      throw new ForbiddenException('Invalid platform registration key');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const featRepo = queryRunner.manager.getRepository(PlatformFeature);
      const priceRepo = queryRunner.manager.getRepository(PlatformFeaturePrice);
      const modRepo = queryRunner.manager.getRepository(ModuleMaster);
      const opRepo = queryRunner.manager.getRepository(OperationMaster);
      const permRepo = queryRunner.manager.getRepository(ModuleOperationPermission);
      const planRepo = queryRunner.manager.getRepository(SubscriptionPlan);
      const planPriceRepo = queryRunner.manager.getRepository(SubscriptionPlanPrice);
      const planMappingRepo = queryRunner.manager.getRepository(SubscriptionPlanPlatformFeatureMapping);

      // 1. Platform Features
      const featuresData = [
        { name: 'Academic Management', desc: 'Manage classes, sections, and subjects', type: FeatureTypeEnum.CORE, usageUnit: UsageUnitEnum.NONE, isMetered: false, prices: [{ cycle: BillingCycleEnum.MONTHLY, price: 150.00 }, { cycle: BillingCycleEnum.QUARTERLY, price: 400.00 }, { cycle: BillingCycleEnum.YEARLY, price: 1500.00 }] },
        { name: 'Student Management', desc: 'Admit, track, and manage student lifecycle', type: FeatureTypeEnum.CORE, usageUnit: UsageUnitEnum.NONE, isMetered: false, prices: [{ cycle: BillingCycleEnum.MONTHLY, price: 200.00 }, { cycle: BillingCycleEnum.QUARTERLY, price: 550.00 }, { cycle: BillingCycleEnum.YEARLY, price: 2000.00 }] },
        { name: 'Attendance Management', desc: 'Real-time attendance tracking for students', type: FeatureTypeEnum.CORE, usageUnit: UsageUnitEnum.NONE, isMetered: false, prices: [{ cycle: BillingCycleEnum.MONTHLY, price: 100.00 }, { cycle: BillingCycleEnum.QUARTERLY, price: 280.00 }, { cycle: BillingCycleEnum.YEARLY, price: 1000.00 }] },
        { name: 'Fee Management', desc: 'Collect and track fee payments and structures', type: FeatureTypeEnum.CORE, usageUnit: UsageUnitEnum.NONE, isMetered: false, prices: [{ cycle: BillingCycleEnum.MONTHLY, price: 250.00 }, { cycle: BillingCycleEnum.QUARTERLY, price: 700.00 }, { cycle: BillingCycleEnum.YEARLY, price: 2500.00 }] },
        { name: 'Timetable Management', desc: 'Create and assign class/section schedules', type: FeatureTypeEnum.CORE, usageUnit: UsageUnitEnum.NONE, isMetered: false, prices: [{ cycle: BillingCycleEnum.MONTHLY, price: 120.00 }, { cycle: BillingCycleEnum.QUARTERLY, price: 320.00 }, { cycle: BillingCycleEnum.YEARLY, price: 1200.00 }] },
        { name: 'Exam Management', desc: 'Conduct online/offline exams and produce grade-sheets', type: FeatureTypeEnum.CORE, usageUnit: UsageUnitEnum.NONE, isMetered: false, prices: [{ cycle: BillingCycleEnum.MONTHLY, price: 180.00 }, { cycle: BillingCycleEnum.QUARTERLY, price: 500.00 }, { cycle: BillingCycleEnum.YEARLY, price: 1800.00 }] },
        { name: 'Report Management', desc: 'View comprehensive visual analytics and reports', type: FeatureTypeEnum.CORE, usageUnit: UsageUnitEnum.NONE, isMetered: false, prices: [{ cycle: BillingCycleEnum.MONTHLY, price: 150.00 }, { cycle: BillingCycleEnum.QUARTERLY, price: 400.00 }, { cycle: BillingCycleEnum.YEARLY, price: 1500.00 }] },
        { name: 'Dashboard Analytics', desc: 'Interactive charts and summary indicators of school stats', type: FeatureTypeEnum.CORE, usageUnit: UsageUnitEnum.NONE, isMetered: false, prices: [{ cycle: BillingCycleEnum.MONTHLY, price: 100.00 }, { cycle: BillingCycleEnum.QUARTERLY, price: 280.00 }, { cycle: BillingCycleEnum.YEARLY, price: 1000.00 }] },
        { name: 'Whatsapp Reminders', desc: 'Send automated student attendance & fee reminders via WhatsApp', type: FeatureTypeEnum.CORE, usageUnit: UsageUnitEnum.MESSAGES, isMetered: true, prices: [{ cycle: BillingCycleEnum.MONTHLY, price: 300.00 }, { cycle: BillingCycleEnum.QUARTERLY, price: 800.00 }, { cycle: BillingCycleEnum.YEARLY, price: 3000.00 }] }
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
          let fp = await priceRepo.findOne({ where: { platformFeatureId: f.id, billingCycle: fpData.cycle } });
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
        { code: 'STUDENT_BOOSTER_50', name: '50 Student Capacity Booster', desc: 'Adds 50 students capacity to your school', type: FeatureTypeEnum.ADDON, usageUnit: UsageUnitEnum.STUDENTS, isMetered: false, prices: [{ cycle: BillingCycleEnum.MONTHLY, price: 500.00 }, { cycle: BillingCycleEnum.QUARTERLY, price: 1350.00 }, { cycle: BillingCycleEnum.YEARLY, price: 5000.00 }] },
        { code: 'STUDENT_BOOSTER_100', name: '100 Student Capacity Booster', desc: 'Adds 100 students capacity to your school', type: FeatureTypeEnum.ADDON, usageUnit: UsageUnitEnum.STUDENTS, isMetered: false, prices: [{ cycle: BillingCycleEnum.MONTHLY, price: 800.00 }, { cycle: BillingCycleEnum.QUARTERLY, price: 2200.00 }, { cycle: BillingCycleEnum.YEARLY, price: 8000.00 }] },
        { code: 'WHATSAPP_BOOSTER_100', name: '100 WhatsApp Message Booster', desc: 'Adds 100 messages to your WhatsApp reminders balance', type: FeatureTypeEnum.ADDON, usageUnit: UsageUnitEnum.MESSAGES, isMetered: false, prices: [{ cycle: BillingCycleEnum.MONTHLY, price: 50.00 }, { cycle: BillingCycleEnum.QUARTERLY, price: 135.00 }, { cycle: BillingCycleEnum.YEARLY, price: 500.00 }] },
        { code: 'WHATSAPP_BOOSTER_1000', name: '1000 WhatsApp Message Booster', desc: 'Adds 1000 messages to your WhatsApp reminders balance', type: FeatureTypeEnum.ADDON, usageUnit: UsageUnitEnum.MESSAGES, isMetered: false, prices: [{ cycle: BillingCycleEnum.MONTHLY, price: 400.00 }, { cycle: BillingCycleEnum.QUARTERLY, price: 1100.00 }, { cycle: BillingCycleEnum.YEARLY, price: 4000.00 }] },
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
          f.isActive = true;
          f = await featRepo.save(f);
        }
        seededFeatures[afd.code] = f;

        // Seed multiple prices for Addons
        for (const fpData of afd.prices) {
          let fp = await priceRepo.findOne({ where: { platformFeatureId: f.id, billingCycle: fpData.cycle } });
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
      const modulesData = [
        { name: 'Dashboard', route: '/dashboard', icon: 'dashboard', displayOrder: 1, isMenuGroup: false, featureCode: 'DASHBOARD_ANALYTICS', parentName: null },
        { name: 'Academics', route: '/academics', icon: 'school', displayOrder: 2, isMenuGroup: true, featureCode: 'ACADEMIC_MANAGEMENT', parentName: null },
        { name: 'Class', route: '/academics/classes', icon: 'class', displayOrder: 3, isMenuGroup: false, featureCode: 'ACADEMIC_MANAGEMENT', parentName: 'Academics' },
        { name: 'Subject', route: '/academics/subjects', icon: 'book', displayOrder: 4, isMenuGroup: false, featureCode: 'ACADEMIC_MANAGEMENT', parentName: 'Academics' },
        { name: 'Section', route: '/academics/sections', icon: 'view_list', displayOrder: 5, isMenuGroup: false, featureCode: 'ACADEMIC_MANAGEMENT', parentName: 'Academics' },
        { name: 'Class Section Subject', route: '/academics/class-section-subject', icon: 'assignment_turned_in', displayOrder: 6, isMenuGroup: false, featureCode: 'ACADEMIC_MANAGEMENT', parentName: 'Academics' },

        { name: 'Students', route: '/students', icon: 'people', displayOrder: 7, isMenuGroup: false, featureCode: 'STUDENT_MANAGEMENT', parentName: null },
        { name: 'Attendance', route: '/attendance', icon: 'check_circle', displayOrder: 8, isMenuGroup: false, featureCode: 'ATTENDANCE_MANAGEMENT', parentName: null },
        { name: 'Fees', route: '/fees', icon: 'attach_money', displayOrder: 9, isMenuGroup: false, featureCode: 'FEE_MANAGEMENT', parentName: null },
        { name: 'Timetable', route: '/timetable', icon: 'schedule', displayOrder: 10, isMenuGroup: false, featureCode: 'TIMETABLE_MANAGEMENT', parentName: null },
        { name: 'Exams', route: '/exams', icon: 'assignment', displayOrder: 11, isMenuGroup: false, featureCode: 'EXAM_MANAGEMENT', parentName: null },
        { name: 'Reports', route: '/reports', icon: 'bar_chart', displayOrder: 12, isMenuGroup: false, featureCode: 'REPORT_MANAGEMENT', parentName: null },

        { name: 'Administration', route: '/administration', icon: 'settings', displayOrder: 90, isMenuGroup: true, featureCode: null, parentName: null },
        { name: 'School Users', route: '/administration/users', icon: 'manage_accounts', displayOrder: 91, isMenuGroup: false, featureCode: null, parentName: 'Administration' },
        { name: 'School Roles', route: '/administration/roles', icon: 'admin_panel_settings', displayOrder: 92, isMenuGroup: false, featureCode: null, parentName: 'Administration' },
      ];

      const seededModules: Record<string, ModuleMaster> = {};
      for (const md of modulesData) {
        const generatedCode = this.generateCodeFromName(md.name);
        let m = await modRepo.findOne({ where: { code: generatedCode } });
        if (!m) {
          m = new ModuleMaster();
          m.code = generatedCode;
          m.isActive = true;
        }
        m.name = md.name;
        m.routePath = md.route;
        m.icon = md.icon;
        m.displayOrder = md.displayOrder;
        m.showInSidebar = true;
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
        m = await modRepo.save(m);
        seededModules[generatedCode] = m;
      }

      // 4. Operations (view, create, update, delete)
      const opsData = [
        { name: 'view', desc: 'Allows read-only access to components' },
        { name: 'create', desc: 'Allows creating new records' },
        { name: 'update', desc: 'Allows modifying existing records' },
        { name: 'delete', desc: 'Allows soft-deleting/revoking records' },
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
          o = await opRepo.save(o);
        }
        seededOps[generatedCode] = o;
      }

      // 5. Module Operation Permissions (Linking PermissionKeys)
      const permsMap = [
        { modCode: 'DASHBOARD', opCode: 'VIEW', key: 'dashboard:view' },

        { modCode: 'ATTENDANCE', opCode: 'VIEW', key: 'attendance:view' },
        { modCode: 'ATTENDANCE', opCode: 'CREATE', key: 'attendance:create' },
        { modCode: 'ATTENDANCE', opCode: 'UPDATE', key: 'attendance:update' },
        { modCode: 'ATTENDANCE', opCode: 'DELETE', key: 'attendance:delete' },

        { modCode: 'CLASS', opCode: 'VIEW', key: 'classes:view' },
        { modCode: 'CLASS', opCode: 'CREATE', key: 'classes:create' },
        { modCode: 'CLASS', opCode: 'UPDATE', key: 'classes:update' },
        { modCode: 'CLASS', opCode: 'DELETE', key: 'classes:delete' },

        { modCode: 'SUBJECT', opCode: 'VIEW', key: 'subjects:view' },
        { modCode: 'SUBJECT', opCode: 'CREATE', key: 'subjects:create' },
        { modCode: 'SUBJECT', opCode: 'UPDATE', key: 'subjects:update' },
        { modCode: 'SUBJECT', opCode: 'DELETE', key: 'subjects:delete' },

        { modCode: 'SECTION', opCode: 'VIEW', key: 'sections:view' },
        { modCode: 'SECTION', opCode: 'CREATE', key: 'sections:create' },
        { modCode: 'SECTION', opCode: 'UPDATE', key: 'sections:update' },
        { modCode: 'SECTION', opCode: 'DELETE', key: 'sections:delete' },

        { modCode: 'CLASS_SECTION_SUBJECT', opCode: 'VIEW', key: 'academic_mapping:view' },
        { modCode: 'CLASS_SECTION_SUBJECT', opCode: 'UPDATE', key: 'academic_mapping:manage' },

        { modCode: 'STUDENTS', opCode: 'VIEW', key: 'students:view' },
        { modCode: 'STUDENTS', opCode: 'CREATE', key: 'students:create' },
        { modCode: 'STUDENTS', opCode: 'UPDATE', key: 'students:update' },
        { modCode: 'STUDENTS', opCode: 'DELETE', key: 'students:delete' },
        { modCode: 'STUDENTS', opCode: 'CREATE', key: 'students:admission' },

        { modCode: 'FEES', opCode: 'VIEW', key: 'fees:view' },
        { modCode: 'FEES', opCode: 'CREATE', key: 'fees:create' },
        { modCode: 'FEES', opCode: 'UPDATE', key: 'fees:update' },

        { modCode: 'TIMETABLE', opCode: 'VIEW', key: 'timetable:view' },
        { modCode: 'TIMETABLE', opCode: 'UPDATE', key: 'timetable:manage' },

        { modCode: 'EXAMS', opCode: 'VIEW', key: 'exams:view' },
        { modCode: 'EXAMS', opCode: 'CREATE', key: 'exams:create' },
        { modCode: 'EXAMS', opCode: 'UPDATE', key: 'exams:update' },

        { modCode: 'REPORTS', opCode: 'VIEW', key: 'reports:view' },

        { modCode: 'SCHOOL_ROLES', opCode: 'VIEW', key: 'school_roles:view' },
        { modCode: 'SCHOOL_ROLES', opCode: 'UPDATE', key: 'school_roles:manage' },
        { modCode: 'SCHOOL_USERS', opCode: 'UPDATE', key: 'school_users:update' }
      ];

      for (const pm of permsMap) {
        const mod = seededModules[pm.modCode];
        const op = seededOps[pm.opCode];
        if (mod && op) {
          let p = await permRepo.findOne({ where: { moduleId: mod.id, operationId: op.id } });
          if (!p) {
            p = new ModuleOperationPermission();
            p.moduleId = mod.id;
            p.operationId = op.id;
            p.key = pm.key as any;
            p.description = `Grants permission to ${op.name} in ${mod.name}`;
            p.isActive = true;
            await permRepo.save(p);
          }
        }
      }

      // 6. Subscription Plans
      const plansData = [
        { code: PlanCodeEnum.TRIAL, name: 'Free Trial Plan', desc: '1 month trial capacity', maxSt: 20, maxSf: 5, maxCl: 5, maxSc: 5, prices: [] },
        { code: PlanCodeEnum.BASIC, name: 'Basic Plan', desc: 'For smaller schools starting out', maxSt: 100, maxSf: 20, maxCl: 10, maxSc: 20, prices: [{ cycle: BillingCycleEnum.MONTHLY, price: 1000.00 }, { cycle: BillingCycleEnum.QUARTERLY, price: 2700.00 }, { cycle: BillingCycleEnum.YEARLY, price: 10000.00 }] },
        { code: PlanCodeEnum.STANDARD, name: 'Standard Plan', desc: 'Ideal for medium size operations', maxSt: 500, maxSf: 50, maxCl: 30, maxSc: 60, prices: [{ cycle: BillingCycleEnum.MONTHLY, price: 2500.00 }, { cycle: BillingCycleEnum.QUARTERLY, price: 6800.00 }, { cycle: BillingCycleEnum.YEARLY, price: 25000.00 }] },
        { code: PlanCodeEnum.PREMIUM, name: 'Premium Plan', desc: 'Enterprise-grade unlimited capacity', maxSt: null, maxSf: null, maxCl: null, maxSc: null, prices: [{ cycle: BillingCycleEnum.MONTHLY, price: 5000.00 }, { cycle: BillingCycleEnum.QUARTERLY, price: 13500.00 }, { cycle: BillingCycleEnum.YEARLY, price: 50000.00 }] },
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
          let priceObj = await planPriceRepo.findOne({ where: { subscriptionPlanId: plan.id, billingCycle: pp.cycle } });
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
            { code: 'ATTENDANCE_MANAGEMENT', limit: null }
          );
        } else if (pd.code === PlanCodeEnum.BASIC) {
          planFeatures.push(
            { code: 'ACADEMIC_MANAGEMENT', limit: null },
            { code: 'STUDENT_MANAGEMENT', limit: null },
            { code: 'ATTENDANCE_MANAGEMENT', limit: null }
          );
        } else if (pd.code === PlanCodeEnum.STANDARD) {
          planFeatures.push(
            { code: 'ACADEMIC_MANAGEMENT', limit: null },
            { code: 'STUDENT_MANAGEMENT', limit: null },
            { code: 'ATTENDANCE_MANAGEMENT', limit: null },
            { code: 'FEE_MANAGEMENT', limit: null },
            { code: 'TIMETABLE_MANAGEMENT', limit: null },
            { code: 'DASHBOARD_ANALYTICS', limit: null },
            { code: 'WHATSAPP_REMINDERS', limit: '1000' } // 1,000 free monthly messages
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
            { code: 'WHATSAPP_REMINDERS', limit: '5000' } // 5,000 free monthly messages
          );
        }

        for (const item of planFeatures) {
          const f = seededFeatures[item.code];
          if (f) {
            let mapping = await planMappingRepo.findOne({ where: { subscriptionPlanId: plan.id, platformFeatureId: f.id } });
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

      await queryRunner.commitTransaction();
      return { message: 'Metadata seeded successfully! Ready for manual and frontend testing.' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
