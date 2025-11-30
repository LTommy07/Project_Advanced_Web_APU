// middleware/roleCheck.js
// Middleware réutilisable pour vérifier les rôles des utilisateurs

/**
 * Crée un middleware qui vérifie le rôle d'un utilisateur
 * @param {string} role - Le rôle requis ('student', 'instructor')
 * @returns {Function} Middleware Express
 */
function ensureRole(role) {
  return function(req, res, next) {
    if (!req.user || req.user.role !== role) {
      return res.status(403).send(`Access denied. ${role.charAt(0).toUpperCase() + role.slice(1)}s only.`);
    }
    next();
  };
}

// Exports des middlewares spécifiques
module.exports = {
  ensureInstructor: ensureRole('instructor'),
  ensureStudent: ensureRole('student'),
  ensureRole // Export aussi la fonction générique si besoin
};
