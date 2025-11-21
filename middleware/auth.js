var jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const token = req.cookies.token;

  // Pas de token → pas connecté
  if (!token) {
    return res.redirect('/login');
  }

  try {
    // Vérifier le token (signature + expiration)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // On garde les infos du user pour la suite
    req.user = decoded;           // ex : { id: 1, name: 'Test', role: 'student', iat:..., exp:... }
    next();                       // continuer vers la route protégée
  } catch (err) {
    // Token invalide ou expiré → on nettoie le cookie et on renvoie au login
    res.clearCookie('token');
    return res.redirect('/login');
  }
}

module.exports = requireAuth;
