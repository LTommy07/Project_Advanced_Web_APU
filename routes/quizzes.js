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


// ==================== PAGE D'ACCUEIL ====================

// Route pour la page d'accueil (home)
router.get('/', function(req, res, next) {
  res.render('index', { title: 'AWP Quiz Platform' });
});

// ==================== DASHBOARD ====================

// Dashboard (protégé)
router.get('/dashboard', requireAuth, function(req, res, next) {
  res.render('dashboard', { user: req.user });
});

// ==================== STUDENT ROUTES ====================

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
    WHERE q.is_published = TRUE
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

// Page pour faire un quiz (côté étudiant) - Vue.js version
router.get('/student/quizzes/:quizId/take', requireAuth, function(req, res, next) {
  if (req.user.role !== 'student') {
    return res.status(403).send('Access denied. Students only.');
  }
  const quizId = req.params.quizId;
  // Vérifier que le quiz existe et est publié
  db.query('SELECT id FROM quizzes WHERE id = ? AND is_published = TRUE', [quizId], function(err, results) {
    if (err) return next(err);
    if (results.length === 0) {
      return res.status(404).send('Quiz not found or not published');
    }
    // Rendre la vue Vue.js avec juste l'ID du quiz
    res.render('take-quiz-vue', {
      user: req.user,
      quizId: quizId
    });
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
        // Enregistrer la tentative dans la table attempts
        const insertSql = 'INSERT INTO attempts (user_id, quiz_id, score) VALUES (?, ?, ?)';
        db.query(insertSql, [req.user.id, quizId, score], function(err3) {
          if (err3) {
            console.error(err3);
            return next(err3);
          }
          // Afficher la page de résultat
          res.render('quiz-result', {
            user: req.user,
            quiz: quiz,
            total: total,
            correct: correct,
            score: score,
            details: details
          });
        });
      }
    );
  });
});

// Historique des résultats de l'étudiant
router.get('/student/results', requireAuth, function(req, res, next) {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).send('Access denied. Students only.');
  }
  const sql = `
    SELECT 
      a.id,
      a.score,
      a.created_at,
      q.title AS quiz_title
    FROM attempts a
    JOIN quizzes q ON a.quiz_id = q.id
    WHERE a.user_id = ?
    ORDER BY a.created_at DESC
  `;
  db.query(sql, [req.user.id], function(err, results) {
    if (err) {
      console.error(err);
      return next(err);
    }
    res.render('student-results', {
      user: req.user,
      attempts: results
    });
  });
});




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
    quiz: { title: '', description: '', time_limit: null }
  });
});

// Traitement du formulaire de création de quiz
router.post('/instructor/quizzes', requireAuth, ensureInstructor, function (req, res, next) {
  const { title, description, time_limit } = req.body;
  
  // petite validation
  if (!title || title.trim() === '') {
    return res.render('instructor-quiz-form', {
      user: req.user,
      error: 'Title is required.',
      quiz: { title, description, time_limit }
    });
  }
  // 🐛 DEBUG
  console.log('=== CRÉATION QUIZ ===');
  console.log('title:', title);
  console.log('description:', description);
  console.log('time_limit (brut):', time_limit);
  console.log('type de time_limit:', typeof time_limit);

  let timeLimitValue = null;
  if (time_limit && time_limit.toString().trim() !== '') {
    timeLimitValue = parseInt(time_limit, 10);
  }
  
  console.log('timeLimitValue (final):', timeLimitValue);

  db.query(
    'INSERT INTO quizzes (instructor_id, title, description, time_limit, is_published) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, title, description, timeLimitValue, false],
    function (err, result) {
      if (err) return next(err);
      // une fois créé, on retourne sur la liste
      res.redirect('/instructor/quizzes');
    }
  );
});

// ✨ Publier/Dépublier un quiz
router.post('/instructor/quizzes/:quizId/toggle-publish', requireAuth, ensureInstructor, function(req, res, next) {
  const quizId = req.params.quizId;

  // Vérifier que le quiz appartient à cet instructor
  db.query(
    'SELECT * FROM quizzes WHERE id = ? AND instructor_id = ?',
    [quizId, req.user.id],
    function(err, results) {
      if (err) return next(err);
      if (results.length === 0) {
        return res.status(404).send('Quiz not found');
      }

      const quiz = results[0];
      const newStatus = !quiz.is_published;

      db.query(
        'UPDATE quizzes SET is_published = ? WHERE id = ?',
        [newStatus, quizId],
        function(err2) {
          if (err2) return next(err2);
          res.redirect('/instructor/quizzes');
        }
      );
    }
  );
});

// ✨ Supprimer un quiz
router.post('/instructor/quizzes/:quizId/delete', requireAuth, ensureInstructor, function(req, res, next) {
  const quizId = req.params.quizId;
  
  db.query(
    'SELECT * FROM quizzes WHERE id = ? AND instructor_id = ?',
    [quizId, req.user.id],
    function(err, results) {
      if (err) return next(err);
      if (results.length === 0) {
        return res.status(404).send('Quiz not found');
      }
      
      db.query(
        'DELETE FROM quizzes WHERE id = ?',
        [quizId],
        function(err2) {
          if (err2) return next(err2);
          res.redirect('/instructor/quizzes');
        }
      );
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
    const { question_text, option_a, option_b, option_c, option_d, correct_option, points } = req.body;

    if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_option) {
      return res.redirect(`/instructor/quizzes/${quizId}/questions`);
    }

    const pointsValue = points && !isNaN(points) ? parseInt(points) : 1;

    db.query(
      `INSERT INTO questions
        (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, points)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [quizId, question_text, option_a, option_b, option_c, option_d, correct_option, pointsValue],
      function (err, result) {
        if (err) return next(err);
        res.redirect(`/instructor/quizzes/${quizId}/questions`);
      }
    );
  }
);

// Liste des quizzes disponibles pour les étudiants (SEULEMENT PUBLIÉS)
router.get('/student/quizzes', requireAuth, function (req, res, next) {
  const sql = `
    SELECT q.id, q.title, q.description, q.time_limit, q.created_at,
           u.name AS instructor_name,
           COUNT(questions.id) as question_count
    FROM quizzes q
    JOIN users u ON q.instructor_id = u.id
    LEFT JOIN questions ON q.id = questions.quiz_id
    WHERE q.is_published = TRUE
    GROUP BY q.id
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
// Page pour faire un quiz (côté étudiant) - Vue.js version
router.get('/student/quizzes/:quizId/take', requireAuth, function (req, res, next) {
  const quizId = req.params.quizId;

  // Vérifier que le quiz existe et est publié
  db.query(
    'SELECT id FROM quizzes WHERE id = ? AND is_published = TRUE',
    [quizId],
    function (err, results) {
      if (err) return next(err);
      if (results.length === 0) {
        return res.status(404).send('Quiz not found or not published');
      }

      // Rendre la vue Vue.js avec juste l'ID du quiz
      res.render('take-quiz-vue', {
        user: req.user,
        quizId: quizId
      });
    }
  );
});


// Soumission des réponses d'un quiz avec enregistrement détaillé
router.post('/student/quizzes/:quizId/submit', requireAuth, function (req, res, next) {
  const quizId = req.params.quizId;
  const timeTaken = req.body.time_taken ? parseInt(req.body.time_taken) : null;

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
        'SELECT id, question_text, correct_option, points FROM questions WHERE quiz_id = ? ORDER BY id ASC',
        [quizId],
        function (err2, questionRows) {
          if (err2) return next(err2);

          const total = questionRows.length;
          let correct = 0;
          let totalPoints = 0;
          let maxPoints = 0;
          const details = [];

          questionRows.forEach(q => {
            const fieldName = `q-${q.id}`;
            const studentAnswer = req.body[fieldName];   // "A","B","C","D" ou undefined
            const pointsForQuestion = q.points || 1;
            maxPoints += pointsForQuestion;

            const isCorrect = studentAnswer === q.correct_option;
            if (isCorrect) {
              correct++;
              totalPoints += pointsForQuestion;
            }

            details.push({
              question_id: q.id,
              question_text: q.question_text,
              correct_option: q.correct_option,
              student_answer: studentAnswer || null,
              isCorrect,
              points_earned: isCorrect ? pointsForQuestion : 0
            });
          });

          const score = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

          // Enregistrer la tentative dans attempts
          db.query(
            'INSERT INTO attempts (user_id, quiz_id, score, total_points, max_points, time_taken) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, quizId, score, totalPoints, maxPoints, timeTaken],
            function(err3, attemptResult) {
              if (err3) return next(err3);

              const attemptId = attemptResult.insertId;

              // Enregistrer les détails de chaque réponse dans attempt_details
              const detailInserts = details.map(d => {
                return new Promise((resolve, reject) => {
                  db.query(
                    'INSERT INTO attempt_details (attempt_id, question_id, student_answer, is_correct, points_earned) VALUES (?, ?, ?, ?, ?)',
                    [attemptId, d.question_id, d.student_answer, d.isCorrect, d.points_earned],
                    (err4) => {
                      if (err4) reject(err4);
                      else resolve();
                    }
                  );
                });
              });

              Promise.all(detailInserts)
                .then(() => {
                  res.render('quiz-result', {
                    user: req.user,
                    quiz,
                    total,
                    correct,
                    score,
                    totalPoints,
                    maxPoints,
                    details: details.map(d => ({
                      question_text: d.question_text,
                      correct_option: d.correct_option,
                      student_answer: d.student_answer || 'No answer',
                      isCorrect: d.isCorrect
                    }))
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

// Page résultats d'un quiz pour l'instructor avec détails des tentatives
router.get('/instructor/quizzes/:quizId/results', requireAuth, ensureInstructor, function(req, res, next) {
  const quizId = req.params.quizId;

  // 1. Vérifier que le quiz appartient bien à cet instructor
  db.query(
    'SELECT * FROM quizzes WHERE id = ? AND instructor_id = ?',
    [quizId, req.user.id],
    function(err, quizRows) {
      if (err) return next(err);

      if (quizRows.length === 0) {
        return res.status(404).send('Quiz not found or not yours.');
      }

      const quiz = quizRows[0];

      // 2. Récupérer les tentatives des étudiants
      const sql = `
        SELECT a.id,
               a.score,
               a.total_points,
               a.max_points,
               a.time_taken,
               a.created_at,
               u.name  AS student_name,
               u.email AS student_email
        FROM attempts a
        JOIN users u ON a.user_id = u.id
        WHERE a.quiz_id = ?
        ORDER BY a.created_at DESC
      `;

      db.query(sql, [quizId], function(err2, attempts) {
        if (err2) return next(err2);

        res.render('instructor-quiz-results', {
          user: req.user,
          quiz: quiz,
          attempts: attempts
        });
      });
    }
  );
});

// Route analytics avec top performers
router.get('/instructor/analytics', requireAuth, ensureInstructor, function(req, res, next) {
  // 1. Stats des quiz
  const sqlQuizzes = `
    SELECT 
      q.id,
      q.title,
      q.is_published,
      COUNT(DISTINCT a.id) as total_attempts,
      AVG(a.score) as average_score,
      COUNT(DISTINCT a.user_id) as unique_students
    FROM quizzes q
    LEFT JOIN attempts a ON q.id = a.quiz_id
    WHERE q.instructor_id = ?
    GROUP BY q.id
    ORDER BY q.created_at DESC
  `;
  
  // 2. Top performers (meilleurs étudiants)
  const sqlTopPerformers = `
    SELECT 
      u.id,
      u.name,
      u.email,
      COUNT(a.id) as total_quizzes,
      AVG(a.score) as average_score,
      MAX(a.score) as best_score,
      SUM(a.total_points) as total_points
    FROM users u
    INNER JOIN attempts a ON u.id = a.user_id
    INNER JOIN quizzes q ON a.quiz_id = q.id
    WHERE q.instructor_id = ? AND u.role = 'student'
    GROUP BY u.id
    ORDER BY average_score DESC, total_points DESC
    LIMIT 10
  `;
  
  db.query(sqlQuizzes, [req.user.id], function(err, quizzes) {
    if (err) return next(err);
    
    db.query(sqlTopPerformers, [req.user.id], function(err2, topPerformers) {
      if (err2) return next(err2);
      
      res.render('instructor-analytics', {
        user: req.user,
        quizzes: quizzes,
        topPerformers: topPerformers
      });
    });
  });
});



// ✨ Détails d'une tentative spécifique (pour voir les réponses question par question)
router.get('/instructor/attempts/:attemptId/details', requireAuth, ensureInstructor, function(req, res, next) {
  const attemptId = req.params.attemptId;

  // Récupérer l'attempt avec les infos du quiz et de l'étudiant
  db.query(
    `SELECT a.*, 
            q.title as quiz_title,
            u.name as student_name,
            u.email as student_email
     FROM attempts a
     JOIN quizzes q ON a.quiz_id = q.id
     JOIN users u ON a.user_id = u.id
     WHERE a.id = ? AND q.instructor_id = ?`,
    [attemptId, req.user.id],
    function(err, attemptRows) {
      if (err) return next(err);
      if (attemptRows.length === 0) {
        return res.status(404).send('Attempt not found');
      }

      const attempt = attemptRows[0];

      // Récupérer les détails des réponses
      db.query(
        `SELECT ad.*,
                q.question_text,
                q.option_a,
                q.option_b,
                q.option_c,
                q.option_d,
                q.correct_option,
                q.points
         FROM attempt_details ad
         JOIN questions q ON ad.question_id = q.id
         WHERE ad.attempt_id = ?
         ORDER BY q.id ASC`,
        [attemptId],
        function(err2, details) {
          if (err2) return next(err2);

          res.render('instructor-attempt-details', {
            user: req.user,
            attempt: attempt,
            details: details
          });
        }
      );
    }
  );
});

// ========================================
// DELETE A QUESTION
// ========================================
router.post('/instructor/quizzes/:quizId/questions/:questionId/delete', 
  requireAuth, 
  ensureInstructor, 
  function(req, res, next) {
    const { quizId, questionId } = req.params;
    
    // Step 1: Check if quiz has any attempts
    db.query(
      'SELECT COUNT(*) as count FROM attempts WHERE quiz_id = ?',
      [quizId],
      function(err, countResults) {
        if (err) return next(err);
        
        const attemptCount = countResults[0].count;
        
        if (attemptCount > 0) {
          // Block deletion if students have already taken the quiz
          return res.status(400).send(
            `Cannot delete question: This quiz has already been attempted by ${attemptCount} student(s). ` +
            'Deleting questions would invalidate existing results.'
          );
        }
        
        // Step 2: Verify quiz belongs to this instructor
        db.query(
          'SELECT * FROM quizzes WHERE id = ? AND instructor_id = ?',
          [quizId, req.user.id],
          function(err2, quizResults) {
            if (err2) return next(err2);
            
            if (quizResults.length === 0) {
              return res.status(403).send('Access denied: Quiz not found or not yours.');
            }
            
            // Step 3: Verify question exists for this quiz
            db.query(
              'SELECT * FROM questions WHERE id = ? AND quiz_id = ?',
              [questionId, quizId],
              function(err3, questionResults) {
                if (err3) return next(err3);
                
                if (questionResults.length === 0) {
                  return res.status(404).send('Question not found.');
                }
                
                // Step 4: All checks passed, delete the question
                db.query(
                  'DELETE FROM questions WHERE id = ?',
                  [questionId],
                  function(err4) {
                    if (err4) return next(err4);
                    
                    // Redirect back to the questions list
                    res.redirect(`/instructor/quizzes/${quizId}/questions`);
                  }
                );
              }
            );
          }
        );
      }
    );
  }
);

// ========================================
// EDIT QUESTION - GET FORM
// ========================================
router.get('/instructor/quizzes/:quizId/questions/:questionId/edit', 
  requireAuth, 
  ensureInstructor, 
  function(req, res, next) {
    const { quizId, questionId } = req.params;
    
    // Step 1: Verify quiz belongs to this instructor
    db.query(
      'SELECT * FROM quizzes WHERE id = ? AND instructor_id = ?',
      [quizId, req.user.id],
      function(err, quizResults) {
        if (err) return next(err);
        
        if (quizResults.length === 0) {
          return res.status(403).send('Access denied: Quiz not found or not yours.');
        }
        
        const quiz = quizResults[0];
        
        // Step 2: Get the question to edit
        db.query(
          'SELECT * FROM questions WHERE id = ? AND quiz_id = ?',
          [questionId, quizId],
          function(err2, questionResults) {
            if (err2) return next(err2);
            
            if (questionResults.length === 0) {
              return res.status(404).send('Question not found.');
            }
            
            const question = questionResults[0];
            
            // Render edit form
            res.render('instructor-edit-question', {
              user: req.user,
              quiz: quiz,
              question: question,
              error: null
            });
          }
        );
      }
    );
  }
);

// ========================================
// EDIT QUESTION - POST UPDATE
// ========================================
router.post('/instructor/quizzes/:quizId/questions/:questionId/edit', 
  requireAuth, 
  ensureInstructor, 
  function(req, res, next) {
    const { quizId, questionId } = req.params;
    const { question_text, option_a, option_b, option_c, option_d, correct_option, points } = req.body;
    
    // Step 1: Validation
    if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_option) {
      // Get quiz and question data to re-render form with error
      db.query(
        'SELECT * FROM quizzes WHERE id = ? AND instructor_id = ?',
        [quizId, req.user.id],
        function(err, quizResults) {
          if (err) return next(err);
          
          db.query(
            'SELECT * FROM questions WHERE id = ?',
            [questionId],
            function(err2, questionResults) {
              if (err2) return next(err2);
              
              return res.render('instructor-edit-question', {
                user: req.user,
                quiz: quizResults[0],
                question: questionResults[0],
                error: 'All fields are required.'
              });
            }
          );
        }
      );
      return;
    }
    
    const pointsValue = points && !isNaN(points) ? parseInt(points) : 1;
    
    // Step 2: Verify quiz belongs to this instructor
    db.query(
      'SELECT * FROM quizzes WHERE id = ? AND instructor_id = ?',
      [quizId, req.user.id],
      function(err, quizResults) {
        if (err) return next(err);
        
        if (quizResults.length === 0) {
          return res.status(403).send('Access denied: Quiz not found or not yours.');
        }
        
        // Step 3: Update the question
        db.query(
          `UPDATE questions 
           SET question_text = ?, 
               option_a = ?, 
               option_b = ?, 
               option_c = ?, 
               option_d = ?, 
               correct_option = ?, 
               points = ?
           WHERE id = ? AND quiz_id = ?`,
          [question_text, option_a, option_b, option_c, option_d, correct_option, pointsValue, questionId, quizId],
          function(err2) {
            if (err2) return next(err2);
            
            // Success! Redirect to questions page
            res.redirect(`/instructor/quizzes/${quizId}/questions`);
          }
        );
      }
    );
  }
);



module.exports = router;
