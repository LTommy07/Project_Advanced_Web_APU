// routes/quizzes.js
var express = require('express');
var router = express.Router();
var db = require('../config/db');
var requireAuth = require('../middleware/auth'); // ton middleware qui met req.user

// petit helper : vérifie que l'utilisateur est bien un instructor
function ensureInstructor(req, res, next) {
  if (!req.user || req.user.role !== 'instructor') {
    return res.status(403).send('Access denied. Instructors only.');
  }
  next();
}

// Liste des quizzes de l'instructor connecté
router.get('/instructor/quizzes', requireAuth, ensureInstructor, function (req, res, next) {
  db.query(
    'SELECT * FROM quizzes WHERE instructor_id = ? ORDER BY created_at DESC',
    [req.user.id],
    function (err, results) {
      if (err) return next(err);

      res.render('instructor-quizzes', {
        user: req.user,
        quizzes: results
      });
    }
  );
});

// Formulaire pour créer un nouveau quiz
router.get('/instructor/quizzes/new', requireAuth, ensureInstructor, function (req, res, next) {
  res.render('instructor-quiz-form', {
    user: req.user,
    error: null,
    quiz: { title: '', description: '' }
  });
});
// Traitement du formulaire de création de quiz
router.post('/instructor/quizzes', requireAuth, ensureInstructor, function (req, res, next) {
  const { title, description } = req.body;
     // petite validation
  if (!title || title.trim() === '') {
    return res.render('instructor-quiz-form', {
      user: req.user,
      error: 'Title is required.',
      quiz: { title, description }
    });
  }

  db.query(
    'INSERT INTO quizzes (instructor_id, title, description) VALUES (?, ?, ?)',
    [req.user.id, title, description],
    function (err, result) {
      if (err) return next(err);
      // une fois créé, on retourne sur la liste
      res.redirect('/instructor/quizzes');
    }
  );
});

// Afficher les questions d'un quiz
router.get('/instructor/quizzes/:quizId/questions',
  requireAuth,
  ensureInstructor,
  function (req, res, next) {
    const quizId = req.params.quizId;

    db.query(
      'SELECT * FROM quizzes WHERE id = ? AND instructor_id = ?',
      [quizId, req.user.id],
      function (err, quizResults) {
        if (err) return next(err);
        if (quizResults.length === 0) {
          return res.status(404).send('Quiz not found');
        }

        const quiz = quizResults[0];

        db.query(
          'SELECT * FROM questions WHERE quiz_id = ? ORDER BY id ASC',
          [quizId],
          function (err2, questionResults) {
            if (err2) return next(err2);

            res.render('instructor-questions', {
              user: req.user,
              quiz,
              questions: questionResults
            });
          }
        );
      }
    );
  }
);

// Ajouter une nouvelle question
router.post('/instructor/quizzes/:quizId/questions',
  requireAuth,
  ensureInstructor,
  function (req, res, next) {
    const quizId = req.params.quizId;
    const { question_text, option_a, option_b, option_c, option_d, correct_option } = req.body;

    if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_option) {
      return res.redirect(`/instructor/quizzes/${quizId}/questions`);
    }

    db.query(
      `INSERT INTO questions
        (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [quizId, question_text, option_a, option_b, option_c, option_d, correct_option],
      function (err, result) {
        if (err) return next(err);
        res.redirect(`/instructor/quizzes/${quizId}/questions`);
      }
    );
  }
);

// Liste des quizzes disponibles pour les étudiants
router.get('/student/quizzes', requireAuth, function (req, res, next) {
  const sql = `
    SELECT q.id, q.title, q.description, q.created_at,
           u.name AS instructor_name
    FROM quizzes q
    JOIN users u ON q.instructor_id = u.id
    ORDER BY q.created_at DESC
  `;

  db.query(sql, function (err, results) {
    if (err) return next(err);

    res.render('student-quizzes', {
      user: req.user,
      quizzes: results
    });
  });
});


// Page pour faire un quiz (côté étudiant)
router.get('/student/quizzes/:quizId/take', requireAuth, function (req, res, next) {
  const quizId = req.params.quizId;

  // On récupère d'abord le quiz
  db.query(
    'SELECT * FROM quizzes WHERE id = ?',
    [quizId],
    function (err, quizResults) {
      if (err) return next(err);
      if (quizResults.length === 0) {
        return res.status(404).send('Quiz not found');
      }

      const quiz = quizResults[0];

      // Puis on récupère ses questions
      db.query(
        'SELECT * FROM questions WHERE quiz_id = ? ORDER BY id ASC',
        [quizId],
        function (err2, questionResults) {
          if (err2) return next(err2);

          res.render('take-quiz', {
            user: req.user,
            quiz,
            questions: questionResults
          });
        }
      );
    }
  );
});

// Soumission des réponses d'un quiz
router.post('/student/quizzes/:quizId/submit', requireAuth, function (req, res, next) {
  const quizId = req.params.quizId;

  // On récupère le quiz + les bonnes réponses
  db.query(
    'SELECT * FROM quizzes WHERE id = ?',
    [quizId],
    function (err, quizResults) {
      if (err) return next(err);
      if (quizResults.length === 0) {
        return res.status(404).send('Quiz not found');
      }

      const quiz = quizResults[0];

      db.query(
        'SELECT id, question_text, correct_option FROM questions WHERE quiz_id = ? ORDER BY id ASC',
        [quizId],
        function (err2, questionRows) {
          if (err2) return next(err2);

          const total = questionRows.length;
          let correct = 0;
          const details = [];

          questionRows.forEach(q => {
            const fieldName = `q-${q.id}`;
            const studentAnswer = req.body[fieldName];   // "A","B","C","D" ou undefined

            const isCorrect = studentAnswer === q.correct_option;
            if (isCorrect) correct++;

            details.push({
              question_text: q.question_text,
              correct_option: q.correct_option,
              student_answer: studentAnswer || 'No answer',
              isCorrect
            });
          });

          const score = total > 0 ? Math.round((correct / total) * 100) : 0;

          res.render('quiz-result', {
            user: req.user,
            quiz,
            total,
            correct,
            score,
            details
          });
        }
      );
    }
  );
});





module.exports = router;
