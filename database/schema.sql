-- ============================================================
-- AWP Quiz Platform - Complete Database Schema

-- Course: Advanced Web Programming - APU 2025
-- Description: Full database setup with all tables and indexes
-- ============================================================

-- Create database
CREATE DATABASE IF NOT EXISTS awp_quiz
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE awp_quiz;

-- ============================================================
-- Table: users
-- Description: Stores student and instructor accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
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

-- ============================================================
-- Table: quizzes
-- Description: Stores quiz information created by instructors
-- ============================================================
CREATE TABLE IF NOT EXISTS quizzes (
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

-- ============================================================
-- Table: questions
-- Description: Multiple choice questions for each quiz
-- ============================================================
CREATE TABLE IF NOT EXISTS questions (
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

-- ============================================================
-- Table: attempts
-- Description: Records of student quiz attempts
-- ============================================================
CREATE TABLE IF NOT EXISTS attempts (
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

-- ============================================================
-- Table: attempt_details
-- Description: Individual question responses for each attempt
-- ============================================================
CREATE TABLE IF NOT EXISTS attempt_details (
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
-- Sample Data (Optional - for testing)
-- ============================================================

-- Insert sample instructor (password: instructor123)
INSERT INTO users (name, email, password_hash, role) VALUES
('Dr. Jean Dupont', 'instructor@apu.edu', '$2b$10$examplehash123456789', 'instructor');

-- Insert sample student (password: student123)
INSERT INTO users (name, email, password_hash, role) VALUES
('Marie Martin', 'student@apu.edu', '$2b$10$examplehash987654321', 'student');

-- ============================================================
-- Verification Queries
-- ============================================================
SELECT 'Database setup completed successfully!' AS Status;
SHOW TABLES;
