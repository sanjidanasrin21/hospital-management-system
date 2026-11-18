# Hospital Management System

Single-page web app for the Database Management System Lab. Stores patient records in MySQL and supports add, view, search/filter, update, delete, and summary statistics.

**Stack:** MySQL 8, Node.js + Express (`mysql2`), plain HTML/CSS/JS (one page, no framework).

## Run it

```bash
# 1. Install and start MySQL (macOS)
brew install mysql && brew services start mysql

# 2. Create and populate the database (12 sample patients)
mysql -u root < database/schema.sql

# 3. Install dependencies and start
cp .env.example .env      # edit DB_PASSWORD if your root user has one
npm install
npm start                 # http://localhost:5075
```

## Features vs. lab requirements

| Requirement | Where |
|---|---|
| Add records | Form on the page, `INSERT` in `POST /api/patients` |
| View records | Table, `SELECT ... JOIN` in `GET /api/patients` |
| Search / filter | Search box (name, ID, diagnosis) and status filter, `WHERE ... LIKE` |
| Update records | Edit button loads the row into the form, `UPDATE` in `PUT /api/patients/:id` |
| Delete with confirmation | Delete button asks before `DELETE` |
| Aggregate summaries | `COUNT`, `AVG`, `MAX`, `MIN`, `SUM`, and `COUNT ... GROUP BY` per doctor |
| Primary + foreign keys | `departments` -> `doctors` -> `patients` |
| 10+ sample rows | 12 patients, 4 doctors, 4 departments |

See `docs/report.md` for the ER diagram, key queries, and screenshot checklist.
