// routes/api.js
var express = require('express');
var router = express.Router();
var db = require('../config/db');
var requireAuth = require('../middleware/auth');

// ===== API pour récupérer un quiz avec ses questions =====
router.get('/api/quizzes/:quizId', requireAuth, function(req, res, next) {
  const quizId = req.params.quizId;

  // Vérifier que le quiz est publié
  db.query(
    'SELECT * FROM quizzes WHERE id = ? AND is_published = TRUE',
    [quizId],
    function(err, quizResults) {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (quizResults.length === 0) {
        return res.status(404).json({ error: 'Quiz not found or not published' });
      }

      const quiz = quizResults[0];

      // Récupérer les questions
      db.query(
        'SELECT id, question_text, option_a, option_b, option_c, option_d, points FROM questions WHERE quiz_id = ? ORDER BY id ASC',
        [quizId],
        function(err2, questions) {
          if (err2) return res.status(500).json({ error: 'Database error' });

          // Retourner en JSON
          res.json({
            quiz: {
              id: quiz.id,
              title: quiz.title,
              description: quiz.description,
              time_limit: quiz.time_limit
            },
            questions: questions
          });
        }
      );
    }
  );
});

// ===== API pour soumettre les réponses =====
router.post('/api/quizzes/:quizId/submit', requireAuth, function(req, res, next) {
  const quizId = req.params.quizId;
  const answers = req.body.answers; // { question_id: 'A', ... }
  const timeTaken = req.body.time_taken || null;

  // Récupérer le quiz
  db.query(
    'SELECT * FROM quizzes WHERE id = ?',
    [quizId],
    function(err, quizResults) {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (quizResults.length === 0) {
        return res.status(404).json({ error: 'Quiz not found' });
      }

      const quiz = quizResults[0];

      // Récupérer les questions avec les bonnes réponses
      db.query(
        'SELECT id, correct_option, points FROM questions WHERE quiz_id = ? ORDER BY id ASC',
        [quizId],
        function(err2, questions) {
          if (err2) return res.status(500).json({ error: 'Database error' });

          let correct = 0;
          let totalPoints = 0;
          let maxPoints = 0;
          const details = [];

          questions.forEach(q => {
            const studentAnswer = answers[q.id];
            const pointsForQuestion = q.points || 1;
            maxPoints += pointsForQuestion;

            const isCorrect = studentAnswer === q.correct_option;
            if (isCorrect) {
              correct++;
              totalPoints += pointsForQuestion;
            }

            details.push({
              question_id: q.id,
              student_answer: studentAnswer || null,
              is_correct: isCorrect,
              points_earned: isCorrect ? pointsForQuestion : 0
            });
          });

          const score = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

          // Enregistrer dans la base de données
          db.query(
            'INSERT INTO attempts (user_id, quiz_id, score, total_points, max_points, time_taken) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, quizId, score, totalPoints, maxPoints, timeTaken],
            function(err3, attemptResult) {
              if (err3) return res.status(500).json({ error: 'Database error' });

              const attemptId = attemptResult.insertId;

              // Enregistrer les détails
              const detailInserts = details.map(d => {
                return new Promise((resolve, reject) => {
                  db.query(
                    'INSERT INTO attempt_details (attempt_id, question_id, student_answer, is_correct, points_earned) VALUES (?, ?, ?, ?, ?)',
                    [attemptId, d.question_id, d.student_answer, d.is_correct, d.points_earned],
                    (err4) => {
                      if (err4) reject(err4);
                      else resolve();
                    }
                  );
                });
              });

              Promise.all(detailInserts)
                .then(() => {
                  // Retourner le résultat en JSON
                  res.json({
                    success: true,
                    score: score,
                    totalPoints: totalPoints,
                    maxPoints: maxPoints,
                    correctAnswers: correct,
                    totalQuestions: questions.length,
                    attemptId: attemptId
                  });
                })
                .catch(next);
            }
          );
        }
      );
    }
  );
});

module.exports = router;
