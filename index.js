const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const path = require('path');

// const db = require('./jeddit-fake-db-pass');
const db = require('./jeddit-fake-db-exemp');
const subsRouter = require('./routes/subsRouter.js');
const articlesRouter = require('./routes/articlesRouter.js');
const commentsRouter = require('./routes/commentsRouter.js');
const usersRouter = require('./routes/usersRouter.js');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}));

app.set('view engine', 'ejs');


// I personally made two custom middlewares here.  You might want to, if it helps you.

app.use('/subs', subsRouter);
app.use('/articles', articlesRouter);
app.use('/comments', commentsRouter);
app.use('/users', usersRouter);


app.get('/', (req, res) => {
  res.redirect('/subs/list');
});

app.get('/debugpage', (req, res) => {
  const user = req.session.user;
  res.render('debugpage', { user });
});

app.get('/debug_db', (req, res) => {
  db.debug.log_debug();
  res.send("check the server console.   <a href='/'>To Home</a>");
});

app.post('/reset_db', (req, res) => {
  db.debug.reset_and_seed();
  db.debug.log_debug();
  res.send("database reset; check the server console.   <a href='/'>To Home</a>");
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
