var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var db = require('../config/db');
var jwt = require('jsonwebtoken');

/* GET login page */
router.get('/login', function(req, res, next) {
  res.render('login', { error: null, email: '' });
});

/* POST login avec bcrypt + JWT */
router.post('/login', function(req, res, next) {
  const { email, password } = req.body;

  // 1. Vérifier que les champs ne sont pas vides
  if (!email || !password) {
    return res.render('login', {
      error: 'Email and password are required.',
      email
    });
  }

  // 2. Chercher l'utilisateur en base
  db.query('SELECT * FROM users WHERE email = ?', [email], function(err, results) {
    if (err) return next(err);

    if (results.length === 0) {
      // Aucun utilisateur avec cet email
      return res.render('login', {
        error: 'Invalid email or password.',
        email
      });
    }

    const user = results[0];

    // 3. Comparer le mot de passe tapé avec le hash en base
    bcrypt.compare(password, user.password_hash, function(err, match) {
      if (err) return next(err);

      if (!match) {
        // mot de passe incorrect
        return res.render('login', {
          error: 'Invalid email or password.',
          email
        });
      }

      // 4. Tout est bon → créer un JWT
      const token = jwt.sign(
        { id: user.id, name: user.name, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
      );

      // 5. Mettre le token dans un cookie httpOnly
      res.cookie('token', token, { httpOnly: true });

      // 6. Rediriger vers une page protégée
      res.redirect('/dashboard');
    });
  });
});

/* GET register page */
router.get('/register', function(req, res, next) {
  res.render('register', { error: null, name: '', email: '', role: 'student' });
});

/* POST register form (inscription) */
router.post('/register', function(req, res, next) {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.render('register', {
      error: 'All fields are required.',
      name,
      email,
      role
    });
  }

  db.query('SELECT id FROM users WHERE email = ?', [email], function(err, results) {
    if (err) return next(err);

    if (results.length > 0) {
      return res.render('register', {
        error: 'This email is already registered.',
        name,
        email,
        role
      });
    }

    bcrypt.hash(password, 10, function(err, hash) {
      if (err) return next(err);

      db.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [name, email, hash, role],
        function(err, result) {
          if (err) return next(err);
          res.redirect('/login');
        }
      );
    });
  });
});

/* POST logout : supprimer le cookie */
router.post('/logout', function(req, res, next) {
  res.clearCookie('token');
  res.redirect('/login');
});

module.exports = router;
