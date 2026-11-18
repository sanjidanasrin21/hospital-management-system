require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_db',
  waitForConnections: true,
  connectionLimit: process.env.VERCEL ? 2 : 5,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
});

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const GENDERS = ['Male', 'Female', 'Other'];
const STATUSES = ['Admitted', 'Discharged', 'Outpatient'];

// Validate and normalise a patient payload. Returns [error, values].
function parsePatient(b) {
  const name = String(b.name || '').trim();
  const diagnosis = String(b.diagnosis || '').trim();
  const age = Number(b.age);
  const bill = Number(b.bill_amount);
  const doctorId = Number(b.doctor_id);
  if (!name || name.length > 80) return ['Name is required (max 80 chars).'];
  if (!diagnosis || diagnosis.length > 120) return ['Diagnosis is required (max 120 chars).'];
  if (!Number.isInteger(age) || age < 0 || age > 120) return ['Age must be 0-120.'];
  if (!GENDERS.includes(b.gender)) return ['Invalid gender.'];
  if (!STATUSES.includes(b.status)) return ['Invalid status.'];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.admission_date || '')) return ['Admission date is required.'];
  if (!(bill >= 0) || bill > 99999999) return ['Bill must be a non-negative number.'];
  if (!Number.isInteger(doctorId) || doctorId < 1) return ['Choose a doctor.'];
  return [null, [name, age, b.gender, diagnosis, b.admission_date, b.status, bill, doctorId]];
}

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (e) {
    if (e.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'Selected doctor does not exist.' });
    console.error(e);
    res.status(500).json({ error: 'Database error.' });
  }
};

// READ: list + search/filter (parameterised WHERE)
app.get('/api/patients', handle(async (req, res) => {
  const { q = '', status = '' } = req.query;
  const where = [];
  const args = [];
  if (q) {
    where.push('(p.name LIKE ? OR p.patient_id = ? OR p.diagnosis LIKE ?)');
    args.push(`%${q}%`, Number(q) || 0, `%${q}%`);
  }
  if (status) {
    where.push('p.status = ?');
    args.push(status);
  }
  const sql = `SELECT p.patient_id, p.name, p.age, p.gender, p.diagnosis,
                      DATE_FORMAT(p.admission_date, '%Y-%m-%d') AS admission_date,
                      p.status, p.bill_amount, p.doctor_id, d.name AS doctor_name
               FROM patients p JOIN doctors d ON d.doctor_id = p.doctor_id
               ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
               ORDER BY p.patient_id`;
  const [rows] = await pool.query(sql, args);
  res.json(rows);
}));

// CREATE
app.post('/api/patients', handle(async (req, res) => {
  const [err, v] = parsePatient(req.body);
  if (err) return res.status(400).json({ error: err });
  const [r] = await pool.query(
    `INSERT INTO patients (name, age, gender, diagnosis, admission_date, status, bill_amount, doctor_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, v);
  res.status(201).json({ patient_id: r.insertId });
}));

// UPDATE
app.put('/api/patients/:id', handle(async (req, res) => {
  const [err, v] = parsePatient(req.body);
  if (err) return res.status(400).json({ error: err });
  const [r] = await pool.query(
    `UPDATE patients SET name=?, age=?, gender=?, diagnosis=?, admission_date=?, status=?, bill_amount=?, doctor_id=?
     WHERE patient_id=?`, [...v, Number(req.params.id)]);
  if (!r.affectedRows) return res.status(404).json({ error: 'Patient not found.' });
  res.json({ ok: true });
}));

// DELETE
app.delete('/api/patients/:id', handle(async (req, res) => {
  const [r] = await pool.query('DELETE FROM patients WHERE patient_id = ?', [Number(req.params.id)]);
  if (!r.affectedRows) return res.status(404).json({ error: 'Patient not found.' });
  res.json({ ok: true });
}));

// Doctors for the dropdown
app.get('/api/doctors', handle(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT d.doctor_id, d.name, d.specialization, dep.name AS department
     FROM doctors d JOIN departments dep ON dep.department_id = d.department_id ORDER BY d.name`);
  res.json(rows);
}));

// SUMMARY: aggregate functions
app.get('/api/summary', handle(async (req, res) => {
  const [[totals]] = await pool.query(
    `SELECT COUNT(*) AS total_patients, COALESCE(AVG(bill_amount),0) AS avg_bill,
            COALESCE(MAX(bill_amount),0) AS max_bill, COALESCE(MIN(bill_amount),0) AS min_bill,
            COALESCE(SUM(bill_amount),0) AS total_billing,
            COALESCE(SUM(status='Admitted'),0) AS admitted
     FROM patients`);
  const [perDoctor] = await pool.query(
    `SELECT d.name AS doctor, COUNT(p.patient_id) AS patients
     FROM doctors d LEFT JOIN patients p ON p.doctor_id = d.doctor_id
     GROUP BY d.doctor_id, d.name ORDER BY patients DESC, d.name`);
  res.json({ ...totals, perDoctor });
}));

// Local: start the server. On Vercel: export the app for the serverless function.
if (require.main === module) {
  const port = process.env.PORT || 5075;
  app.listen(port, () => console.log(`Hospital app running at http://localhost:${port}`));
}
module.exports = app;
