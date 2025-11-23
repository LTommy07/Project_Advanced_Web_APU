var express = require('express');
var router = express.Router();
var requireAuth = require('../middleware/auth');
var db = require('../config/db'); // MySQL

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { user: req.user || null });
});

// Dashboard (protégé)
router.get('/dashboard', requireAuth, function(req, res, next) {
  // req.user vient du middleware requireAuth
  res.render('dashboard', { user: req.user });
});

// Liste des quizzes pour les étudiants
router.get('/student/quizzes', requireAuth, function(req, res, next) {
  // sécurité : on vérifie que c'est bien un student
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).send('Access denied. Students only.');
  }

  const sql = `
    SELECT q.id,
           q.title,
           q.description,
           q.created_at,
           u.name AS instructor_name
    FROM quizzes q
    JOIN users u ON q.instructor_id = u.id
    ORDER BY q.created_at DESC
  `;

  db.query(sql, function(err, results) {
    if (err) {
      console.error(err);
      return next(err);
    }

    res.render('student-quizzes', {
      user: req.user,
      quizzes: results
    });
  });
});

// Page pour faire un quiz (côté étudiant)
router.get('/student/quizzes/:quizId/take', requireAuth, function(req, res, next) {
  if (req.user.role !== 'student') {
    return res.status(403).send('Access denied. Students only.');
  }

  const quizId = req.params.quizId;

  // 1. récupérer le quiz
  db.query('SELECT * FROM quizzes WHERE id = ?', [quizId], function(err, quizResults) {
    if (err) return next(err);
    if (quizResults.length === 0) {
      return res.status(404).send('Quiz not found');
    }

    const quiz = quizResults[0];

    // 2. récupérer les questions
    db.query(
      'SELECT * FROM questions WHERE quiz_id = ? ORDER BY id ASC',
      [quizId],
      function(err2, questionResults) {
        if (err2) return next(err2);

        res.render('take-quiz', {
          user: req.user,
          quiz: quiz,
          questions: questionResults
        });
      }
    );
  });
});

// Soumission des réponses d'un quiz
router.post('/student/quizzes/:quizId/submit', requireAuth, function(req, res, next) {
  if (req.user.role !== 'student') {
    return res.status(403).send('Access denied. Students only.');
  }

  const quizId = req.params.quizId;

  // 1. Récupérer le quiz
  db.query('SELECT * FROM quizzes WHERE id = ?', [quizId], function(err, quizResults) {
    if (err) return next(err);
    if (quizResults.length === 0) {
      return res.status(404).send('Quiz not found');
    }

    const quiz = quizResults[0];

    // 2. Récupérer les bonnes réponses
    db.query(
      'SELECT id, question_text, correct_option FROM questions WHERE quiz_id = ? ORDER BY id ASC',
      [quizId],
      function(err2, questionRows) {
        if (err2) return next(err2);

        const total = questionRows.length;
        let correct = 0;
        const details = [];

        questionRows.forEach(q => {
          const fieldName = `q-${q.id}`;
          const studentAnswer = req.body[fieldName]; // "A","B","C","D" ou undefined

          const isCorrect = studentAnswer === q.correct_option;
          if (isCorrect) correct++;

          details.push({
            question_text: q.question_text,
            correct_option: q.correct_option,
            student_answer: studentAnswer || 'No answer',
            isCorrect: isCorrect
          });
        });

        const score = total > 0 ? Math.round((correct / total) * 100) : 0;

        res.render('quiz-result', {
          user: req.user,
          quiz: quiz,
          total: total,
          correct: correct,
          score: score,
          details: details
        });
      }
    );
  });
});

module.exports = router;
