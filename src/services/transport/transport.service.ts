import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Vehicle } from '../../models/entities/transport/vehicle.entity';
import { TransportRoute } from '../../models/entities/transport/transport-route.entity';
import { PickupPoint } from '../../models/entities/transport/pickup-point.entity';
import { Driver } from '../../models/entities/transport/driver.entity';
import { StudentTransportAllocation } from '../../models/entities/transport/student-transport-allocation.entity';
import { VehicleAssignment } from '../../models/entities/transport/vehicle-assignment.entity';
import { TransportSettings } from '../../models/entities/transport/transport-settings.entity';

@Injectable()
export class TransportService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,

    @InjectRepository(TransportRoute)
    private readonly routeRepository: Repository<TransportRoute>,

    @InjectRepository(PickupPoint)
    private readonly stopRepository: Repository<PickupPoint>,

    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,

    @InjectRepository(StudentTransportAllocation)
    private readonly allocationRepository: Repository<StudentTransportAllocation>,

    @InjectRepository(VehicleAssignment)
    private readonly assignmentRepository: Repository<VehicleAssignment>,

    @InjectRepository(TransportSettings)
    private readonly settingsRepository: Repository<TransportSettings>,
  ) {}

  // Vehicles
  async getVehicles(schoolId: string): Promise<Vehicle[]> {
    try {
      return await this.vehicleRepository.find({
        where: { schoolId, isDeleted: false },
        order: { createdAt: 'DESC' },
      });
    } catch (err) {
      return [];
    }
  }

  async saveVehicle(schoolId: string, payload: any, id?: string): Promise<Vehicle> {
    if (payload.vehicleNumber) {
      const dup = await this.vehicleRepository.findOne({
        where: { schoolId, vehicleNumber: payload.vehicleNumber, isDeleted: false },
      });
      if (dup && dup.id !== id) {
        throw new BadRequestException(`Vehicle number '${payload.vehicleNumber}' already exists in fleet.`);
      }
    }

    const driverId = payload.driverId && String(payload.driverId).trim() !== '' ? payload.driverId : null;
    let driverName = payload.driverName || null;
    let driverPhone = payload.driverPhone || null;

    if (driverId) {
      const driver = await this.driverRepository.findOne({
        where: { id: driverId, schoolId },
      });
      if (driver) {
        driverName = driver.name;
        driverPhone = driver.phone;
      }
    }

    const cleanPayload = {
      ...payload,
      driverId,
      driverName,
      driverPhone,
    };

    if (id) {
      const existing = await this.vehicleRepository.findOne({ where: { id, schoolId } });
      if (!existing) throw new NotFoundException('Vehicle not found');
      Object.assign(existing, cleanPayload);
      return this.vehicleRepository.save(existing);
    }

    const newVehicle = this.vehicleRepository.create({
      occupiedSeats: 0,
      status: 'ACTIVE',
      ...cleanPayload,
      schoolId,
    } as Partial<Vehicle>);
    return this.vehicleRepository.save(newVehicle);
  }

  async deleteVehicle(schoolId: string, id: string): Promise<boolean> {
    const vehicle = await this.vehicleRepository.findOne({ where: { id, schoolId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    vehicle.isDeleted = true;
    await this.vehicleRepository.save(vehicle);
    return true;
  }

  // Routes & Stops
  async getRoutes(schoolId: string): Promise<any[]> {
    try {
      const routes = await this.routeRepository.find({
        where: { schoolId, isDeleted: false },
        order: { createdAt: 'DESC' },
      });

      const routeIds = routes.map((r) => r.id);
      let stops: PickupPoint[] = [];
      if (routeIds.length > 0) {
        stops = await this.stopRepository.find({
          where: { routeId: In(routeIds) },
          order: { sequenceOrder: 'ASC' },
        });
      }

      return routes.map((r) => ({
        ...r,
        stops: (stops || []).filter((s) => String(s.routeId) === String(r.id)),
      }));
    } catch (err) {
      return [];
    }
  }

  async saveRoute(schoolId: string, payload: any, id?: string): Promise<TransportRoute> {
    if (payload.routeName) {
      const dup = await this.routeRepository.findOne({
        where: { schoolId, routeName: payload.routeName, isDeleted: false },
      });
      if (dup && dup.id !== id) {
        throw new BadRequestException(`Route name '${payload.routeName}' already exists.`);
      }
    }

    const assignedVehicleId =
      payload.assignedVehicleId && String(payload.assignedVehicleId).trim() !== ''
        ? payload.assignedVehicleId
        : null;
    let assignedVehicleNumber = payload.assignedVehicleNumber || null;

    if (assignedVehicleId) {
      const vehicle = await this.vehicleRepository.findOne({
        where: { id: assignedVehicleId, schoolId },
      });
      if (vehicle) {
        assignedVehicleNumber = vehicle.vehicleNumber;
      }
    }

    const cleanPayload = {
      ...payload,
      assignedVehicleId,
      assignedVehicleNumber,
    };

    if (id) {
      const existing = await this.routeRepository.findOne({ where: { id, schoolId } });
      if (!existing) throw new NotFoundException('Route not found');
      Object.assign(existing, cleanPayload);
      return this.routeRepository.save(existing);
    }

    const newRoute = this.routeRepository.create({
      distanceKm: 0,
      baseMonthlyFee: 2000,
      status: 'ACTIVE',
      ...cleanPayload,
      schoolId,
      totalAllocatedStudents: 0,
    } as Partial<TransportRoute>);
    return this.routeRepository.save(newRoute);
  }

  async saveStop(routeId: string, stop: any): Promise<PickupPoint> {
    if (stop.name) {
      const dup = await this.stopRepository.findOne({
        where: { routeId, name: stop.name },
      });
      if (dup) {
        throw new BadRequestException(`Pickup stop '${stop.name}' already exists on this route.`);
      }
    }

    const newStop = this.stopRepository.create({
      pickupTime: '07:30 AM',
      dropTime: '03:30 PM',
      sequenceOrder: 1,
      monthlyFee: 2000,
      ...stop,
      routeId,
    } as Partial<PickupPoint>);
    return this.stopRepository.save(newStop);
  }

  async deleteRoute(schoolId: string, id: string): Promise<boolean> {
    const route = await this.routeRepository.findOne({ where: { id, schoolId } });
    if (!route) throw new NotFoundException('Route not found');
    route.isDeleted = true;
    await this.routeRepository.save(route);
    return true;
  }

  // Drivers
  async getDrivers(schoolId: string): Promise<Driver[]> {
    try {
      return await this.driverRepository.find({
        where: { schoolId, isDeleted: false },
        order: { createdAt: 'DESC' },
      });
    } catch (err) {
      return [];
    }
  }

  async saveDriver(schoolId: string, payload: any, id?: string): Promise<Driver> {
    if (payload.phone) {
      const dup = await this.driverRepository.findOne({
        where: { schoolId, phone: payload.phone, isDeleted: false },
      });
      if (dup && dup.id !== id) {
        throw new BadRequestException(`Driver with phone number '${payload.phone}' already exists.`);
      }
    }

    const assignedVehicleId =
      payload.assignedVehicleId && String(payload.assignedVehicleId).trim() !== ''
        ? payload.assignedVehicleId
        : null;

    const cleanPayload = {
      ...payload,
      assignedVehicleId,
    };

    if (id) {
      const existing = await this.driverRepository.findOne({ where: { id, schoolId } });
      if (!existing) throw new NotFoundException('Driver not found');
      Object.assign(existing, cleanPayload);
      return this.driverRepository.save(existing);
    }

    const newDriver = this.driverRepository.create({
      ...cleanPayload,
      schoolId,
    } as Partial<Driver>);
    return this.driverRepository.save(newDriver);
  }

  async deleteDriver(schoolId: string, id: string): Promise<boolean> {
    const driver = await this.driverRepository.findOne({ where: { id, schoolId } });
    if (!driver) throw new NotFoundException('Driver not found');
    driver.isDeleted = true;
    await this.driverRepository.save(driver);
    return true;
  }

  // Vehicle Assignments & History
  async getVehicleAssignments(schoolId: string): Promise<VehicleAssignment[]> {
    try {
      return await this.assignmentRepository.find({
        where: { schoolId },
        order: { createdAt: 'DESC' },
      });
    } catch (err) {
      return [];
    }
  }

  async assignVehicleToDriver(
    schoolId: string,
    payload: { vehicleId: string; driverId: string; notes?: string },
  ): Promise<VehicleAssignment> {
    const vehicle = await this.vehicleRepository.findOne({ where: { id: payload.vehicleId, schoolId } });
    const driver = await this.driverRepository.findOne({ where: { id: payload.driverId, schoolId } });

    if (!vehicle) throw new NotFoundException('Vehicle not found.');
    if (!driver) throw new NotFoundException('Driver not found.');

    // Update vehicle and driver links
    vehicle.driverId = driver.id;
    vehicle.driverName = driver.name;
    vehicle.driverPhone = driver.phone;
    await this.vehicleRepository.save(vehicle);

    driver.assignedVehicleId = vehicle.id;
    driver.assignedVehicleNumber = vehicle.vehicleNumber;
    await this.driverRepository.save(driver);

    // Record in history audit table
    const assignment = this.assignmentRepository.create({
      schoolId,
      vehicleId: vehicle.id,
      vehicleNumber: vehicle.vehicleNumber,
      registrationNumber: vehicle.registrationNumber,
      driverId: driver.id,
      driverName: driver.name,
      driverPhone: driver.phone,
      assignedDate: new Date().toISOString().split('T')[0],
      assignedBy: 'Transport Manager',
      notes: payload.notes || 'Assigned via Transport Management Console',
      status: 'ACTIVE',
    });

    return this.assignmentRepository.save(assignment);
  }

  async releaseVehicleAssignment(schoolId: string, assignmentId: string): Promise<VehicleAssignment> {
    const assignment = await this.assignmentRepository.findOne({ where: { id: assignmentId, schoolId } });
    if (!assignment) throw new NotFoundException('Assignment history record not found.');

    const vehicle = await this.vehicleRepository.findOne({ where: { id: assignment.vehicleId, schoolId } });
    const driver = await this.driverRepository.findOne({ where: { id: assignment.driverId, schoolId } });

    if (vehicle) {
      vehicle.driverId = '';
      vehicle.driverName = '';
      vehicle.driverPhone = '';
      await this.vehicleRepository.save(vehicle);
    }

    if (driver) {
      driver.assignedVehicleId = '';
      driver.assignedVehicleNumber = '';
      await this.driverRepository.save(driver);
    }

    assignment.status = 'RELEASED';
    assignment.releasedDate = new Date().toISOString().split('T')[0];
    return this.assignmentRepository.save(assignment);
  }

  // Allocations
  async getAllocations(schoolId: string): Promise<StudentTransportAllocation[]> {
    try {
      return await this.allocationRepository.find({
        where: { schoolId },
        order: { createdAt: 'DESC' },
      });
    } catch (err) {
      return [];
    }
  }

  async allocateStudent(schoolId: string, payload: any): Promise<StudentTransportAllocation> {
    const route = await this.routeRepository.findOne({ where: { id: payload.routeId, schoolId } });
    const stop = await this.stopRepository.findOne({ where: { id: payload.pickupPointId } });
    const vehicle = route?.assignedVehicleId
      ? await this.vehicleRepository.findOne({ where: { id: route.assignedVehicleId, schoolId } })
      : null;
    const driver = vehicle?.driverId
      ? await this.driverRepository.findOne({ where: { id: vehicle.driverId, schoolId } })
      : null;

    const studentName = payload.name || payload.studentName || `Student #${payload.studentId}`;
    const className = payload.className || payload.classId || 'Class 10';
    const sectionName = payload.sectionName || payload.sectionId || 'Sec A';
    const todayStr = new Date().toISOString().split('T')[0];

    // Archive previous active allocations in DB for this student
    if (payload.studentId) {
      const existingActive = await this.allocationRepository.find({
        where: { schoolId, studentId: String(payload.studentId), status: 'ACTIVE' },
      });
      for (const oldAlc of existingActive) {
        oldAlc.status = 'CANCELLED';
        oldAlc.endDate = todayStr;
        await this.allocationRepository.save(oldAlc);
      }
    }

    const newAllocation = this.allocationRepository.create({
      ...payload,
      schoolId,
      studentName,
      className,
      sectionName,
      routeName: route?.routeName || 'Assigned Route',
      pickupPointName: stop?.name || 'Pickup Point',
      pickupTime: stop?.pickupTime || '07:30 AM',
      vehicleId: vehicle?.id || null,
      vehicleNumber: vehicle?.vehicleNumber || route?.routeCode || 'Bus #01',
      driverId: driver?.id || vehicle?.driverId || null,
      driverName: driver?.name || vehicle?.driverName || 'Unassigned',
      driverPhone: driver?.phone || vehicle?.driverPhone || 'N/A',
      startDate: payload.startDate || todayStr,
      status: 'ACTIVE',
    } as Partial<StudentTransportAllocation>);

    const saved = await this.allocationRepository.save(newAllocation);

    if (route) {
      route.totalAllocatedStudents += 1;
      await this.routeRepository.save(route);
    }
    if (vehicle) {
      vehicle.occupiedSeats += 1;
      await this.vehicleRepository.save(vehicle);
    }

    return saved;
  }

  async removeAllocation(schoolId: string, id: string): Promise<boolean> {
    let alc = await this.allocationRepository.findOne({ where: { id, schoolId } });
    if (!alc) {
      alc = await this.allocationRepository.findOne({ where: { id } });
    }
    if (!alc) {
      throw new NotFoundException(`Allocation record #${id} not found.`);
    }

    const route = await this.routeRepository.findOne({
      where: [{ id: alc.routeId, schoolId }, { id: alc.routeId }],
    });
    if (route && route.totalAllocatedStudents > 0) {
      route.totalAllocatedStudents -= 1;
      await this.routeRepository.save(route);
    }

    if (alc.vehicleId) {
      const vehicle = await this.vehicleRepository.findOne({
        where: [{ id: alc.vehicleId, schoolId }, { id: alc.vehicleId }],
      });
      if (vehicle && vehicle.occupiedSeats > 0) {
        vehicle.occupiedSeats -= 1;
        await this.vehicleRepository.save(vehicle);
      }
    }

    // Preserve record in database for history audit
    alc.status = 'CANCELLED';
    alc.endDate = new Date().toISOString().split('T')[0];
    await this.allocationRepository.save(alc);
    return true;
  }

  // Metrics
  async getMetrics(schoolId: string): Promise<any> {
    const vehicles = await this.getVehicles(schoolId);
    const routes = await this.getRoutes(schoolId);
    const drivers = await this.getDrivers(schoolId);
    const allocations = await this.getAllocations(schoolId);

    const activeAllocations = allocations.filter((a) => a.status === 'ACTIVE');
    const totalCapacity = vehicles.reduce((sum, v) => sum + (v.capacity || 0), 0);
    const occupiedSeats = activeAllocations.length;
    const monthlyRevenue = activeAllocations.reduce(
      (sum, a) => sum + (Number(a.monthlyFee) || 0),
      0,
    );

    return {
      totalVehicles: vehicles.length,
      activeVehicles: vehicles.filter((v) => v.status === 'ACTIVE').length,
      totalRoutes: routes.length,
      activeRoutes: routes.filter((r) => r.status === 'ACTIVE').length,
      totalCapacity,
      occupiedSeats,
      totalDrivers: drivers.length,
      totalAllocatedStudents: activeAllocations.length,
      monthlyRevenue,
    };
  }

  // Transport Settings (DB Driven)
  async getSettings(schoolId: string): Promise<TransportSettings> {
    let settings = await this.settingsRepository.findOne({ where: { schoolId } });
    if (!settings) {
      const defaultSettings = this.settingsRepository.create({
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
      settings = await this.settingsRepository.save(defaultSettings);
    }
    return settings;
  }

  async updateSettings(schoolId: string, payload: Partial<TransportSettings>): Promise<TransportSettings> {
    let settings = await this.settingsRepository.findOne({ where: { schoolId } });
    if (!settings) {
      settings = this.settingsRepository.create({ schoolId, ...payload });
    } else {
      Object.assign(settings, payload);
    }
    return this.settingsRepository.save(settings);
  }
}
