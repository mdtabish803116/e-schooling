import pg from 'pg';
const { Client } = pg;

const c = new Client({
  host: '127.0.0.1',
  port: 5433,
  user: 'postgres',
  password: 'Demo1234',
  database: 'e_schooling',
});

await c.connect();

// Get current academic session for school 2
const sessions = await c.query(
  "SELECT id, name FROM e_schooling.academic_sessions WHERE school_id = 2 AND is_current = true ORDER BY id LIMIT 1"
);
console.log('Academic Sessions:', JSON.stringify(sessions.rows));

const academicSessionId = sessions.rows.length > 0 ? sessions.rows[0].id : null;

// Insert 3 sample students in Class 10 (id=14), Section-A (id=34)
const students = [
  { admission: 'ADM-10A-001', code: 'STU-10A-001', first: 'Rahul',   last: 'Sharma',   gender: 'Male',   roll: '01' },
  { admission: 'ADM-10A-002', code: 'STU-10A-002', first: 'Priya',   last: 'Verma',    gender: 'Female', roll: '02' },
  { admission: 'ADM-10A-003', code: 'STU-10A-003', first: 'Aarav',   last: 'Gupta',    gender: 'Male',   roll: '03' },
  { admission: 'ADM-10A-004', code: 'STU-10A-004', first: 'Sneha',   last: 'Mishra',   gender: 'Female', roll: '04' },
  { admission: 'ADM-10A-005', code: 'STU-10A-005', first: 'Karan',   last: 'Singh',    gender: 'Male',   roll: '05' },
];

for (const s of students) {
  // Check if student code already exists
  const existing = await c.query(
    "SELECT id FROM e_schooling.students WHERE student_code = $1",
    [s.code]
  );
  if (existing.rows.length > 0) {
    console.log(`Student ${s.code} already exists (id=${existing.rows[0].id}), skipping.`);
    continue;
  }

  // Insert student
  const stuRes = await c.query(
    `INSERT INTO e_schooling.students
      (school_id, admission_number, student_code, first_name, last_name, gender, dob, is_active, is_delete, created_at, updated_at)
     VALUES (2, $1, $2, $3, $4, $5, '2009-06-15', true, false, NOW(), NOW())
     RETURNING id`,
    [s.admission, s.code, s.first, s.last, s.gender]
  );
  const studentId = stuRes.rows[0].id;
  console.log(`Inserted student: ${s.first} ${s.last} (id=${studentId})`);

  // Insert enrollment into Class 10 (id=14), Section-A (id=34)
  await c.query(
    `INSERT INTO e_schooling.student_enrollments
      (school_id, student_id, academic_session_id, class_id, section_id, roll_number,
       enrollment_type, enrollment_state, is_current, is_delete, start_date, created_at, updated_at)
     VALUES (2, $1, $2, 14, 34, $3, 'admission', 'active', true, false, NOW(), NOW(), NOW())`,
    [studentId, academicSessionId, s.roll]
  );
  console.log(`  -> Enrolled in Class 10 / Section-A (roll ${s.roll})`);
}

console.log('\nDone! Students seeded in Class 10 Section A.');
await c.end();
