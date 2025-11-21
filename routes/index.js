var express = require('express');
var router = express.Router();
var requireAuth = require('../middleware/auth');
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/dashboard', requireAuth, function(req, res, next) {
  // req.user vient du middleware requireAuth
  res.render('dashboard', { user: req.user });
});

module.exports = router;
