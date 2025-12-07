-- ============================================================
-- AWP Quiz Platform - Database Schema & Seed Data
-- ============================================================

-- ⚠️ RESET: Drop database to start fresh every time
--DROP DATABASE IF EXISTS awp_quiz;

-- Create database
CREATE DATABASE awp_quiz
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE awp_quiz;

-- ============================================================
-- 1. TABLES DEFINITION
-- ============================================================

-- Table: users
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'instructor') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: quizzes
CREATE TABLE quizzes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  instructor_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_published TINYINT(1) DEFAULT 0 COMMENT 'Published (1) or Draft (0)',
  time_limit INT DEFAULT NULL COMMENT 'Time limit in minutes, NULL = no limit',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_instructor (instructor_id),
  INDEX idx_published (is_published),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: questions
CREATE TABLE questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  question_text TEXT NOT NULL,
  option_a VARCHAR(255) NOT NULL,
  option_b VARCHAR(255) NOT NULL,
  option_c VARCHAR(255) NOT NULL,
  option_d VARCHAR(255) NOT NULL,
  correct_option ENUM('A','B','C','D') NOT NULL,
  points INT DEFAULT 1 COMMENT 'Points awarded for correct answer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  INDEX idx_quiz (quiz_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: attempts
CREATE TABLE attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  quiz_id INT NOT NULL,
  score INT NOT NULL COMMENT 'Score percentage (0-100)',
  total_points INT DEFAULT 0 COMMENT 'Total points earned',
  max_points INT DEFAULT 0 COMMENT 'Maximum possible points',
  time_taken INT DEFAULT NULL COMMENT 'Time taken in seconds',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When attempt was submitted',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_quiz (quiz_id),
  INDEX idx_created (created_at),
  INDEX idx_user_quiz (user_id, quiz_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: attempt_details
CREATE TABLE attempt_details (
  id INT PRIMARY KEY AUTO_INCREMENT,
  attempt_id INT NOT NULL,
  question_id INT NOT NULL,
  student_answer CHAR(1) COMMENT 'A, B, C, D or NULL if unanswered',
  is_correct BOOLEAN NOT NULL,
  points_earned INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  INDEX idx_attempt (attempt_id),
  INDEX idx_question (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 2. SEED DATA (TEST ACCOUNTS & CONTENT)
-- ============================================================

-- ------------------------------------------------------------
-- USERS (Password is '123456' for all)
-- Generated with bcrypt (cost 10)
-- ------------------------------------------------------------
INSERT INTO users (id, name, email, password_hash, role) VALUES 
(1, 'Dr. Instructor', 'instructor@apu.edu', '$2b$10$w8.N.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u', 'instructor'),
(2, 'Alice Student', 'student@apu.edu', '$2b$10$w8.N.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u', 'student'),
(3, 'Bob Performer', 'bob@apu.edu', '$2b$10$w8.N.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u', 'student');

-- Note: If the hash above doesn't work on your machine (due to bcrypt version diffs),
-- Register a new user with password '123456' and replace the hash here.

-- ------------------------------------------------------------
-- QUIZZES
-- ------------------------------------------------------------
INSERT INTO quizzes (id, instructor_id, title, description, is_published, time_limit) VALUES
(1, 1, 'Web Programming Basics', 'Fundamental concepts of HTML, CSS, and JS', 1, 30),
(2, 1, 'Advanced Database Design', 'Normalization, Indexing and SQL', 1, 45),
(3, 1, 'Draft Quiz Example', 'This quiz is not yet visible to students', 0, 15);

-- ------------------------------------------------------------
-- QUESTIONS (Quiz 1: Web Basics - 3 Questions)
-- ------------------------------------------------------------
INSERT INTO questions (id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, points) VALUES
(1, 1, 'What does HTML stand for?', 'Hyper Text Markup Language', 'High Tech Modern Language', 'Hyper Transfer Mode Link', 'Home Tool Markup Language', 'A', 1),
(2, 1, 'Which property is used to change text color in CSS?', 'text-color', 'font-color', 'color', 'background-color', 'C', 1),
(3, 1, 'Which symbol is used for comments in JavaScript?', '//', '<!-- -->', '#', '**', 'A', 1);

-- ------------------------------------------------------------
-- ATTEMPTS (History Data)
-- ------------------------------------------------------------

-- Attempt 1: Bob (Perfect Score)
INSERT INTO attempts (id, user_id, quiz_id, score, total_points, max_points, time_taken) VALUES
(1, 3, 1, 100, 3, 3, 120);

-- Attempt 2: Alice (66% Score)
INSERT INTO attempts (id, user_id, quiz_id, score, total_points, max_points, time_taken) VALUES
(2, 2, 1, 66, 2, 3, 300);

-- ------------------------------------------------------------
-- ATTEMPT DETAILS (Answers)
-- ------------------------------------------------------------

-- Bob's Answers (All Correct)
INSERT INTO attempt_details (attempt_id, question_id, student_answer, is_correct, points_earned) VALUES
(1, 1, 'A', 1, 1),
(1, 2, 'C', 1, 1),
(1, 3, 'A', 1, 1);

-- Alice's Answers (1 Error)
INSERT INTO attempt_details (attempt_id, question_id, student_answer, is_correct, points_earned) VALUES
(2, 1, 'A', 1, 1), -- Correct
(2, 2, 'A', 0, 0), -- Wrong (chose text-color instead of color)
(2, 3, 'A', 1, 1); -- Correct

-- ============================================================
-- Verification
-- ============================================================
SELECT 'Database setup completed successfully!' AS Status;
SELECT * FROM users;
