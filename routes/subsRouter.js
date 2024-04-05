const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const path = require('path');

// const db = require('../jeddit-fake-db-pass');
const db = require('../jeddit-fake-db-exemp');
const sorting = require('../sorting');
const { requireLogin, requireSubsOwnership, validateSubsInput } = require('../middleware/validate');

const router = express.Router();


router.get("/list", (req, res) => {
  const lists = db.subs.list();
  const user = req.session.user; 
  res.render('list', { lists, user });
});


router.get('/show/:id', (req, res) => {
  const ordering = req.query.ordering;
  const sorting_cb = sorting.getSortingCallback(ordering);
  let id = req.params.id;
  id = decodeURIComponent(id);
  const articleList = db.articles.get_byFilter(article => article.sub_name === id, { withVotes: true, order_by: sorting_cb });
  const user = req.session.user;

  const articleVoteList = articleList.map(article => 
    db.articles.get_byId(article.id, { withCreator: true, withVotes: true })
  );

  let userArticleVoteList = [];
  if (user === null || user === undefined) {
    res.render('show', { id, articleList, user, articleVoteList });
  } else {
    articleList.forEach(article => {
      let userArticleVote = db.articles.get_vote({ article: article.id, voter: user.id });
      userArticleVoteList.push(userArticleVote);
    });
    res.render('show', { id, articleList, user, userArticleVoteList, articleVoteList });
  }
});


router.get('/create', requireLogin, (req, res) => {
  const user = req.session.user;
  res.render('createSub', { user });
});


router.post('/create', requireLogin, validateSubsInput, (req, res) => {
  const title = req.body.content;
  const user = req.session.user;
  const newSub = db.subs.create({ name: title, creator: user.id });
  res.redirect(`/subs/show/${newSub.name}`);
});


module.exports = router;