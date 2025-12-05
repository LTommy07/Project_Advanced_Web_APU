# Installation Instructions

## Quick Setup (One Command)

mysql -u root -p < database/schema.sql


## Step-by-Step Setup

### 1. Create Database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS awp_quiz CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"


### 2. Import Schema
mysql -u root -p awp_quiz < database/schema.sql


### 3. Verify Installation
mysql -u root -p awp_quiz -e "SHOW TABLES;"

Expected output:
- users
- quizzes
- questions
- attempts
- attempt_details

## Database Credentials

Update `.env` file with your MySQL credentials:
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=awp_quiz


## Test Accounts (if using sample data)

**Instructor:**
- Email: instructor@apu.edu
- Password: instructor123

**Student:**
- Email: student@apu.edu
- Password: student123

> **Note:** Sample passwords are hashed examples. For real testing, register through the application.

