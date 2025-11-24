# AWP Quiz Platform

## 🎯 Project Overview

AWP Quiz Platform is an online assessment web application built with Node.js, Express, MySQL, and Pug templates. It allows instructors to create and manage quizzes while students can take them and view their results.

## ✨ Features

### For Instructors
- ✅ Create, edit, and manage quizzes
- ✅ Add multiple-choice questions with customizable points
- ✅ **NEW:** Publish/unpublish quizzes (draft mode)
- ✅ **NEW:** Set time limits for quizzes
- ✅ **NEW:** View detailed attempt analytics
- ✅ **NEW:** See question-by-question responses from students
- ✅ Track student performance and scores

### For Students
- ✅ Browse and take published quizzes
- ✅ Submit answers and receive instant feedback
- ✅ View score percentage and points earned
- ✅ **NEW:** Access detailed results history
- ✅ **NEW:** See time taken for each attempt

### Security & Authentication
- ✅ Secure user registration and login
- ✅ Password hashing with bcrypt
- ✅ JWT-based authentication with httpOnly cookies
- ✅ Role-based access control (Instructor/Student)
- ✅ Protected routes with middleware

## 📦 Tech Stack

- **Backend:** Node.js + Express
- **Database:** MySQL (with mysql2)
- **Templates:** Pug
- **Authentication:** JWT + bcrypt
- **Dev Tools:** Nodemon

## 🚀 Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### Setup Steps

1. **Clone the repository**
```bash
git clone https://github.com/LTommy07/Project_Advanced_Web_APU.git
cd Project_Advanced_Web_APU
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=awp_quiz
JWT_SECRET=your_super_secret_jwt_key
```

4. **Create database and run migrations**
```bash
# Create the database
mysql -u root -p -e "CREATE DATABASE awp_quiz;"

# Run the schema
mysql -u root -p awp_quiz < database/schema.sql
```

5. **Start the application**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

6. **Access the application**

Open your browser and navigate to: `http://localhost:3000`

## 💾 Database Schema

### Tables

#### `users`
- `id` (PK)
- `name`
- `email` (unique)
- `password_hash`
- `role` (enum: 'student', 'instructor')
- `created_at`, `updated_at`

#### `quizzes`
- `id` (PK)
- `instructor_id` (FK -> users)
- `title`
- `description`
- **`is_published`** (boolean, default: false) ⭐ NEW
- **`time_limit`** (int, minutes) ⭐ NEW
- `created_at`, `updated_at`

#### `questions`
- `id` (PK)
- `quiz_id` (FK -> quizzes)
- `question_text`
- `option_a`, `option_b`, `option_c`, `option_d`
- `correct_option` (A/B/C/D)
- **`points`** (int, default: 1) ⭐ NEW
- `created_at`, `updated_at`

#### `attempts`
- `id` (PK)
- `user_id` (FK -> users)
- `quiz_id` (FK -> quizzes)
- `score` (percentage)
- **`total_points`** (points earned) ⭐ NEW
- **`max_points`** (maximum possible) ⭐ NEW
- **`time_taken`** (seconds) ⭐ NEW
- `created_at`

#### `attempt_details` ⭐ NEW TABLE
- `id` (PK)
- `attempt_id` (FK -> attempts)
- `question_id` (FK -> questions)
- `student_answer` (A/B/C/D or NULL)
- `is_correct` (boolean)
- `points_earned`
- `created_at`

## 🔄 Migrating from Previous Version

If you have an existing database, run these migrations:

```sql
-- Add new columns to quizzes
ALTER TABLE quizzes 
  ADD COLUMN is_published BOOLEAN DEFAULT FALSE AFTER description,
  ADD COLUMN time_limit INT DEFAULT NULL AFTER is_published;

-- Add points to questions
ALTER TABLE questions 
  ADD COLUMN points INT DEFAULT 1 AFTER correct_option;

-- Add tracking columns to attempts
ALTER TABLE attempts 
  ADD COLUMN total_points INT DEFAULT 0 AFTER score,
  ADD COLUMN max_points INT DEFAULT 0 AFTER total_points,
  ADD COLUMN time_taken INT DEFAULT NULL AFTER max_points;

-- Create attempt_details table
CREATE TABLE attempt_details (
  id INT PRIMARY KEY AUTO_INCREMENT,
  attempt_id INT NOT NULL,
  question_id INT NOT NULL,
  student_answer CHAR(1),
  is_correct BOOLEAN NOT NULL,
  points_earned INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  INDEX idx_attempt (attempt_id),
  INDEX idx_question (question_id)
);
```

## 📝 API Routes

### Authentication
- `GET /login` - Login page
- `POST /login` - Process login
- `GET /register` - Registration page
- `POST /register` - Process registration
- `POST /logout` - Logout user

### Instructor Routes
- `GET /instructor/quizzes` - List all quizzes
- `GET /instructor/quizzes/new` - Create quiz form
- `POST /instructor/quizzes` - Create new quiz
- `POST /instructor/quizzes/:id/toggle-publish` - Publish/unpublish ⭐ NEW
- `GET /instructor/quizzes/:id/questions` - Manage questions
- `POST /instructor/quizzes/:id/questions` - Add question
- `GET /instructor/quizzes/:id/results` - View results
- `GET /instructor/attempts/:id/details` - View attempt details ⭐ NEW

### Student Routes
- `GET /student/quizzes` - List published quizzes
- `GET /student/quizzes/:id/take` - Take quiz
- `POST /student/quizzes/:id/submit` - Submit answers
- `GET /student/results` - Results history

## 🛠️ Development

### Project Structure
```
Project_Advanced_Web_APU/
├── app.js                 # Main application file
├── bin/
│   └── www                # Server startup script
├── config/
│   └── db.js              # Database connection
├── database/
│   └── schema.sql         # Database schema
├── middleware/
│   └── auth.js            # Authentication middleware
├── routes/
│   ├── auth.js            # Authentication routes
│   ├── index.js           # Main routes
│   ├── quiz.js            # Quiz routes
│   └── quizzes.js         # Enhanced quiz management
├── views/
│   ├── layout.pug         # Base layout
│   ├── login.pug
│   ├── register.pug
│   ├── dashboard.pug
│   ├── instructor-*.pug   # Instructor views
│   └── student-*.pug      # Student views
├── public/
│   └── stylesheets/
├── package.json
└── .env.example
```

### Running in Development
```bash
npm run dev
```

This uses `nodemon` to auto-restart the server on file changes.

## 🔐 Security Features

- 🔒 Passwords hashed with bcrypt (10 rounds)
- 🔑 JWT tokens stored in httpOnly cookies
- 🚫 SQL injection prevention with prepared statements
- 👥 Role-based access control
- ⏱️ Token expiration (2 hours)

## 🎯 Upcoming Features

- [ ] Question types: True/False, Short Answer
- [ ] Image support in questions
- [ ] Quiz categories/tags
- [ ] Advanced analytics with charts
- [ ] Email notifications
- [ ] Export results to CSV/PDF
- [ ] Quiz search and filtering
- [ ] Question bank for reusability

## 👥 Contributors

- **LTommy07** - Initial development

## 📝 License

This project is for educational purposes as part of the Advanced Web Programming course at Asia Pacific University.

## 🐛 Issues & Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**Built with ❤️ for APU Advanced Web Programming 2025**
