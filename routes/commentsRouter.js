const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const path = require('path');

// const db = require('../jeddit-fake-db-pass');
const db = require('../jeddit-fake-db-exemp');
const { requireLogin, requireCommentOwnership, validateCommentInput } = require('../middleware/validate');

const router = express.Router();


router.get('/show/:id', (req, res) => {
  const id = req.params.id;
  const comment = db.comments.get_byId(id, { withCreator: true, withVotes: true });
  const user = req.session.user;

  if (user === null || user === undefined) {
    res.render('comment', { id, comment, user });
  } else {
    const userCommentVote = db.comments.get_vote({ comment: comment.id, voter: user.id });
    res.render('comment', { id, comment, userCommentVote, user });
  }
});


router.post('/create', requireLogin, (req, res) => {
  const user = req.session.user;
  const { articleId, text} = req.body;
  const comment = db.comments.create({ creator: user.id, text: text, article: articleId });
  db.comments.set_vote({ comment: comment.id, voter: user.id, vote_value: 1 });
  res.redirect(`/articles/show/${articleId}`);
});


router.get('/edit/:id', requireLogin, requireCommentOwnership, (req, res) => {
  const user = req.session.user;
  const id = req.params.id;
  const comment = db.comments.get_byId(id);
  res.render('editComment', { user, comment })
});

router.post('/edit/:id', requireLogin, requireCommentOwnership, validateCommentInput, (req, res) => {
  const id = req.params.id;
  const { text } = req.body;
  const comment = db.comments.update({ id: id, text: text });
  res.redirect(`/articles/show/${comment.article_id}`);
});


router.get('/delete/:id', requireLogin, requireCommentOwnership, (req, res) => {
  const user = req.session.user;
  const id = req.params.id;
  res.render('deleteComment', { user, id })
});


router.post('/delete/:id', requireLogin, requireCommentOwnership, (req, res) => {
  const id = req.params.id;
  const comment = db.comments.get_byId(id)
  db.comments.delete(id);
  res.redirect(`/articles/show/${comment.article_id}`);
});


router.post('/vote/:id/:votevalue', requireLogin, (req, res) => {
  const id = req.params.id;
  const votevalue = req.params.votevalue;
  const user = req.session.user;
  if (votevalue === "upvote") {
    db.comments.set_vote({ comment: id, voter: user.id, vote_value: 1 });
  } else if (votevalue === "downvote") {
    db.comments.set_vote({ comment: id, voter: user.id, vote_value: -1 });
  } else {
    db.comments.remove_vote({ comment: id, voter: user.id });
  }
  res.redirect('back');
});


module.exports = router;