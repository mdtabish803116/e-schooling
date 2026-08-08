import 'dotenv/config';
import { DataSource } from 'typeorm';
import AppDataSource from '../database/postgres/data-source';
import { Vehicle } from '../../models/entities/transport/vehicle.entity';
import { TransportRoute } from '../../models/entities/transport/transport-route.entity';
import { PickupPoint } from '../../models/entities/transport/pickup-point.entity';
import { Driver } from '../../models/entities/transport/driver.entity';
import { TransportSettings } from '../../models/entities/transport/transport-settings.entity';

export async function seedTransportData(
  dataSource: DataSource,
  schoolId: string = '2',
) {
  console.log(`🚌 Starting Transport Data Seeding for School #${schoolId}...`);

  const vehicleRepo = dataSource.getRepository(Vehicle);
  const routeRepo = dataSource.getRepository(TransportRoute);
  const stopRepo = dataSource.getRepository(PickupPoint);
  const driverRepo = dataSource.getRepository(Driver);
  const settingsRepo = dataSource.getRepository(TransportSettings);

  // 1. Seed Transport Settings
  let settings = await settingsRepo.findOne({ where: { schoolId } });
  if (!settings) {
    settings = settingsRepo.create({
      schoolId,
      autoAssignSeatOnAllocation: true,
      maxOverCapacityPercent: 0,
      requireDriverLicenseVerification: true,
      mandatoryPreTripInspection: true,
      speedLimitKmvh: 50,
      gpsTrackingEnabled: true,
      gpsProvider: 'FleetX Live GPS Telematics',
      gpsApiKey: 'fltx_live_sec_8921x49',
      emergencyContactPhone: '+91 98765 43210',
      notifyOnTripStart: true,
      notifyOnApproach: true,
      proximityRadiusKm: 1.5,
      notifyOnBoarding: true,
      defaultFeePricingModel: 'STOP_BASED',
      billingCycle: 'MONTHLY',
      lateFeePercentage: 5,
      allowVacationDiscount: true,
      licenseExpiryAlertDays: 30,
      fitnessExpiryAlertDays: 30,
      insuranceExpiryAlertDays: 30,
    });
    await settingsRepo.save(settings);
    console.log('  ✅ Seeded default Transport Settings record.');
  }

  // 2. Seed Drivers
  const driverList = [
    {
      name: 'Rajesh Kumar',
      phone: '+91 98112 34567',
      licenseNumber: 'DL-2020-88192',
      licenseExpiry: '2028-12-31',
      status: 'ACTIVE' as const,
    },
    {
      name: 'Suresh Sharma',
      phone: '+91 98223 45678',
      licenseNumber: 'DL-2019-77281',
      licenseExpiry: '2027-10-15',
      status: 'ACTIVE' as const,
    },
    {
      name: 'Amit Patel',
      phone: '+91 98334 56789',
      licenseNumber: 'DL-2021-99302',
      licenseExpiry: '2029-05-20',
      status: 'ACTIVE' as const,
    },
  ];

  const createdDrivers: Driver[] = [];
  for (const d of driverList) {
    let existing = await driverRepo.findOne({
      where: { schoolId, phone: d.phone, isDeleted: false },
    });
    if (!existing) {
      existing = driverRepo.create({ ...d, schoolId });
      existing = await driverRepo.save(existing);
    }
    createdDrivers.push(existing);
  }
  console.log(`  ✅ Seeded ${createdDrivers.length} Fleet Drivers.`);

  // 3. Seed Vehicles
  const vehicleList = [
    {
      vehicleNumber: 'BUS-01',
      registrationNumber: 'KA-01-EQ-1001',
      model: 'Tata Starbus 32-Seater',
      capacity: 32,
      occupiedSeats: 0,
      driverId: createdDrivers[0]?.id,
      driverName: createdDrivers[0]?.name,
      driverPhone: createdDrivers[0]?.phone,
      status: 'ACTIVE' as const,
      gpsEnabled: true,
    },
    {
      vehicleNumber: 'BUS-02',
      registrationNumber: 'KA-01-EQ-1002',
      model: 'Eicher Skyline 40-Seater',
      capacity: 40,
      occupiedSeats: 0,
      driverId: createdDrivers[1]?.id,
      driverName: createdDrivers[1]?.name,
      driverPhone: createdDrivers[1]?.phone,
      status: 'ACTIVE' as const,
      gpsEnabled: true,
    },
    {
      vehicleNumber: 'BUS-03',
      registrationNumber: 'KA-01-EQ-1003',
      model: 'Ashok Leyland Sunshine 35-Seater',
      capacity: 35,
      occupiedSeats: 0,
      driverId: createdDrivers[2]?.id,
      driverName: createdDrivers[2]?.name,
      driverPhone: createdDrivers[2]?.phone,
      status: 'ACTIVE' as const,
      gpsEnabled: true,
    },
  ];

  const createdVehicles: Vehicle[] = [];
  for (const v of vehicleList) {
    let existing = await vehicleRepo.findOne({
      where: { schoolId, vehicleNumber: v.vehicleNumber, isDeleted: false },
    });
    if (!existing) {
      existing = vehicleRepo.create({ ...v, schoolId });
      existing = await vehicleRepo.save(existing);
    }
    createdVehicles.push(existing);
  }
  console.log(`  ✅ Seeded ${createdVehicles.length} Fleet Vehicles.`);

  // 4. Seed Routes & Pickup Stops
  const routeList = [
    {
      routeCode: 'RT-101',
      routeName: 'North Sector Express',
      startLocation: 'Central Bus Terminal',
      endLocation: 'School Main Gate',
      distanceKm: 14.5,
      assignedVehicleId: createdVehicles[0]?.id,
      assignedVehicleNumber: createdVehicles[0]?.vehicleNumber,
      baseMonthlyFee: 2200,
      status: 'ACTIVE' as const,
      stops: [
        {
          name: 'Green Park Cross',
          pickupTime: '07:15 AM',
          dropTime: '03:45 PM',
          sequenceOrder: 1,
          monthlyFee: 2000,
        },
        {
          name: 'Metro Station Gate 2',
          pickupTime: '07:30 AM',
          dropTime: '03:30 PM',
          sequenceOrder: 2,
          monthlyFee: 2200,
        },
        {
          name: 'Royal Apartments Gate',
          pickupTime: '07:45 AM',
          dropTime: '03:15 PM',
          sequenceOrder: 3,
          monthlyFee: 2500,
        },
      ],
    },
    {
      routeCode: 'RT-102',
      routeName: 'South Suburbs Shuttle',
      startLocation: 'South Square Market',
      endLocation: 'School Main Gate',
      distanceKm: 18.2,
      assignedVehicleId: createdVehicles[1]?.id,
      assignedVehicleNumber: createdVehicles[1]?.vehicleNumber,
      baseMonthlyFee: 2500,
      status: 'ACTIVE' as const,
      stops: [
        {
          name: 'Sunrise Colony Circle',
          pickupTime: '07:05 AM',
          dropTime: '03:55 PM',
          sequenceOrder: 1,
          monthlyFee: 2300,
        },
        {
          name: 'Outer Ring Junction',
          pickupTime: '07:25 AM',
          dropTime: '03:35 PM',
          sequenceOrder: 2,
          monthlyFee: 2500,
        },
      ],
    },
  ];

  for (const r of routeList) {
    let existingRoute = await routeRepo.findOne({
      where: { schoolId, routeCode: r.routeCode, isDeleted: false },
    });
    if (!existingRoute) {
      existingRoute = routeRepo.create({
        schoolId,
        routeCode: r.routeCode,
        routeName: r.routeName,
        startLocation: r.startLocation,
        endLocation: r.endLocation,
        distanceKm: r.distanceKm,
        assignedVehicleId: r.assignedVehicleId,
        assignedVehicleNumber: r.assignedVehicleNumber,
        baseMonthlyFee: r.baseMonthlyFee,
        status: r.status,
        totalAllocatedStudents: 0,
      });
      existingRoute = await routeRepo.save(existingRoute);

      // Add stops
      for (const s of r.stops) {
        const stop = stopRepo.create({
          routeId: existingRoute.id,
          name: s.name,
          pickupTime: s.pickupTime,
          dropTime: s.dropTime,
          sequenceOrder: s.sequenceOrder,
          monthlyFee: s.monthlyFee,
        });
        await stopRepo.save(stop);
      }
    }
  }
  console.log(`  ✅ Seeded Transport Routes & Pickup Stops.`);

  console.log('🎉 Transport Data Seeding Complete!');
}

async function main() {
  const dataSource = (await AppDataSource) as DataSource;
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  try {
    await seedTransportData(dataSource, '2');
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

if (require.main === module) {
  main();
}
