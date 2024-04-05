const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const path = require('path');

// const db = require('../jeddit-fake-db-pass');
const db = require('../jeddit-fake-db-exemp');
const sorting = require('../sorting');
const { requireLogin, requireArticleOwnership, validateArticleInput } = require('../middleware/validate');

const router = express.Router();


router.get('/show/:id', (req, res) => {
  const ordering = req.query.ordering;
  const sorting_cb = sorting.getSortingCallback(ordering);
  const id = req.params.id;
  const article = db.articles.get_byId(id, { withComments: true, withVotes: true });
  const user = req.session.user;
  const creator = db.users.get_byId(article.creator_id);
  const commentList = db.comments.get_byFilter(
    comment => comment.article_id === article.id, { withVotes: true, withCreator: true, order_by: sorting_cb }
  );
  
  let userCommentVoteList = [];
  if (user === null || user === undefined) {
    res.render('article', { id, article, user, creator, commentList });
  } else {
    const userArticleVote = db.articles.get_vote({ article: article.id, voter: user.id });
    commentList.forEach(comment => {
      let userCommentVote = db.comments.get_vote({ comment: comment.id, voter: user.id });
      userCommentVoteList.push(userCommentVote);
    });
    res.render('article', { id, article, user, creator, userArticleVote, commentList, userCommentVoteList });
  }
});


router.get('/create', requireLogin, (req, res) => {
  const subName = req.query.sub;
  const user = req.session.user;
  res.render('createArticle', { user , subName });
});


router.post('/create', requireLogin, validateArticleInput, (req, res) => {
  const { sub, title, link, text }  = req.body;
  const user = req.session.user;
  const article = db.articles.create({ sub: sub, title: title, creator: user.id, link: link, text: text });
  db.articles.set_vote({ article: article.id, voter: user.id, vote_value: 1 });
  res.redirect(`/articles/show/${article.id}`);
});


router.get('/edit/:id', requireLogin, requireArticleOwnership, (req, res) => {
  const id = req.params.id;
  const article = db.articles.get_byId(id);
  const user = req.session.user;
  res.render('editArticle', { user, article });
});


router.post('/edit/:id', requireLogin, requireArticleOwnership, validateArticleInput, (req, res) => {
  const id = req.params.id;
  const { sub, title, link, text }  = req.body;
  const article = db.articles.update({ id: id, title: title, link: link, text: text });
  res.redirect(`/articles/show/${article.id}`);
});


router.get('/delete/:id', requireLogin, requireArticleOwnership, (req, res) => {
  const id = req.params.id;
  const user = req.session.user;
  res.render('deleteArticle', { user, id });
});


router.post('/delete/:id', requireLogin, requireArticleOwnership, (req, res) => {
  const id = req.params.id;
  const article = db.articles.get_byId(id);
  db.articles.delete(id);
  res.redirect(`/subs/show/${article.sub_name}`);
});


router.post('/vote/:id/:votevalue', requireLogin, (req, res) => {
  const id = req.params.id;
  const votevalue = req.params.votevalue;
  const user = req.session.user;
  if (votevalue === "upvote") {
    db.articles.set_vote({ article: id, voter: user.id, vote_value: 1 });
  } else if (votevalue === "downvote") {
    db.articles.set_vote({ article: id, voter: user.id, vote_value: -1 });
  } else {
    db.articles.remove_vote({ article: id, voter: user.id });
  }
  res.redirect('back');
});


module.exports = router;