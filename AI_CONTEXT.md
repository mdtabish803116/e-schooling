# E-School Backend (`e-schooling`) AI Context

Last updated: 2026-08-07 (Class Entity Capacity Field, UpdateClassDto/CreateClassDto Capacity & AcademicSession, Migration 1784832900000)

This file is the quick-start handoff for AI agents working in the `e-schooling` backend repository. Read it before modifying or adding API endpoints, NestJS services, TypeORM entities, background workers, or migrations.

---

## How To Use This File

- **Read Before Code Modifications**: Check this file to understand the architecture, environment modes, DBML schema, auth context, and coding standards before making changes.
- **Strict Real Database Policy**: Do NOT introduce fake or mock data fallback logic in backend services. All data queries and mutations must interact directly with PostgreSQL via TypeORM repositories/query runners.
- **Migration Discipline**: Never enable `synchronize: true` in production or core database configs. Any database schema change MUST be executed via a TypeORM migration script in `src/core/database/postgres/migrations/`.
- **Keep This File Updated**: Update this file whenever new modules, entities, migrations, queue processors, or API guards are added.

---

## Tech Stack & Dependencies

- **Framework**: NestJS v11 (`@nestjs/core`, `@nestjs/common`, `@nestjs/swagger`)
- **Language**: TypeScript 5.7 with `strict: true`
- **Database**: PostgreSQL 16+ via `pg` (`^8.20.0`)
- **ORM & Migrations**: TypeORM v0.3 (`@nestjs/typeorm`)
- **Authentication**: Passport.js (`@nestjs/passport`), `@nestjs/jwt`, `passport-jwt`, `bcrypt`
- **Async Queue & Background Jobs**: BullMQ (`^5.76.9`), Redis via `ioredis` (`^5.10.1`)
- **Validation & Transformation**: `class-validator`, `class-transformer`
- **File Storage**: Cloudinary SDK (`^2.10.0`), `@types/multer`
- **Payment Gateway**: Razorpay Node SDK (`^2.9.6`)
- **Documentation**: OpenAPI 3 / Swagger (`@nestjs/swagger`)

---

## Dual Server Execution Modes

The application supports two runtime modes controlled by the `SERVER_MODE` environment variable:

1. **`SERVER_MODE=rest`** (Default API Server)
   - Starts a full HTTP NestJS application (`AppModule` -> `RestModule`).
   - Enables CORS, global HTTP exception filters, Swagger documentation, and listens on `PORT` (default `3000`) and `HOST` (default `0.0.0.0`).
   - Run command: `npm run start:dev`

2. **`SERVER_MODE=worker`** (Background Job Processor)
   - Starts a Nest Application Context (`WorkerModule`) without an HTTP server listener.
   - Consumes BullMQ Redis queues for asynchronous operations: student imports/exports, bulk staff/class exports, student progression, payment reconciliation, cleanup, and notification dispatch.
   - Run command: `npm run start:worker`

---

## Commands & Scripts

- **Development API Server**: `npm run start:dev`
- **Development Worker**: `npm run start:worker`
- **Build Production**: `npm run build`
- **Start Production**: `npm run start:prod`
- **Lint Code**: `npm run lint`
- **Format Code**: `npm run format`
- **TypeORM CLI Helper**: `npm run typeorm -- <command>`
- **Generate Migration**: `npm run migration:generate --name=Create<Feature>Table`
- **Run Migrations**: `npm run migration:run`
- **Revert Last Migration**: `npm run migration:revert`
- **Seed Platform Modules**: `npm run seed:platform-modules`
- **Seed Students Data**: `npm run seed:students`

---

## Repository Architecture & Directory Layout

```
src/
├── main.ts                           # Server entrypoint (Dual Rest / Worker bootstrap, CORS, Swagger, Global Filters)
├── app.module.ts                     # Root module loading TypeORM async config, RestModule, and WorkerModule
├── config/                           # Environment secrets getter, Postgres pool config, ServerMode enums
│   ├── index.ts
│   └── enums_config.ts
├── core/                             # Core infrastructure (Database config & Seeds)
│   ├── database/postgres/
│   │   ├── create-typeorm.ts         # TypeORM DataSource options builder (Pool connection, Asia/Kolkata timezone)
│   │   ├── data-source.ts            # TypeORM CLI DataSource initializer
│   │   ├── entitity.ts               # Central entity exports array
│   │   ├── migration.ts              # Central migrations array
│   │   └── migrations/               # PostgreSQL migration timestamped TypeScript files
│   └── seed/                         # Database seeding scripts (Platform modules, student records)
├── api/                              # Entry points divided by server mode
│   ├── rest/                         # REST API controllers & modules (v1)
│   │   ├── rest.module.ts
│   │   └── v1/                       # Domain REST controllers:
│   │       ├── academic/             # Academic sessions, years, classes, sections, subjects, holidays
│   │       ├── attendance/           # Student & staff attendance sessions, records, dashboards
│   │       ├── auth/                 # Owner, staff, student, platform user login & JWT generation
│   │       ├── document/             # Document master & upload handling
│   │       ├── entitlement/          # Feature usage logs, metered usage, tenant overrides
│   │       ├── geo/                  # States, districts, places location data
│   │       ├── import-export/        # CSV/Excel bulk import & export jobs
│   │       ├── platform/             # Super admin platform feature & module management
│   │       ├── school-roles/         # Roles & RBAC permission matrices
│   │       ├── school-users/         # Staff, teachers, accountants, school user accounts
│   │       ├── schools/              # School branch profiles, workspaces, settings
│   │       ├── student/              # Student admissions, profiles, enrollments, promotions
│   │       ├── subscription/         # Plans, billing cycles, school subscriptions, razorpay orders
│   │       ├── system/               # System sidebars & navigation config
│   │       └── timetable/            # Class & teacher schedules, substitutions, slot allocation
│   └── worker/                       # Worker entry points & queue processors
│       ├── worker.module.ts
│       ├── background-job.service.ts # Background job database tracker
│       ├── queues/                   # BullMQ queue definitions & consumer service
│       └── processors/               # Queue processors (Import/Export, Progression, Cleanup, Payments)
├── services/                         # Business logic services matching API domain modules
│   ├── academic/
│   ├── attendance/
│   ├── auth/
│   ├── cloudinary/                   # Image & document cloud storage integration
│   ├── entitlement/
│   ├── geo/
│   ├── payment/                      # Razorpay order creation & signature verification service
│   ├── platform/
│   ├── school-roles/
│   ├── school-users/
│   ├── schools/
│   ├── student/
│   ├── subscription/
│   ├── system/
│   └── timetable/
├── models/                           # Data models
│   ├── entities/                     # TypeORM Entity classes organized by domain:
│   │   ├── academic/                 # AcademicSession, Class, Section, Subject, ClassSectionSubject, TeacherSectionAssignment
│   │   ├── attendance/               # AttendanceSession, AttendanceRecord
│   │   ├── background-job/           # BackgroundJob entity
│   │   ├── document/                 # DocumentMaster entity
│   │   ├── entitlement/              # PlatformFeature, PlanFeature, SchoolFeatureOverride, PlatformFeatureUsageLog
│   │   ├── finance/                  # Invoice, Payment, Transaction entities
│   │   ├── geo/                      # State, District, Place entities
│   │   ├── platform/                 # PlatformUser entity
│   │   ├── rbac/                     # ModuleMaster, OperationMaster, ModuleOperationPermission, Role, RolePermission, UserRole
│   │   ├── school/                   # School, SchoolOwner, SchoolMember, SchoolUser
│   │   ├── student/                  # Student, StudentEnrollment, StudentSubject, PromotionLog, SectionTransferHistory
│   │   ├── subscription/             # SubscriptionPlan, PlanPrice, SchoolSubscription, SchoolAddon
│   │   └── timetable/                # TimetableSlot, Substitution entities
│   └── enums/                        # Status, user type, enrollment, role enums
├── shared/                           # Reusable cross-cutting concerns
│   ├── decorators/                   # Custom decorators: @CurrentUser(), @CurrentAcademicSession(), @RequirePermission(), @Feature()
│   ├── filters/                      # GlobalHttpExceptionFilter
│   ├── guards/                       # JwtAuthGuard, PermissionGuard, PlatformPermissionGuard, PlatformGuard, FeatureGuard
│   ├── storage/                      # Local & cloud storage helpers
│   └── strategies/                   # JwtStrategy (Passport JWT validation)
└── interfaces/                       # DTOs, request payloads, response wrappers & AuthContext
```

---

## Database Schema & Entity Architecture

The relational database schema is formally documented in [`e-school.dbml`](file:///Users/tabishmd/Desktop/e-school-project/e-schooling/e-school.dbml). 

### Key Schema Domains & Relationships:

1. **Multi-Tenancy & School Identity**:
   - `schools`: Central tenant record containing school codes, logo, phone, address, and aggregate stats.
   - `school_owners`: Account table for school owners.
   - `school_members`: Maps `school_owners` to `schools` with roles (`owner`, `admin`, `teacher`, `staff`).
   - `school_users`: School staff accounts (admin, teacher, accountant, staff).
   - `roles`, `user_roles`, `role_permissions`, `module_masters`, `operation_masters`, `module_operation_permissions`: Fine-grained RBAC permission matrix for module operations.

2. **Academic Structure & Student Management**:
   - `academic_sessions`: Defines academic years (e.g. 2025–2026).
   - `classes` & `sections`: Class definitions (e.g., Grade 10) and sub-sections (e.g., Section A).
   - `subjects`: School subjects.
   - `class_section_subjects`: Links Class + Section + Subject + Assigned Teacher.
   - `teacher_section_assignments`: Maps class teachers to sections.
   - `students`: Core student demographic record.
   - `student_enrollments`: Tracks student enrollment history per academic session, class, section, roll number, and status (`admission`, `promotion`, `demotion`, `transfer`).
   - `promotion_logs` & `section_transfer_histories`: Audit trail for bulk promotion/demotion and section shifts.

3. **Attendance Management**:
   - `attendance_sessions`: Daily attendance session header per class, section, date, and taking teacher.
   - `attendance_records`: Individual student attendance statuses (`present`, `absent`, `leave`, `half_day`).

4. **Entitlements & Metered Features**:
   - `platform_features`: Platform-wide feature flags (metered vs non-metered).
   - `plan_features`: Tier limits attached to subscription plans.
   - `school_feature_overrides`: Custom school branch overrides (quota limits, price overrides, custom expiration dates).
   - `feature_usage_logs`: Metered usage telemetry logs per tenant.

5. **Subscriptions & Financial Billing**:
   - `subscription_plans` & `plan_prices`: Tiers (`BASIC`, `STANDARD`, `PREMIUM`) and cycle pricing.
   - `school_subscriptions`: Active tenant subscription state (`trial`, `active`, `expired`, `suspended`).
   - `school_addons`: Extra student/staff capacity booster packs.
   - `invoices` & `payments`: Billing invoices and payment transaction records (Razorpay integration).

---

## Authentication & Guard Context

All REST endpoints except public auth routes (`/auth/login`, `/auth/user/login`, `/auth/student/login`, `/auth/platform/login`) must be protected using NestJS Guards:

### Guard Stack Pattern
```typescript
@Controller('api/v1/schools/:schoolId/students')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class StudentController {
  @Get()
  @RequirePermission({ resource: 'STUDENT', action: 'READ' })
  async getStudents(
    @Param('schoolId', ParseIntPipe) schoolId: number,
    @CurrentUser() user: AuthContext,
  ) {
    // Controller logic
  }
}
```

### Auth Context Structure
`AuthContext` (`src/interfaces/auth-context.interface.ts`) injects decoded JWT identity into request handlers:
- `userId`: Numeric ID of the authenticated user.
- `schoolOwnerId`: Associated owner ID if applicable.
- `schoolId`: Current active school branch ID.
- `role`: Role string (`owner`, `admin`, `teacher`, `staff`, `platform_admin`).
- `permissions`: Array of assigned module operation permission keys.

---

## Queue & Background Worker Architecture

Background asynchronous jobs are processed using BullMQ:
- Queue names & consumers are registered in `src/api/worker/queues/`.
- Processors extend BullMQ worker interfaces and handle tasks in isolation:
  - `StudentImportProcessor`: Processes bulk student CSV/Excel uploads and creates `student` and `student_enrollment` records.
  - `StudentProgressionProcessor`: Executes bulk student promotions, demotions, and section transfers.
  - `StaffExportProcessor` & `ClassExportProcessor`: Asynchronously formats and exports system data to downloadable Excel/CSV files.
  - `PaymentReconciliationProcessor`: Syncs pending Razorpay payment statuses.
  - `CleanupProcessor`: Purges expired temporary upload files and stale background job logs.
- Job progress and status updates are persisted in the `background_jobs` table via `BackgroundJobService`.

---

## Coding Standards & Conventions

1. **NestJS Dependency Injection**: Services must be annotated with `@Injectable()` and injected via constructor parameter properties.
2. **DTO Validation**: Use `class-validator` decorators (`@IsString()`, `@IsNumber()`, `@IsOptional()`, `@IsEnum()`, `@ValidateNested()`) and `class-transformer` (`@Type()`) for request body parsing.
3. **HTTP Exception Filters**: Throw standard NestJS exceptions (`NotFoundException`, `BadRequestException`, `ForbiddenException`, `UnauthorizedException`). They are formatted uniformly by `GlobalHttpExceptionFilter`.
4. **Swagger Documentation**: Annotate all controller methods with `@ApiTags()`, `@ApiOperation()`, `@ApiResponse()`, and `@ApiBearerAuth()`.
5. **Timezone Standardization**: Database connections enforce `timezone=Asia/Kolkata`. Ensure all date manipulations account for local academic calendar dates.

---

## Academic Session Data Copy & Session Scoping (Recent Additions)

### 1. `academic_session_id` Table Scoping
- Added `academic_session_id` (`bigint`) column and foreign key relations to structural & assignment entities:
  - `Class` (`classes.entity.ts`)
  - `Section` (`section.entity.ts`)
  - `Subject` (`subject.entity.ts`)
  - `Room` (`room.entity.ts`)
  - `ClassSectionSubject` (`class-section-subject.entity.ts`)
  - `TeacherSectionAssignment` (`teacher-section-assignment.entity.ts`)
  - `StudentSubject` (`student-subject.entity.ts`)
- **Migration Script**: `src/core/database/postgres/migrations/1784832500000-AddAcademicSessionIdToTables.ts`
- **Backfill Seed**: `src/core/seed/backfill-academic-session-ids.ts` for populating legacy structural records with active academic session IDs.

### 2. Academic Session Structure Copy / Cloning API
- **Endpoint**: `POST /schools/:schoolId/academic-sessions/copy`
- **Controller**: `AcademicController` (`src/api/rest/v1/academic/academic.controller.ts`)
- **DTO**: `CopyAcademicSessionDataDto` (`src/interfaces/request/academic/copy-academic-session-data.dto.ts`)
  - Fields: `sourceSessionId`, `targetSessionId`, `copyClasses`, `copySections`, `copySubjects`, `copyRooms`, `copyTeacherAssignments`, `copyClassSectionSubjects`.
- **Service Logic**: `AcademicService.copyAcademicSessionData` in `src/services/academic/academic.service.ts`
  - Deep-clones classes, sections, subjects, rooms, class-section-subject mappings, and teacher section assignments from `sourceSessionId` into `targetSessionId` in a single transaction context.

### 3. Module Masters & RBAC Permissions Seeding Migration
- **Seed Service**: `PlatformService.seedPlatformData()` in `src/services/platform/platform.service.ts` updated with `STAFF`, `HOMEWORK`, `ACADEMIC_YEARS`, and `ANNOUNCEMENTS` modules & operations.
- **Migration Script**: `src/core/database/postgres/migrations/1784832800000-AddMissingModulesAndPermissionsSeed.ts` automatically inserts and syncs all module masters, operation masters (`VIEW`, `CREATE`, `UPDATE`, `DELETE`, `VIEW_ASSIGNED`), and `module_operation_permissions` mappings in PostgreSQL.

### 4. Transport Module Settings & Fleet Telematics
- **Entity**: `TransportSettings` (`src/models/entities/transport/transport-settings.entity.ts`) -> Table `transport_settings`.
- **Endpoints**:
  - `GET /schools/:schoolId/transport/settings` -> Retrieves fleet rules, speed limit, GPS telematics, parent geofence notifications, and compliance alert lead times.
  - `PUT /schools/:schoolId/transport/settings` -> Updates transport policies and pricing models.
- **Seed Script**: `src/core/seed/seed-transport.ts` (run command: `npm run seed:transport`).

### 5. Admission Enquiry & Pipeline Console (Recent Additions)
- **Entities**:
  - `AdmissionEnquiry` (`src/models/entities/student/admission-enquiry.entity.ts`) -> Table `admission_enquiries` (Stores lead info, status `NEW`, `CONTACTED`, `SCHEDULED_TEST`, `CONVERTED`, `CLOSED`, lead source, and counselor notes).
  - `AdmissionApplication` (`src/models/entities/student/admission-application.entity.ts`) -> Table `admission_applications` (Stores applicant verification, stage `ENQUIRY`, `APPLICATION`, `VERIFICATION`, `APPROVAL`, and document checklists).
- **Controller**: `AdmissionsController` (`src/api/rest/v1/student/admissions.controller.ts`) at `@Controller('schools/:schoolId/admissions')` and matching endpoints in `StudentAdmissionsController`.
- **Endpoints**:
  - `GET /schools/:schoolId/admissions/enquiries`: Fetches school-wise enquiries from DB.
  - `POST /schools/:schoolId/admissions/enquiries`: Records new admission enquiry leads in DB.
  - `PATCH /schools/:schoolId/admissions/enquiries/:id/status`: Updates lead enquiry status.
  - `GET /schools/:schoolId/admissions/applications`: Fetches applicant pipeline.
  - `PATCH /schools/:schoolId/admissions/applications/:id/stage`: Advances applicant workflow stage.
- **Migration Script**: `src/core/database/postgres/migrations/1784833000000-AddTransportModuleAndPermissionsSeed.ts` contains DDL table definitions for `transport_settings`, `admission_enquiries`, and `admission_applications`.


