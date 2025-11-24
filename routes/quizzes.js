// ... (haut du fichier inchangé)

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

// ... (reste du fichier inchangé)
