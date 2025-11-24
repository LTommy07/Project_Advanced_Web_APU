-- Migration script for existing AWP Quiz Platform databases
-- Run this if you already have tables created with the original schema
-- This adds new columns and tables without breaking existing data

USE awp_quiz;

-- ============================================
-- 1. QUIZZES TABLE - Add new columns
-- ============================================

-- Add is_published column (if not exists)
ALTER TABLE quizzes 
  ADD COLUMN IF NOT EXISTS is_published TINYINT(1) DEFAULT 0 AFTER description;

-- Add time_limit column (if not exists)
ALTER TABLE quizzes 
  ADD COLUMN IF NOT EXISTS time_limit INT DEFAULT NULL COMMENT 'Time limit in minutes' AFTER is_published;

-- Add updated_at if missing
ALTER TABLE quizzes 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- ============================================
-- 2. QUESTIONS TABLE - Add points and updated_at
-- ============================================

-- Add points column (if not exists)
ALTER TABLE questions 
  ADD COLUMN IF NOT EXISTS points INT DEFAULT 1 COMMENT 'Points for this question' AFTER correct_option;

-- Add updated_at if missing
ALTER TABLE questions 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER points;

-- ============================================
-- 3. ATTEMPTS TABLE - Add tracking columns
-- ============================================

-- Add total_points column (if not exists)
ALTER TABLE attempts 
  ADD COLUMN IF NOT EXISTS total_points INT DEFAULT 0 COMMENT 'Total points earned' AFTER score;

-- Add max_points column (if not exists)
ALTER TABLE attempts 
  ADD COLUMN IF NOT EXISTS max_points INT DEFAULT 0 COMMENT 'Maximum possible points' AFTER total_points;

-- Add time_taken column (if not exists)
ALTER TABLE attempts 
  ADD COLUMN IF NOT EXISTS time_taken INT DEFAULT NULL COMMENT 'Time taken in seconds' AFTER max_points;

-- Remove taken_at if it exists (we use created_at instead)
-- This is safe because we keep created_at which has the same data
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE table_schema = 'awp_quiz' 
                   AND table_name = 'attempts' 
                   AND column_name = 'taken_at');

SET @sql = IF(@col_exists > 0, 
  'ALTER TABLE attempts DROP COLUMN taken_at', 
  'SELECT "Column taken_at does not exist, skipping..." as info');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 4. CREATE attempt_details TABLE
-- ============================================

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

-- ============================================
-- 5. ADD INDEXES for better performance
-- ============================================

-- Add indexes to users (if not exists)
ALTER TABLE users 
  ADD INDEX IF NOT EXISTS idx_email (email),
  ADD INDEX IF NOT EXISTS idx_role (role);

-- Add indexes to quizzes (if not exists)
ALTER TABLE quizzes 
  ADD INDEX IF NOT EXISTS idx_instructor (instructor_id),
  ADD INDEX IF NOT EXISTS idx_published (is_published),
  ADD INDEX IF NOT EXISTS idx_created (created_at);

-- Add indexes to questions (if not exists)
ALTER TABLE questions 
  ADD INDEX IF NOT EXISTS idx_quiz (quiz_id);

-- Add indexes to attempts (if not exists)
ALTER TABLE attempts 
  ADD INDEX IF NOT EXISTS idx_user (user_id),
  ADD INDEX IF NOT EXISTS idx_quiz (quiz_id),
  ADD INDEX IF NOT EXISTS idx_created (created_at),
  ADD INDEX IF NOT EXISTS idx_user_quiz (user_id, quiz_id);

-- ============================================
-- VERIFICATION
-- ============================================

SELECT '✅ Migration completed successfully!' as status;

-- Show table structures to verify
SELECT 'Quizzes columns:' as info;
SHOW COLUMNS FROM quizzes;

SELECT 'Questions columns:' as info;
SHOW COLUMNS FROM questions;

SELECT 'Attempts columns:' as info;
SHOW COLUMNS FROM attempts;

SELECT 'Attempt_details structure:' as info;
SHOW COLUMNS FROM attempt_details;
