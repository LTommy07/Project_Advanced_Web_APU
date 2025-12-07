# 📘 AWP Quiz Platform

**Student:** Noam SLEZACK ,Tommy LIM ,Andrea DARIO
**Intake:** APUFEFREI2509  
**Module:** Advanced Web Programming

***

## 🚀 Installation & Setup

### 1. Prerequisites
- Node.js (v14+)
- MySQL Server

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
The project includes a `schema.sql` file that creates the database, tables, and inserts seed data (users, quizzes, attempts).

1. Open your MySQL client.
2. Run the script located at: **`database/schema.sql`**
3. This will create a database named `awp_quiz`.

### 4. Configuration
Create a `.env` file in the root directory:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=awp_quiz
JWT_SECRET=secret_key_123
PORT=3000
```
> ⚠️ **Important:** Update `DB_PASSWORD` with your local MySQL password.

### 5. Run the Application
```bash
npm start
```
Access the app at: **http://localhost:3000**

***

## 🧪 Test Accounts

The database is pre-filled with these accounts for testing:

| Role | Email | Password |
|------|-------|----------|
| **Instructor** | `instructor@apu.edu` | `123456` |
| **Student** | `student@apu.edu` | `123456` |

***

## 📁 Project Structure
- **`routes/`**: Backend logic and API endpoints.
- **`views/`**: Frontend templates (Pug).
- **`public/`**: Static assets (CSS, Client-side JS).
- **`database/`**: SQL schema and seed data.
- **`middleware/`**: Authentication and role checks.
