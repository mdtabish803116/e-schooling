import 'dotenv/config';
import { DataSource } from 'typeorm';
import AppDataSource from '../database/postgres/data-source';

// ======================================================
// All 28 system-default lookup categories from the frontend seed
// ======================================================
const LOOKUP_VALUES = [
  // ── PERIOD_TYPE ──────────────────────────────────────
  {
    category: 'PERIOD_TYPE',
    code: 'PERIOD_TEACHING',
    lookup_key: 'Teaching',
    lookup_value: 'Teaching Slot / Lecture',
    display_order: 1,
  },
  {
    category: 'PERIOD_TYPE',
    code: 'PERIOD_BREAK',
    lookup_key: 'Break',
    lookup_value: 'Interval Break / Recess',
    display_order: 2,
  },
  {
    category: 'PERIOD_TYPE',
    code: 'PERIOD_ASSEMBLY',
    lookup_key: 'Assembly',
    lookup_value: 'Assembly / Morning Prayer',
    display_order: 3,
  },
  {
    category: 'PERIOD_TYPE',
    code: 'PERIOD_LUNCH',
    lookup_key: 'Lunch',
    lookup_value: 'Lunch Break',
    display_order: 4,
  },
  {
    category: 'PERIOD_TYPE',
    code: 'PERIOD_LAB',
    lookup_key: 'Lab',
    lookup_value: 'Practical / Lab Session',
    display_order: 5,
  },
  {
    category: 'PERIOD_TYPE',
    code: 'PERIOD_LIBRARY',
    lookup_key: 'Library',
    lookup_value: 'Library / Reading',
    display_order: 6,
  },
  {
    category: 'PERIOD_TYPE',
    code: 'PERIOD_SPORTS',
    lookup_key: 'Sports',
    lookup_value: 'Sports & Physical Ed',
    display_order: 7,
  },
  {
    category: 'PERIOD_TYPE',
    code: 'PERIOD_ZERO',
    lookup_key: 'Zero_Period',
    lookup_value: 'Zero Period / Extra Class',
    display_order: 8,
  },
  {
    category: 'PERIOD_TYPE',
    code: 'PERIOD_HOMEROOM',
    lookup_key: 'Homeroom',
    lookup_value: 'Homeroom / Roll Call',
    display_order: 9,
  },
  {
    category: 'PERIOD_TYPE',
    code: 'PERIOD_STUDY_HALL',
    lookup_key: 'Study_Hall',
    lookup_value: 'Study Hall / Self Study',
    display_order: 10,
  },
  {
    category: 'PERIOD_TYPE',
    code: 'PERIOD_EXAM',
    lookup_key: 'Exam',
    lookup_value: 'Examination / Test',
    display_order: 11,
  },
  {
    category: 'PERIOD_TYPE',
    code: 'PERIOD_CLUB',
    lookup_key: 'Club',
    lookup_value: 'Club / Activity',
    display_order: 12,
  },

  // ── RELIGION ─────────────────────────────────────────
  {
    category: 'RELIGION',
    code: 'REL_HINDU',
    lookup_key: 'HINDU',
    lookup_value: 'Hindu',
    display_order: 1,
  },
  {
    category: 'RELIGION',
    code: 'REL_MUSLIM',
    lookup_key: 'MUSLIM',
    lookup_value: 'Muslim',
    display_order: 2,
  },
  {
    category: 'RELIGION',
    code: 'REL_CHRISTIAN',
    lookup_key: 'CHRISTIAN',
    lookup_value: 'Christian',
    display_order: 3,
  },
  {
    category: 'RELIGION',
    code: 'REL_SIKH',
    lookup_key: 'SIKH',
    lookup_value: 'Sikh',
    display_order: 4,
  },
  {
    category: 'RELIGION',
    code: 'REL_BUDDHIST',
    lookup_key: 'BUDDHIST',
    lookup_value: 'Buddhist',
    display_order: 5,
  },
  {
    category: 'RELIGION',
    code: 'REL_JAIN',
    lookup_key: 'JAIN',
    lookup_value: 'Jain',
    display_order: 6,
  },
  {
    category: 'RELIGION',
    code: 'REL_OTHER',
    lookup_key: 'OTHER',
    lookup_value: 'Other',
    display_order: 7,
  },
  {
    category: 'RELIGION',
    code: 'REL_PREFER_NOT',
    lookup_key: 'PREFER_NOT_TO_SAY',
    lookup_value: 'Prefer Not To Say',
    display_order: 8,
  },

  // ── CASTE_CATEGORY ───────────────────────────────────
  {
    category: 'CASTE_CATEGORY',
    code: 'CASTE_GENERAL',
    lookup_key: 'GENERAL',
    lookup_value: 'General',
    display_order: 1,
  },
  {
    category: 'CASTE_CATEGORY',
    code: 'CASTE_EWS',
    lookup_key: 'EWS',
    lookup_value: 'Economically Weaker Section (EWS)',
    display_order: 2,
  },
  {
    category: 'CASTE_CATEGORY',
    code: 'CASTE_OBC',
    lookup_key: 'OBC',
    lookup_value: 'Other Backward Class (OBC)',
    display_order: 3,
  },
  {
    category: 'CASTE_CATEGORY',
    code: 'CASTE_SC',
    lookup_key: 'SC',
    lookup_value: 'Scheduled Caste (SC)',
    display_order: 4,
  },
  {
    category: 'CASTE_CATEGORY',
    code: 'CASTE_ST',
    lookup_key: 'ST',
    lookup_value: 'Scheduled Tribe (ST)',
    display_order: 5,
  },
  {
    category: 'CASTE_CATEGORY',
    code: 'CASTE_OTHER',
    lookup_key: 'OTHER',
    lookup_value: 'Other Category',
    display_order: 6,
  },

  // ── DOCUMENT_TYPE ─────────────────────────────────────
  {
    category: 'DOCUMENT_TYPE',
    code: 'DOC_AADHAAR',
    lookup_key: 'AADHAAR',
    lookup_value: 'Aadhaar Card',
    display_order: 1,
  },
  {
    category: 'DOCUMENT_TYPE',
    code: 'DOC_PAN',
    lookup_key: 'PAN',
    lookup_value: 'PAN Card',
    display_order: 2,
  },
  {
    category: 'DOCUMENT_TYPE',
    code: 'DOC_DRIVING_LICENSE',
    lookup_key: 'DRIVING_LICENSE',
    lookup_value: 'Driving Licence',
    display_order: 3,
  },
  {
    category: 'DOCUMENT_TYPE',
    code: 'DOC_VEHICLE_REG',
    lookup_key: 'VEHICLE_REGISTRATION',
    lookup_value: 'Vehicle Registration',
    display_order: 4,
  },
  {
    category: 'DOCUMENT_TYPE',
    code: 'DOC_PASSPORT',
    lookup_key: 'PASSPORT',
    lookup_value: 'Passport',
    display_order: 5,
  },
  {
    category: 'DOCUMENT_TYPE',
    code: 'DOC_VOTER_ID',
    lookup_key: 'VOTER_ID',
    lookup_value: 'Voter ID Card',
    display_order: 6,
  },
  {
    category: 'DOCUMENT_TYPE',
    code: 'DOC_RATION_CARD',
    lookup_key: 'RATION_CARD',
    lookup_value: 'Ration Card',
    display_order: 7,
  },

  // ── BOARD_TYPE ──────────────────────────────────────
  {
    category: 'BOARD_TYPE',
    code: 'BOARD_CBSE',
    lookup_key: 'CBSE',
    lookup_value: 'CBSE (Central Board of Secondary Education)',
    display_order: 1,
  },
  {
    category: 'BOARD_TYPE',
    code: 'BOARD_ICSE',
    lookup_key: 'ICSE',
    lookup_value: 'ICSE (Indian Certificate of Secondary Education)',
    display_order: 2,
  },
  {
    category: 'BOARD_TYPE',
    code: 'BOARD_IB',
    lookup_key: 'IB',
    lookup_value: 'IB (International Baccalaureate)',
    display_order: 3,
  },
  {
    category: 'BOARD_TYPE',
    code: 'BOARD_STATE',
    lookup_key: 'STATE_BOARD',
    lookup_value: 'State Board of Secondary Education',
    display_order: 4,
  },
  {
    category: 'BOARD_TYPE',
    code: 'BOARD_NIOS',
    lookup_key: 'NIOS',
    lookup_value: 'NIOS (National Institute of Open Schooling)',
    display_order: 5,
  },

  // ── SCHOOL_TYPE ─────────────────────────────────────
  {
    category: 'SCHOOL_TYPE',
    code: 'SCHOOL_TYPE_GOVT',
    lookup_key: 'GOVERNMENT',
    lookup_value: 'Government School',
    display_order: 1,
  },
  {
    category: 'SCHOOL_TYPE',
    code: 'SCHOOL_TYPE_PRIVATE',
    lookup_key: 'PRIVATE',
    lookup_value: 'Private / Unaided School',
    display_order: 2,
  },
  {
    category: 'SCHOOL_TYPE',
    code: 'SCHOOL_TYPE_AIDED',
    lookup_key: 'AIDED',
    lookup_value: 'Government Aided School',
    display_order: 3,
  },
  {
    category: 'SCHOOL_TYPE',
    code: 'SCHOOL_TYPE_RES',
    lookup_key: 'RESIDENTIAL',
    lookup_value: 'Residential School',
    display_order: 4,
  },
  {
    category: 'SCHOOL_TYPE',
    code: 'SCHOOL_TYPE_INTL',
    lookup_key: 'INTERNATIONAL',
    lookup_value: 'International School',
    display_order: 5,
  },

  // ── MEDIUM ──────────────────────────────────────────
  {
    category: 'MEDIUM',
    code: 'MEDIUM_ENGLISH',
    lookup_key: 'ENGLISH',
    lookup_value: 'English Medium',
    display_order: 1,
  },
  {
    category: 'MEDIUM',
    code: 'MEDIUM_HINDI',
    lookup_key: 'HINDI',
    lookup_value: 'Hindi Medium',
    display_order: 2,
  },
  {
    category: 'MEDIUM',
    code: 'MEDIUM_REGIONAL',
    lookup_key: 'REGIONAL',
    lookup_value: 'Regional / Vernacular Medium',
    display_order: 3,
  },
  {
    category: 'MEDIUM',
    code: 'MEDIUM_BILINGUAL',
    lookup_key: 'BILINGUAL',
    lookup_value: 'Bilingual (English + Regional)',
    display_order: 4,
  },

  // ── GENDER ──────────────────────────────────────────
  {
    category: 'GENDER',
    code: 'GENDER_MALE',
    lookup_key: 'MALE',
    lookup_value: 'Male',
    display_order: 1,
  },
  {
    category: 'GENDER',
    code: 'GENDER_FEMALE',
    lookup_key: 'FEMALE',
    lookup_value: 'Female',
    display_order: 2,
  },
  {
    category: 'GENDER',
    code: 'GENDER_OTHER',
    lookup_key: 'OTHER',
    lookup_value: 'Other / Prefer Not To Say',
    display_order: 3,
  },

  // ── BLOOD_GROUP ─────────────────────────────────────
  {
    category: 'BLOOD_GROUP',
    code: 'BLOOD_A_POS',
    lookup_key: 'A_POSITIVE',
    lookup_value: 'A+',
    display_order: 1,
  },
  {
    category: 'BLOOD_GROUP',
    code: 'BLOOD_A_NEG',
    lookup_key: 'A_NEGATIVE',
    lookup_value: 'A-',
    display_order: 2,
  },
  {
    category: 'BLOOD_GROUP',
    code: 'BLOOD_B_POS',
    lookup_key: 'B_POSITIVE',
    lookup_value: 'B+',
    display_order: 3,
  },
  {
    category: 'BLOOD_GROUP',
    code: 'BLOOD_B_NEG',
    lookup_key: 'B_NEGATIVE',
    lookup_value: 'B-',
    display_order: 4,
  },
  {
    category: 'BLOOD_GROUP',
    code: 'BLOOD_O_POS',
    lookup_key: 'O_POSITIVE',
    lookup_value: 'O+',
    display_order: 5,
  },
  {
    category: 'BLOOD_GROUP',
    code: 'BLOOD_O_NEG',
    lookup_key: 'O_NEGATIVE',
    lookup_value: 'O-',
    display_order: 6,
  },
  {
    category: 'BLOOD_GROUP',
    code: 'BLOOD_AB_POS',
    lookup_key: 'AB_POSITIVE',
    lookup_value: 'AB+',
    display_order: 7,
  },
  {
    category: 'BLOOD_GROUP',
    code: 'BLOOD_AB_NEG',
    lookup_key: 'AB_NEGATIVE',
    lookup_value: 'AB-',
    display_order: 8,
  },

  // ── EDUCATION_LEVEL ─────────────────────────────────
  {
    category: 'EDUCATION_LEVEL',
    code: 'EDU_PRIMARY',
    lookup_key: 'PRIMARY',
    lookup_value: 'Primary (Class 1-5)',
    display_order: 1,
  },
  {
    category: 'EDUCATION_LEVEL',
    code: 'EDU_MIDDLE',
    lookup_key: 'MIDDLE',
    lookup_value: 'Middle (Class 6-8)',
    display_order: 2,
  },
  {
    category: 'EDUCATION_LEVEL',
    code: 'EDU_SECONDARY',
    lookup_key: 'SECONDARY',
    lookup_value: 'Secondary (Class 9-10)',
    display_order: 3,
  },
  {
    category: 'EDUCATION_LEVEL',
    code: 'EDU_SR_SEC',
    lookup_key: 'SR_SECONDARY',
    lookup_value: 'Senior Secondary (Class 11-12)',
    display_order: 4,
  },

  // ── STREAM ──────────────────────────────────────────
  {
    category: 'STREAM',
    code: 'STREAM_SCIENCE',
    lookup_key: 'SCIENCE',
    lookup_value: 'Science',
    display_order: 1,
  },
  {
    category: 'STREAM',
    code: 'STREAM_COMMERCE',
    lookup_key: 'COMMERCE',
    lookup_value: 'Commerce',
    display_order: 2,
  },
  {
    category: 'STREAM',
    code: 'STREAM_ARTS',
    lookup_key: 'ARTS',
    lookup_value: 'Arts / Humanities',
    display_order: 3,
  },
  {
    category: 'STREAM',
    code: 'STREAM_VOCATIONAL',
    lookup_key: 'VOCATIONAL',
    lookup_value: 'Vocational',
    display_order: 4,
  },

  // ── STUDENT_STATUS ──────────────────────────────────
  {
    category: 'STUDENT_STATUS',
    code: 'STU_STATUS_ACTIVE',
    lookup_key: 'ACTIVE',
    lookup_value: 'Active',
    display_order: 1,
  },
  {
    category: 'STUDENT_STATUS',
    code: 'STU_STATUS_INACTIVE',
    lookup_key: 'INACTIVE',
    lookup_value: 'Inactive',
    display_order: 2,
  },
  {
    category: 'STUDENT_STATUS',
    code: 'STU_STATUS_GRADUATED',
    lookup_key: 'GRADUATED',
    lookup_value: 'Graduated',
    display_order: 3,
  },
  {
    category: 'STUDENT_STATUS',
    code: 'STU_STATUS_TRANSFERRED',
    lookup_key: 'TRANSFERRED',
    lookup_value: 'Transferred',
    display_order: 4,
  },
  {
    category: 'STUDENT_STATUS',
    code: 'STU_STATUS_SUSPENDED',
    lookup_key: 'SUSPENDED',
    lookup_value: 'Suspended',
    display_order: 5,
  },
  {
    category: 'STUDENT_STATUS',
    code: 'STU_STATUS_WITHDRAWN',
    lookup_key: 'WITHDRAWN',
    lookup_value: 'Withdrawn',
    display_order: 6,
  },

  // ── STAFF_STATUS ────────────────────────────────────
  {
    category: 'STAFF_STATUS',
    code: 'STAFF_STATUS_ACTIVE',
    lookup_key: 'ACTIVE',
    lookup_value: 'Active',
    display_order: 1,
  },
  {
    category: 'STAFF_STATUS',
    code: 'STAFF_STATUS_INACTIVE',
    lookup_key: 'INACTIVE',
    lookup_value: 'Inactive',
    display_order: 2,
  },
  {
    category: 'STAFF_STATUS',
    code: 'STAFF_STATUS_ON_LEAVE',
    lookup_key: 'ON_LEAVE',
    lookup_value: 'On Leave',
    display_order: 3,
  },
  {
    category: 'STAFF_STATUS',
    code: 'STAFF_STATUS_TERMINATED',
    lookup_key: 'TERMINATED',
    lookup_value: 'Terminated',
    display_order: 4,
  },
  {
    category: 'STAFF_STATUS',
    code: 'STAFF_STATUS_RESIGNED',
    lookup_key: 'RESIGNED',
    lookup_value: 'Resigned',
    display_order: 5,
  },
  {
    category: 'STAFF_STATUS',
    code: 'STAFF_STATUS_RETIRED',
    lookup_key: 'RETIRED',
    lookup_value: 'Retired',
    display_order: 6,
  },

  // ── EMPLOYMENT_TYPE ─────────────────────────────────
  {
    category: 'EMPLOYMENT_TYPE',
    code: 'EMP_PERMANENT',
    lookup_key: 'PERMANENT',
    lookup_value: 'Permanent / Full-Time',
    display_order: 1,
  },
  {
    category: 'EMPLOYMENT_TYPE',
    code: 'EMP_CONTRACTUAL',
    lookup_key: 'CONTRACTUAL',
    lookup_value: 'Contractual',
    display_order: 2,
  },
  {
    category: 'EMPLOYMENT_TYPE',
    code: 'EMP_PART_TIME',
    lookup_key: 'PART_TIME',
    lookup_value: 'Part-Time',
    display_order: 3,
  },
  {
    category: 'EMPLOYMENT_TYPE',
    code: 'EMP_VISITING',
    lookup_key: 'VISITING',
    lookup_value: 'Visiting / Guest',
    display_order: 4,
  },
  {
    category: 'EMPLOYMENT_TYPE',
    code: 'EMP_PROBATION',
    lookup_key: 'PROBATION',
    lookup_value: 'Probationary',
    display_order: 5,
  },

  // ── RELATIONSHIP_TYPE ────────────────────────────────
  {
    category: 'RELATIONSHIP_TYPE',
    code: 'REL_FATHER',
    lookup_key: 'FATHER',
    lookup_value: 'Father',
    display_order: 1,
  },
  {
    category: 'RELATIONSHIP_TYPE',
    code: 'REL_MOTHER',
    lookup_key: 'MOTHER',
    lookup_value: 'Mother',
    display_order: 2,
  },
  {
    category: 'RELATIONSHIP_TYPE',
    code: 'REL_GUARDIAN',
    lookup_key: 'GUARDIAN',
    lookup_value: 'Legal Guardian',
    display_order: 3,
  },
  {
    category: 'RELATIONSHIP_TYPE',
    code: 'REL_GRANDFATHER',
    lookup_key: 'GRANDFATHER',
    lookup_value: 'Grandfather',
    display_order: 4,
  },
  {
    category: 'RELATIONSHIP_TYPE',
    code: 'REL_GRANDMOTHER',
    lookup_key: 'GRANDMOTHER',
    lookup_value: 'Grandmother',
    display_order: 5,
  },
  {
    category: 'RELATIONSHIP_TYPE',
    code: 'REL_ELDER_SIBLING',
    lookup_key: 'ELDER_SIBLING',
    lookup_value: 'Elder Brother / Sister',
    display_order: 6,
  },
  {
    category: 'RELATIONSHIP_TYPE',
    code: 'REL_UNCLE',
    lookup_key: 'UNCLE',
    lookup_value: 'Uncle',
    display_order: 7,
  },
  {
    category: 'RELATIONSHIP_TYPE',
    code: 'REL_AUNT',
    lookup_key: 'AUNT',
    lookup_value: 'Aunt',
    display_order: 8,
  },

  // ── PAYMENT_MODE ─────────────────────────────────────
  {
    category: 'PAYMENT_MODE',
    code: 'PAY_CASH',
    lookup_key: 'CASH',
    lookup_value: 'Cash',
    display_order: 1,
  },
  {
    category: 'PAYMENT_MODE',
    code: 'PAY_UPI',
    lookup_key: 'UPI',
    lookup_value: 'UPI',
    display_order: 2,
  },
  {
    category: 'PAYMENT_MODE',
    code: 'PAY_NET_BANKING',
    lookup_key: 'NET_BANKING',
    lookup_value: 'Net Banking',
    display_order: 3,
  },
  {
    category: 'PAYMENT_MODE',
    code: 'PAY_CHEQUE',
    lookup_key: 'CHEQUE',
    lookup_value: 'Cheque',
    display_order: 4,
  },
  {
    category: 'PAYMENT_MODE',
    code: 'PAY_DD',
    lookup_key: 'DEMAND_DRAFT',
    lookup_value: 'Demand Draft (DD)',
    display_order: 5,
  },
  {
    category: 'PAYMENT_MODE',
    code: 'PAY_CARD',
    lookup_key: 'CARD',
    lookup_value: 'Credit / Debit Card',
    display_order: 6,
  },
  {
    category: 'PAYMENT_MODE',
    code: 'PAY_ONLINE',
    lookup_key: 'ONLINE_PORTAL',
    lookup_value: 'Online Payment Portal',
    display_order: 7,
  },

  // ── FEE_FREQUENCY ────────────────────────────────────
  {
    category: 'FEE_FREQUENCY',
    code: 'FREQ_MONTHLY',
    lookup_key: 'MONTHLY',
    lookup_value: 'Monthly',
    display_order: 1,
  },
  {
    category: 'FEE_FREQUENCY',
    code: 'FREQ_QUARTERLY',
    lookup_key: 'QUARTERLY',
    lookup_value: 'Quarterly',
    display_order: 2,
  },
  {
    category: 'FEE_FREQUENCY',
    code: 'FREQ_HALFYEARLY',
    lookup_key: 'HALF_YEARLY',
    lookup_value: 'Half Yearly',
    display_order: 3,
  },
  {
    category: 'FEE_FREQUENCY',
    code: 'FREQ_ANNUALLY',
    lookup_key: 'ANNUALLY',
    lookup_value: 'Annually',
    display_order: 4,
  },
  {
    category: 'FEE_FREQUENCY',
    code: 'FREQ_ONE_TIME',
    lookup_key: 'ONE_TIME',
    lookup_value: 'One-Time',
    display_order: 5,
  },

  // ── FEE_CATEGORY ─────────────────────────────────────
  {
    category: 'FEE_CATEGORY',
    code: 'FEE_TUITION',
    lookup_key: 'TUITION',
    lookup_value: 'Tuition Fee',
    display_order: 1,
  },
  {
    category: 'FEE_CATEGORY',
    code: 'FEE_ADMISSION',
    lookup_key: 'ADMISSION',
    lookup_value: 'Admission / Registration Fee',
    display_order: 2,
  },
  {
    category: 'FEE_CATEGORY',
    code: 'FEE_TRANSPORT',
    lookup_key: 'TRANSPORT',
    lookup_value: 'Transport / Bus Fee',
    display_order: 3,
  },
  {
    category: 'FEE_CATEGORY',
    code: 'FEE_EXAM',
    lookup_key: 'EXAM',
    lookup_value: 'Examination Fee',
    display_order: 4,
  },
  {
    category: 'FEE_CATEGORY',
    code: 'FEE_LAB',
    lookup_key: 'LABORATORY',
    lookup_value: 'Laboratory Fee',
    display_order: 5,
  },
  {
    category: 'FEE_CATEGORY',
    code: 'FEE_HOSTEL',
    lookup_key: 'HOSTEL',
    lookup_value: 'Hostel & Mess Fee',
    display_order: 6,
  },
  {
    category: 'FEE_CATEGORY',
    code: 'FEE_LIBRARY',
    lookup_key: 'LIBRARY',
    lookup_value: 'Library Fee',
    display_order: 7,
  },
  {
    category: 'FEE_CATEGORY',
    code: 'FEE_SPORTS',
    lookup_key: 'SPORTS',
    lookup_value: 'Sports & Activity Fee',
    display_order: 8,
  },
  {
    category: 'FEE_CATEGORY',
    code: 'FEE_STATIONARY',
    lookup_key: 'STATIONARY',
    lookup_value: 'Books & Stationary Fee',
    display_order: 9,
  },

  // ── DISCOUNT_TYPE ────────────────────────────────────
  {
    category: 'DISCOUNT_TYPE',
    code: 'DISC_SIBLING',
    lookup_key: 'SIBLING',
    lookup_value: 'Sibling Discount',
    display_order: 1,
  },
  {
    category: 'DISCOUNT_TYPE',
    code: 'DISC_STAFF',
    lookup_key: 'STAFF',
    lookup_value: 'Staff Ward Discount',
    display_order: 2,
  },
  {
    category: 'DISCOUNT_TYPE',
    code: 'DISC_MERIT',
    lookup_key: 'MERIT',
    lookup_value: 'Merit / Academic Discount',
    display_order: 3,
  },
  {
    category: 'DISCOUNT_TYPE',
    code: 'DISC_FINANCIAL',
    lookup_key: 'FINANCIAL',
    lookup_value: 'Financial Assistance / Concession',
    display_order: 4,
  },
  {
    category: 'DISCOUNT_TYPE',
    code: 'DISC_GOVT',
    lookup_key: 'GOVT_SCHEME',
    lookup_value: 'Government Scheme Discount',
    display_order: 5,
  },

  // ── SCHOLARSHIP_TYPE ─────────────────────────────────
  {
    category: 'SCHOLARSHIP_TYPE',
    code: 'SCH_MERIT',
    lookup_key: 'MERIT',
    lookup_value: 'Merit-Based Scholarship',
    display_order: 1,
  },
  {
    category: 'SCHOLARSHIP_TYPE',
    code: 'SCH_SPORTS',
    lookup_key: 'SPORTS',
    lookup_value: 'Sports Excellence Scholarship',
    display_order: 2,
  },
  {
    category: 'SCHOLARSHIP_TYPE',
    code: 'SCH_MINORITY',
    lookup_key: 'MINORITY',
    lookup_value: 'Minority Community Scholarship',
    display_order: 3,
  },
  {
    category: 'SCHOLARSHIP_TYPE',
    code: 'SCH_GOVT',
    lookup_key: 'GOVT',
    lookup_value: 'Government Scholarship',
    display_order: 4,
  },
  {
    category: 'SCHOLARSHIP_TYPE',
    code: 'SCH_NEED',
    lookup_key: 'NEED',
    lookup_value: 'Need-Based Financial Aid',
    display_order: 5,
  },

  // ── TRANSPORT_TYPE ────────────────────────────────────
  {
    category: 'TRANSPORT_TYPE',
    code: 'TRANS_BUS',
    lookup_key: 'BUS',
    lookup_value: 'School Bus',
    display_order: 1,
  },
  {
    category: 'TRANSPORT_TYPE',
    code: 'TRANS_VAN',
    lookup_key: 'VAN',
    lookup_value: 'Mini Van',
    display_order: 2,
  },
  {
    category: 'TRANSPORT_TYPE',
    code: 'TRANS_AUTO',
    lookup_key: 'AUTO',
    lookup_value: 'Auto Rickshaw',
    display_order: 3,
  },
  {
    category: 'TRANSPORT_TYPE',
    code: 'TRANS_PRIVATE',
    lookup_key: 'PRIVATE',
    lookup_value: 'Private Vehicle',
    display_order: 4,
  },
  {
    category: 'TRANSPORT_TYPE',
    code: 'TRANS_WALK',
    lookup_key: 'WALK',
    lookup_value: 'Walking / Day Scholar',
    display_order: 5,
  },

  // ── EXAM_TYPE ────────────────────────────────────────
  {
    category: 'EXAM_TYPE',
    code: 'EXAM_UNIT',
    lookup_key: 'UNIT_TEST',
    lookup_value: 'Unit Test',
    display_order: 1,
  },
  {
    category: 'EXAM_TYPE',
    code: 'EXAM_MID',
    lookup_key: 'MID_TERM',
    lookup_value: 'Mid-Term Exam',
    display_order: 2,
  },
  {
    category: 'EXAM_TYPE',
    code: 'EXAM_FINAL',
    lookup_key: 'FINAL',
    lookup_value: 'Final / Annual Exam',
    display_order: 3,
  },
  {
    category: 'EXAM_TYPE',
    code: 'EXAM_PRACTICAL',
    lookup_key: 'PRACTICAL',
    lookup_value: 'Practical Exam',
    display_order: 4,
  },
  {
    category: 'EXAM_TYPE',
    code: 'EXAM_QUARTERLY',
    lookup_key: 'QUARTERLY',
    lookup_value: 'Quarterly Assessment',
    display_order: 5,
  },
  {
    category: 'EXAM_TYPE',
    code: 'EXAM_PRE_BOARD',
    lookup_key: 'PRE_BOARD',
    lookup_value: 'Pre-Board / Mock Exam',
    display_order: 6,
  },

  // ── LEAVE_TYPE ────────────────────────────────────────
  {
    category: 'LEAVE_TYPE',
    code: 'LEAVE_CASUAL',
    lookup_key: 'CASUAL',
    lookup_value: 'Casual Leave (CL)',
    display_order: 1,
  },
  {
    category: 'LEAVE_TYPE',
    code: 'LEAVE_SICK',
    lookup_key: 'SICK',
    lookup_value: 'Sick / Medical Leave',
    display_order: 2,
  },
  {
    category: 'LEAVE_TYPE',
    code: 'LEAVE_EARNED',
    lookup_key: 'EARNED',
    lookup_value: 'Earned / Privilege Leave',
    display_order: 3,
  },
  {
    category: 'LEAVE_TYPE',
    code: 'LEAVE_MATERNITY',
    lookup_key: 'MATERNITY',
    lookup_value: 'Maternity Leave',
    display_order: 4,
  },
  {
    category: 'LEAVE_TYPE',
    code: 'LEAVE_STUDY',
    lookup_key: 'STUDY',
    lookup_value: 'Study / Academic Leave',
    display_order: 5,
  },
  {
    category: 'LEAVE_TYPE',
    code: 'LEAVE_COMP_OFF',
    lookup_key: 'COMP_OFF',
    lookup_value: 'Compensatory Off',
    display_order: 6,
  },
  {
    category: 'LEAVE_TYPE',
    code: 'LEAVE_UNPAID',
    lookup_key: 'UNPAID',
    lookup_value: 'Leave Without Pay (LWP)',
    display_order: 7,
  },

  // ── ATTENDANCE_STATUS ─────────────────────────────────
  {
    category: 'ATTENDANCE_STATUS',
    code: 'ATT_PRESENT',
    lookup_key: 'PRESENT',
    lookup_value: 'Present',
    display_order: 1,
  },
  {
    category: 'ATTENDANCE_STATUS',
    code: 'ATT_ABSENT',
    lookup_key: 'ABSENT',
    lookup_value: 'Absent',
    display_order: 2,
  },
  {
    category: 'ATTENDANCE_STATUS',
    code: 'ATT_LATE',
    lookup_key: 'LATE',
    lookup_value: 'Late',
    display_order: 3,
  },
  {
    category: 'ATTENDANCE_STATUS',
    code: 'ATT_LEAVE',
    lookup_key: 'LEAVE',
    lookup_value: 'On Leave',
    display_order: 4,
  },
  {
    category: 'ATTENDANCE_STATUS',
    code: 'ATT_HALF_DAY',
    lookup_key: 'HALF_DAY',
    lookup_value: 'Half Day',
    display_order: 5,
  },
  {
    category: 'ATTENDANCE_STATUS',
    code: 'ATT_HOLIDAY',
    lookup_key: 'HOLIDAY',
    lookup_value: 'Holiday / Off',
    display_order: 6,
  },
];

async function seedLookupValues(dataSource: DataSource) {
  // Detect schema
  const schemas = await dataSource.query(
    `SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'e_schooling'`,
  );
  const schema = schemas.length > 0 ? 'e_schooling' : 'public';
  const table = `"${schema}"."lookup_values"`;

  console.log(`📋 Using schema: ${schema}`);
  console.log(
    `🔍 Seeding ${LOOKUP_VALUES.length} lookup values across ${new Set(LOOKUP_VALUES.map((v) => v.category)).size} categories...`,
  );

  let inserted = 0;
  let skipped = 0;

  for (const entry of LOOKUP_VALUES) {
    try {
      // Check if already exists (by code, global scope)
      const existing = await dataSource.query(
        `SELECT id FROM ${table} WHERE LOWER(code) = LOWER($1) AND school_id IS NULL LIMIT 1`,
        [entry.code],
      );

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      await dataSource.query(
        `INSERT INTO ${table}
          (school_id, category, code, lookup_key, lookup_value, display_order, is_system_default, is_active, is_deleted, created_by_id, updated_by_id)
         VALUES
          (NULL, $1, $2, $3, $4, $5, true, true, false, 1, 1)`,
        [
          entry.category,
          entry.code,
          entry.lookup_key,
          entry.lookup_value,
          entry.display_order,
        ],
      );
      inserted++;
    } catch (err: any) {
      // Skip duplicate key violations silently
      if (err?.code === '23505') {
        skipped++;
      } else {
        console.warn(`  ⚠️  Skipped [${entry.code}]: ${err?.message}`);
        skipped++;
      }
    }
  }

  console.log(
    `✅ Lookup seed complete — ${inserted} inserted, ${skipped} skipped (already exist).`,
  );
}

async function runSeed() {
  console.log('🚀 Initializing Database for Lookup Values Seed...');
  const dataSource = (await AppDataSource) as DataSource;

  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  console.log('✅ Database connected!');

  try {
    await seedLookupValues(dataSource);
  } catch (error) {
    console.error('❌ Seed failed:', (error as Error).message);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔒 Connection closed.');
    }
  }
}

runSeed();
