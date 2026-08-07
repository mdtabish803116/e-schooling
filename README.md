# E-School NestJS Backend (`e-schooling`)

Enterprise School Management System (E-School) REST API & Background Job Processor built with NestJS, TypeORM, PostgreSQL, Redis, and BullMQ.

---

## Technical Overview

- **Framework**: NestJS v11 (`@nestjs/core`, `@nestjs/swagger`)
- **Database**: PostgreSQL 16+ via TypeORM (`0.3.x`)
- **Queue/Background Workers**: BullMQ & Redis
- **Auth**: Passport JWT + RBAC Permissions Engine
- **Payment Processing**: Razorpay Node SDK

---

## Dual Server Execution Modes

The application supports two runtime execution modes:

1. **REST API Mode** (`SERVER_MODE=rest`):
   ```bash
   npm run start:dev
   ```
2. **Background Worker Mode** (`SERVER_MODE=worker`):
   ```bash
   npm run start:worker
   ```

---

## Available Commands & Database Tools

```bash
# Compile and Build Production Bundle
npm run build

# Start Production Server
npm run start:prod

# Database Migrations
npm run migration:run
npm run migration:revert

# Database Seed Scripts
npm run seed:platform-modules
npm run seed:students
npm run seed:fees
npm run seed:attendance
npm run seed:transport
npm run seed:all
```

---

## Core Modules & API Controllers

- **Academic**: Sessions, Classes, Sections, Subjects, Rooms, Holidays (`/schools/:schoolId/academic`)
- **Admissions**: Enquiry Pipeline & Student Seat Conversion (`/schools/:schoolId/admissions`)
- **Attendance**: Student & Staff Daily/Subject Attendance (`/schools/:schoolId/attendance`)
- **Transport**: Fleet Routes, Stops, Vehicles, Drivers, Settings (`/schools/:schoolId/transport`)
- **Fees & Billing**: Invoices, Payments, Fee Heads (`/schools/:schoolId/fees`)
- **RBAC**: Roles & Permissions Matrix (`/schools/:schoolId/school-roles`)

---

## Documentation

For full architectural details, entity schemas, auth context specifications, and coding conventions, refer to:
- [AI_CONTEXT.md](file:///c:/e-school-api/e-schooling/AI_CONTEXT.md)
