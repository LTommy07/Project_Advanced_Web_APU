-- AWP Quiz Platform - Enhanced Database Schema
-- Ajout des fonctionnalités : quiz published/draft, historique détaillé des réponses

-- Table users (déjà existante, pour référence)
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'instructor') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

-- Table quizzes avec la colonne is_published
CREATE TABLE IF NOT EXISTS quizzes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  instructor_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  time_limit INT DEFAULT NULL COMMENT 'Time limit in minutes, NULL for no limit',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_instructor (instructor_id),
  INDEX idx_published (is_published),
  INDEX idx_created (created_at)
);

-- Table questions
CREATE TABLE IF NOT EXISTS questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  quiz_id INT NOT NULL,
  question_text TEXT NOT NULL,
  option_a VARCHAR(500) NOT NULL,
  option_b VARCHAR(500) NOT NULL,
  option_c VARCHAR(500) NOT NULL,
  option_d VARCHAR(500) NOT NULL,
  correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
  points INT DEFAULT 1 COMMENT 'Points for this question',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  INDEX idx_quiz (quiz_id)
);

-- Table attempts (tentatives de quiz)
CREATE TABLE IF NOT EXISTS attempts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  quiz_id INT NOT NULL,
  score INT NOT NULL COMMENT 'Score in percentage (0-100)',
  total_points INT DEFAULT 0 COMMENT 'Total points earned',
  max_points INT DEFAULT 0 COMMENT 'Maximum possible points',
  time_taken INT DEFAULT NULL COMMENT 'Time taken in seconds',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When the attempt was taken',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_quiz (quiz_id),
  INDEX idx_created (created_at),
  INDEX idx_user_quiz (user_id, quiz_id)
);

-- Table attempt_details (détails des réponses pour chaque tentative)
CREATE TABLE IF NOT EXISTS attempt_details (
  id INT PRIMARY KEY AUTO_INCREMENT,
  attempt_id INT NOT NULL,
  question_id INT NOT NULL,
  student_answer CHAR(1) COMMENT 'A, B, C, D or NULL if not answered',
  is_correct BOOLEAN NOT NULL,
  points_earned INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  INDEX idx_attempt (attempt_id),
  INDEX idx_question (question_id)
);

-- Migration: Ajouter la colonne is_published aux quizzes existants
ALTER TABLE quizzes 
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE AFTER description;

-- Migration: Ajouter time_limit aux quizzes existants  
ALTER TABLE quizzes 
  ADD COLUMN IF NOT EXISTS time_limit INT DEFAULT NULL COMMENT 'Time limit in minutes' AFTER is_published;

-- Migration: Ajouter points aux questions existantes
ALTER TABLE questions 
  ADD COLUMN IF NOT EXISTS points INT DEFAULT 1 COMMENT 'Points for this question' AFTER correct_option;

-- Migration: Ajouter colonnes de tracking aux attempts existants
ALTER TABLE attempts 
  ADD COLUMN IF NOT EXISTS total_points INT DEFAULT 0 COMMENT 'Total points earned' AFTER score,
  ADD COLUMN IF NOT EXISTS max_points INT DEFAULT 0 COMMENT 'Maximum possible points' AFTER total_points,
  ADD COLUMN IF NOT EXISTS time_taken INT DEFAULT NULL COMMENT 'Time taken in seconds' AFTER max_points;

-- Migration: Renommer created_at en attempts pour plus de clarté
ALTER TABLE attempts 
  CHANGE COLUMN created_at created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When the attempt was taken';
