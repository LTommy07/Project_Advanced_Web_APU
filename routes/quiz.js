var express = require('express');
var router = express.Router();
var db = require('../config/db');
var requireAuth = require('../middleware/auth');

function ensureInstructor(req, res) {
  if (!req.user || req.user.role !== 'instructor') {
    res.status(403).send('Access denied. Instructors only.');
    return false;
  }
  return true;
}

// Liste des quiz de l'instructor
router.get('/instructor/quizzes', requireAuth, function(req, res, next) {
  if (!ensureInstructor(req, res)) return;

  db.query(
    'SELECT * FROM quizzes WHERE instructor_id = ? ORDER BY created_at DESC',
    [req.user.id],
    function(err, results) {
      if (err) return next(err);
      res.render('instructor-quizzes', {
        user: req.user,
        quizzes: results
      });
    }
  );
});

// Formulaire pour créer un quiz
router.get('/instructor/quizzes/new', requireAuth, function(req, res, next) {
  if (!ensureInstructor(req, res)) return;

  res.render('instructor-quiz-form', {
    error: null,
    quiz: { title: '', description: '' }
  });
});

// Traitement du formulaire de création
router.post('/instructor/quizzes', requireAuth, function(req, res, next) {
  if (!ensureInstructor(req, res)) return;

  const { title, description } = req.body;

  if (!title) {
    return res.render('instructor-quiz-form', {
      error: 'Title is required.',
      quiz: { title, description }
    });
  }

  db.query(
    'INSERT INTO quizzes (instructor_id, title, description) VALUES (?, ?, ?)',
    [req.user.id, title, description],
    function(err, result) {
      if (err) return next(err);
      res.redirect('/instructor/quizzes');
    }
  );
});

module.exports = router;
