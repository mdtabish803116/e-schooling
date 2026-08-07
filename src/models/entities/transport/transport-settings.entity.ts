import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'transport_settings', schema: 'e_schooling' })
export class TransportSettings {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
    comment: 'Primary key',
  })
  id: string;

  @Index({ unique: true })
  @Column({
    name: 'school_id',
    type: 'bigint',
    nullable: false,
  })
  schoolId: string;

  // Fleet & Capacity Controls
  @Column({
    name: 'auto_assign_seat_on_allocation',
    type: 'boolean',
    default: true,
  })
  autoAssignSeatOnAllocation: boolean;

  @Column({
    name: 'max_over_capacity_percent',
    type: 'integer',
    default: 0,
  })
  maxOverCapacityPercent: number;

  @Column({
    name: 'require_driver_license_verification',
    type: 'boolean',
    default: true,
  })
  requireDriverLicenseVerification: boolean;

  @Column({
    name: 'mandatory_pre_trip_inspection',
    type: 'boolean',
    default: true,
  })
  mandatoryPreTripInspection: boolean;

  // Safety, Speed & GPS Live Tracking
  @Column({
    name: 'speed_limit_kmvh',
    type: 'integer',
    default: 50,
  })
  speedLimitKmvh: number;

  @Column({
    name: 'gps_tracking_enabled',
    type: 'boolean',
    default: true,
  })
  gpsTrackingEnabled: boolean;

  @Column({
    name: 'gps_provider',
    type: 'varchar',
    length: 150,
    default: 'FleetX Live GPS Telematics',
  })
  gpsProvider: string;

  @Column({
    name: 'gps_api_key',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  gpsApiKey: string;

  @Column({
    name: 'emergency_contact_phone',
    type: 'varchar',
    length: 50,
    default: '+91 98765 43210',
  })
  emergencyContactPhone: string;

  // Parent Notifications & Geofencing
  @Column({
    name: 'notify_on_trip_start',
    type: 'boolean',
    default: true,
  })
  notifyOnTripStart: boolean;

  @Column({
    name: 'notify_on_approach',
    type: 'boolean',
    default: true,
  })
  notifyOnApproach: boolean;

  @Column({
    name: 'proximity_radius_km',
    type: 'float',
    default: 1.5,
  })
  proximityRadiusKm: number;

  @Column({
    name: 'notify_on_boarding',
    type: 'boolean',
    default: true,
  })
  notifyOnBoarding: boolean;

  // Fee Calculation & Billing
  @Column({
    name: 'default_fee_pricing_model',
    type: 'varchar',
    length: 50,
    default: 'STOP_BASED',
  })
  defaultFeePricingModel: string;

  @Column({
    name: 'billing_cycle',
    type: 'varchar',
    length: 50,
    default: 'MONTHLY',
  })
  billingCycle: string;

  @Column({
    name: 'late_fee_percentage',
    type: 'integer',
    default: 5,
  })
  lateFeePercentage: number;

  @Column({
    name: 'allow_vacation_discount',
    type: 'boolean',
    default: true,
  })
  allowVacationDiscount: boolean;

  // Compliance & Expiry Alert Lead Times
  @Column({
    name: 'license_expiry_alert_days',
    type: 'integer',
    default: 30,
  })
  licenseExpiryAlertDays: number;

  @Column({
    name: 'fitness_expiry_alert_days',
    type: 'integer',
    default: 30,
  })
  fitnessExpiryAlertDays: number;

  @Column({
    name: 'insurance_expiry_alert_days',
    type: 'integer',
    default: 30,
  })
  insuranceExpiryAlertDays: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp with time zone',
  })
  updatedAt: Date;
}
