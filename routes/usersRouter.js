const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const path = require('path');
const bcrypt = require('bcrypt');


// const db = require('../jeddit-fake-db-pass');
const db = require('../jeddit-fake-db-exemp');
const sorting = require('../sorting');
const router = express.Router();


router.get('/login', (req, res) => {
  res.render('login');
});


router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = db.users.get_byUsername(username);
    if (!user) {
      return res.status(401).send('Invalid username');
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).send('Invalid password');
    }
    req.session.user = user;
    res.redirect('/');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/profile/:id', (req, res) => {
  const ordering = req.query.ordering;
  const sorting_cb = sorting.getSortingCallback(ordering);
  const id = req.params.id;
  const userProfile = db.users.get_byId(
    id, { withArticles: true, withComments: true, withVotes: true , order_by: sorting_cb }
  );
  const user = req.session.user;
  res.render('profile', { userProfile, user });
});


router.get('/register', (req, res) => {
  res.render('register');
});


router.post('/register', async (req, res) => {
  const { username, password }  = req.body;
  try {
    let user = db.users.get_byUsername(username);
    if (!user ) {
      const salt = await bcrypt.genSalt(12);
      const password_hash = await bcrypt.hash(password, salt);
      user = db.users.create({ username: username, password_hash: password_hash });
      req.session.user = user;
      res.redirect('/');
    } else {
      res.send('Username already taken')
    }
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Fixed logout issue
router.post('/logout', (req, res) => {
  req.session = null; 
  res.clearCookie('session')
  res.clearCookie('session.sig')
  res.redirect('/');
});

module.exports = router;