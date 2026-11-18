-- Hospital Management System - schema + sample data (MySQL 8+)
DROP DATABASE IF EXISTS hospital_db;
CREATE DATABASE hospital_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE hospital_db;

-- ---------- CREATE ----------
CREATE TABLE departments (
  department_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(60)  NOT NULL,
  PRIMARY KEY (department_id),
  UNIQUE KEY uq_department_name (name)
) ENGINE=InnoDB;

CREATE TABLE doctors (
  doctor_id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name           VARCHAR(80)  NOT NULL,
  specialization VARCHAR(80)  NOT NULL,
  department_id  INT UNSIGNED NOT NULL,
  PRIMARY KEY (doctor_id),
  KEY idx_doctor_department (department_id),
  CONSTRAINT fk_doctor_department FOREIGN KEY (department_id)
    REFERENCES departments (department_id)
) ENGINE=InnoDB;

CREATE TABLE patients (
  patient_id     INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name           VARCHAR(80)   NOT NULL,
  age            TINYINT UNSIGNED NOT NULL,
  gender         VARCHAR(10)   NOT NULL,
  diagnosis      VARCHAR(120)  NOT NULL,
  admission_date DATE          NOT NULL,
  status         VARCHAR(15)   NOT NULL DEFAULT 'Admitted',
  bill_amount    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  doctor_id      INT UNSIGNED  NOT NULL,
  PRIMARY KEY (patient_id),
  KEY idx_patient_doctor (doctor_id),
  KEY idx_patient_name (name),
  CONSTRAINT fk_patient_doctor FOREIGN KEY (doctor_id)
    REFERENCES doctors (doctor_id),
  CONSTRAINT chk_gender CHECK (gender IN ('Male','Female','Other')),
  CONSTRAINT chk_status CHECK (status IN ('Admitted','Discharged','Outpatient')),
  CONSTRAINT chk_bill   CHECK (bill_amount >= 0)
) ENGINE=InnoDB;

-- ---------- INSERT (sample data) ----------
INSERT INTO departments (name) VALUES
  ('Cardiology'), ('Neurology'), ('Orthopedics'), ('Pediatrics');

INSERT INTO doctors (name, specialization, department_id) VALUES
  ('Dr. Ayesha Rahman', 'Cardiologist',     1),
  ('Dr. Imran Hossain', 'Neurologist',      2),
  ('Dr. Farhana Islam', 'Orthopedic Surgeon', 3),
  ('Dr. Tanvir Ahmed',  'Pediatrician',     4);

INSERT INTO patients (name, age, gender, diagnosis, admission_date, status, bill_amount, doctor_id) VALUES
  ('Rahim Uddin',    58, 'Male',   'Hypertension',        '2026-10-02', 'Admitted',   1250.00, 1),
  ('Nusrat Jahan',   34, 'Female', 'Migraine',            '2026-10-05', 'Discharged',  430.50, 2),
  ('Karim Mia',      67, 'Male',   'Fractured femur',     '2026-10-08', 'Admitted',   5400.00, 3),
  ('Sadia Akter',     7, 'Female', 'Asthma',              '2026-10-10', 'Outpatient',  120.00, 4),
  ('Mahmud Hasan',   45, 'Male',   'Angina',              '2026-10-12', 'Admitted',   3100.75, 1),
  ('Tania Sultana',  29, 'Female', 'Epilepsy',            '2026-10-15', 'Discharged',  980.00, 2),
  ('Jamal Khan',     52, 'Male',   'Knee replacement',    '2026-10-18', 'Discharged', 7200.00, 3),
  ('Mim Chowdhury',   5, 'Female', 'Pneumonia',           '2026-10-21', 'Admitted',   1450.25, 4),
  ('Rubel Sheikh',   61, 'Male',   'Heart failure',       '2026-10-25', 'Admitted',   6800.00, 1),
  ('Shirin Begum',   73, 'Female', 'Stroke recovery',     '2026-10-28', 'Admitted',   4950.00, 2),
  ('Arif Hossain',   38, 'Male',   'Sprained ankle',      '2026-11-02', 'Outpatient',  210.00, 3),
  ('Lamia Noor',      9, 'Female', 'Fever and infection', '2026-11-05', 'Discharged',  315.40, 4);

-- ---------- Example queries used by the application ----------
-- SELECT p.*, d.name AS doctor_name FROM patients p JOIN doctors d ON d.doctor_id = p.doctor_id
--   WHERE p.name LIKE '%rah%' AND p.status = 'Admitted' ORDER BY p.patient_id;
-- UPDATE patients SET status='Discharged', bill_amount=1300 WHERE patient_id=1;
-- DELETE FROM patients WHERE patient_id=12;
-- SELECT COUNT(*), AVG(bill_amount), MAX(bill_amount), MIN(bill_amount), SUM(bill_amount) FROM patients;
-- SELECT d.name, COUNT(p.patient_id) FROM doctors d LEFT JOIN patients p ON p.doctor_id=d.doctor_id GROUP BY d.doctor_id;
