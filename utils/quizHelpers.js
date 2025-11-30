// utils/quizHelpers.js
// Fonctions utilitaires pour les opérations sur les quizzes

const db = require('../config/db');

/**
 * Récupère un quiz par ID pour un instructor spécifique
 * @param {number} quizId - ID du quiz
 * @param {number} instructorId - ID de l'instructor
 * @returns {Promise<Object>} Le quiz ou rejette avec erreur
 */
function getQuizByIdForInstructor(quizId, instructorId) {
  return new Promise((resolve, reject) => {
    db.query(
      'SELECT * FROM quizzes WHERE id = ? AND instructor_id = ?',
      [quizId, instructorId],
      (err, results) => {
        if (err) return reject(err);
        if (results.length === 0) {
          return reject(new Error('Quiz not found or access denied'));
        }
        resolve(results[0]);
      }
    );
  });
}

/**
 * Récupère un quiz publié par ID
 * @param {number} quizId - ID du quiz
 * @returns {Promise<Object>} Le quiz ou rejette avec erreur
 */
function getPublishedQuizById(quizId) {
  return new Promise((resolve, reject) => {
    db.query(
      'SELECT * FROM quizzes WHERE id = ? AND is_published = TRUE',
      [quizId],
      (err, results) => {
        if (err) return reject(err);
        if (results.length === 0) {
          return reject(new Error('Quiz not found or not published'));
        }
        resolve(results[0]);
      }
    );
  });
}

/**
 * Récupère toutes les questions d'un quiz
 * @param {number} quizId - ID du quiz
 * @returns {Promise<Array>} Les questions
 */
function getQuestionsByQuizId(quizId) {
  return new Promise((resolve, reject) => {
    db.query(
      'SELECT * FROM questions WHERE quiz_id = ? ORDER BY id ASC',
      [quizId],
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
}

module.exports = {
  getQuizByIdForInstructor,
  getPublishedQuizById,
  getQuestionsByQuizId
};
