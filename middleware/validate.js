const db = require('../jeddit-fake-db-exemp');


const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    res.status(401).send('Unauthorized');
  } else {
    next();
  }
};


const requireArticleOwnership = (req, res, next) => {
  const user = req.session.user;
  const articleId = req.params.id; 
  const article = db.articles.get_byId(articleId);
  if (!article || article.creator_id !== user.id) {
    return res.status(403).send('Unauthorized');
  }
  req.article = article; 
  next();
};


const requireCommentOwnership = (req, res, next) => {
  const user = req.session.user;
  const commentId = req.params.id; 
  const comment = db.comments.get_byId(commentId);
  if (!comment || comment.creator_id !== user.id) {
    return res.status(403).send('Unauthorized');
  }
  req.comment = comment; 
  next();
};


const requireSubsOwnership = (req, res, next) => {
  const user = req.session.user;
  const subsId = req.params.id; 
  const subs = db.subs.get_byId(subsId);
  if (!subs || subs.creator_id !== user.id) {
    return res.status(403).send('Unauthorized');
  }
  req.subs = subs; 
  next();
};


const containsXSS = (input) => {
  const scriptRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  return scriptRegex.test(input);
};


const validateArticleInput = (req, res, next) => {
  const { sub, title, link, text } = req.body;
  if (!sub || !title || !link || !text) {
      return res.status(400).send('Bad Request: Missing required fields');
  }
  if (containsXSS(title) || containsXSS(text)) {
      return res.status(400).send('Bad Request: Input contains potential XSS attack');
  }
  next();
};


const validateCommentInput = (req, res, next) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).send('Bad Request: Missing required fields');
  }
  if (containsXSS(text)) {
    return res.status(400).send('Bad Request: Input contains potential XSS attack');
  }
  next();
};


const validateSubsInput = (req, res, next) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).send('Bad Request: Missing required fields');
  }
  if (containsXSS(content)) {
    return res.status(400).send('Bad Request: Input contains potential XSS attack');
  }
  next();
};



module.exports = {
  requireLogin,
  requireArticleOwnership,
  requireCommentOwnership,
  requireSubsOwnership,
  validateArticleInput,
  validateCommentInput,
  validateSubsInput
}
