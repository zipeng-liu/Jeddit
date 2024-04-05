const bcrypt = require('bcrypt');
const fs = require('fs');




// Do not export the entire "DB", nor the "database tables".
// You can't export database tables when you're using a real database.
// I'm trying to teach you patterns that will work in a real database.
// Yes, it's kind of a pain, but not too bad.

const DB_FILE_NAME = "./database/database_data.json"
const DB = {}
const whitelist_of_tables = ['subs', 'articles', 'comments', 'users', 'articles_votes', 'comments_votes', 'mods'];

const __PARAMETER_NOT_SET = Symbol("parameter not set");






// Helper functions, these should not be exported

function _new_pk(table) {
  let ans;
  while (ans === undefined || table[ans] !== undefined) {
    ans = Math.random().toString().slice(2, 6);
  }
  return ans;
}

function _load_from_json() {
  console.log("LOADING DATABASE FROM JSON");
  for (let k in DB) {
    delete DB[k];
  }

  let data = {};
  for (let k of whitelist_of_tables) {
    data[k] = {};
  }
  try {
    data = fs.readFileSync(DB_FILE_NAME, { encoding: 'utf8' });
    data = JSON.parse(data);
  } catch (e) {
    console.log("not really worried, but while trying to load, this did happen:   ", e.message)
  }

  for (let k of whitelist_of_tables) {
    DB[k] = data[k];
  }
}

async function _save_to_json() {

  try {
    fs.renameSync(DB_FILE_NAME, DB_FILE_NAME + '.bak');
  } catch (e) {
    console.log("it's fine, but we failed to rename to backup", e.message)
  }

  // The next line, if it errors, will crash the app.  This is on purpose.
  fs.writeFileSync(DB_FILE_NAME, debug.str_debug(), { encoding: 'utf8' });
}






// Functions for subs

const subs = {
  list: function () {
    return Object.values(DB.subs)
  },
  get_byName: function (name, { withMods = false } = {}) {
    let ans = DB.subs[name];
    if (ans === undefined) {
      return undefined;
    }
    ans = { ...ans }

    if (withMods) {
      ans.mods = { ...DB.mods[ans.name] }
    }

    return ans
  },
  create: function ({ name, creator }) {
    if (!name || !creator) {
      throw Error("missing parameters for new sub")
    }

    if (DB.subs[name] !== undefined) {
      throw Error("name already exists");
    }

    let creator_id;
    if (creator && typeof creator === 'object' && creator.id) {
      // if we got a user object, convert to userid so that next line works
      creator_id = creator.id;
    } else {
      creator_id = creator;
    }

    let creator_object = users.get_byId(creator_id)
    if (creator_object === undefined) {
      throw Error("invalid user id")
    }

    DB.subs[name] = {
      name,
      creator_id,
    }

    subs.add_mod({ sub: name, user: creator_id });

    _save_to_json()
    return DB.subs[name]
  },
  add_mod: function ({ sub, user }) {
    let { sub_name, sub_object } = subs.__validate_reference(sub);
    let { user_id, user_object } = users.__validate_reference(user);

    if (DB.mods[sub_name] === undefined) {
      DB.mods[sub_name] = {}
    }
    DB.mods[sub_name][user_id] = true;
    _save_to_json()
  },
  remove_mod: function ({ sub, user }) {
    let { sub_name, sub_object } = subs.__validate_reference(sub);
    let { user_id, user_object } = users.__validate_reference(user);

    if (DB.mods[sub_name] !== undefined) {
      delete DB.mods[sub_name][user_id]
    }
    _save_to_json()
  },
  __validate_reference: function (sub_name_or_object) {
    let sub_name;
    if (sub_name_or_object && typeof sub_name_or_object === 'object' && sub_name_or_object.name) {
      // if we got a sub object, convert to sub so that next line works
      sub_name = sub_name_or_object.name;
    } else {
      sub_name = sub_name_or_object;
    }
    let sub_object = subs.get_byName(sub_name)
    if (sub_object === undefined) {
      throw Error("invalid subjeddit")
    }

    return { sub_name, sub_object }
  },
}





// Functions for articles

const articles = {
  get_byId: function (id, { withComments = false, withCreator = false, withVotes = false, withCurrentVote = undefined, withNestedComments = false, order_by } = {}) {
    let ans = DB.articles[id];
    if (ans === undefined) {
      return undefined;
    }
    ans = { ...ans }

    if (withComments) {
      ans.comments = comments.get_byFilter(
        comment => comment.article_id === id && !(withNestedComments && comment.parent),
        { withCreator: true, withVotes, withCurrentVote, withNestedComments, order_by }
      );
    }
    if (withCreator) {
      ans.creator = users.get_byId(ans.creator_id)
    }
    if (withVotes) {
      let votes = Object.values(DB.articles_votes).filter(v => v.article_id === id);
      let upvotes = 0;
      let downvotes = 0;
      for (let v of votes) {
        if (v.vote_value > 0) { upvotes++; }
        if (v.vote_value < 0) { downvotes++; }
      }
      ans.upvotes = upvotes;
      ans.downvotes = downvotes;
    }
    if (withCurrentVote !== undefined) {
      ans.current_vote = articles.get_vote({ article: ans, voter: withCurrentVote })
    }

    return ans
  },
  get_byFilter: function (filter_cb, options = {}) {
    let ans = Object.values(DB.articles).filter(filter_cb).map(article => articles.get_byId(article.id, options));

    let sorting_cb = options.order_by ? options.order_by : (a, b) => (a.ts - b.ts);
    ans.sort(sorting_cb);

    return ans
  },
  create: function ({ sub, title, creator, link, text, ts }) {

    if (!sub || !title || !creator || !link) {
      console.error({ sub, title, creator, link, text, })
      throw Error("missing parameters for new article")
    }
    ts = ts || Date.now()

    let { user_id: creator_id, user_object } = users.__validate_reference(creator);
    let { sub_name, sub_object } = subs.__validate_reference(sub);

    let pk = _new_pk(DB.articles);
    DB.articles[pk] = {
      id: pk,
      sub_name,
      title,
      creator_id,
      link,
      ts,
      text,
    }
    _save_to_json()
    return DB.articles[pk]

  },
  update: function ({ id, title, link, text = __PARAMETER_NOT_SET, }) {
    if (!id || !title || !link) {
      console.error({ id, title, link, text, })
      throw Error("missing parameters to update article")
    }

    let article = DB.articles[id];
    if (!article) {
      throw Error("invalid article id")
    }

    article.title = title;
    article.link = link;
    if (text !== __PARAMETER_NOT_SET) {
      article.text = text;
    }

    _save_to_json()
    return DB.articles[id]

  },
  delete: function (id) {
    let article = DB.articles[id];
    if (!article) {
      throw Error("invalid article id")
    }
    delete DB.articles[id]
    _save_to_json()
  },
  set_vote: function ({ article, voter, vote_value }) {
    let { user_id: voter_id, user_object: voter_object } = users.__validate_reference(voter);
    let { article_id, article_object } = articles.__validate_reference(article);
    let key = voter_id + ';' + article_id;

    DB.articles_votes[key] = {
      article_id,
      voter_id,
      vote_value: Number(vote_value)
    }
    _save_to_json()

  },
  remove_vote: function ({ article, voter }) {
    let { user_id: voter_id, user_object: voter_object } = users.__validate_reference(voter);
    let { article_id, article_object } = articles.__validate_reference(article);
    let key = voter_id + ';' + article_id;

    delete DB.articles_votes[key];
    _save_to_json()

  },
  get_vote: function ({ article, voter }) {
    let { user_id: voter_id, user_object: voter_object } = users.__validate_reference(voter);
    let { article_id, article_object } = articles.__validate_reference(article);
    let key = voter_id + ';' + article_id;

    return DB.articles_votes[key];
  },
  __validate_reference: function (article_id_or_object) {
    let article_id;
    if (article_id_or_object && typeof article_id_or_object === 'object' && article_id_or_object.id) {
      // if we got a article object, convert to articleid so that next line works
      article_id = article_id_or_object.id;
    } else {
      article_id = article_id_or_object;
    }

    let article_object = articles.get_byId(article_id)
    if (article_object === undefined) {
      throw Error("invalid article id: " + article_id)
    }

    return { article_id, article_object }
  },

}





// Functions for comments

const comments = {
  get_byId: function (id, options = {}) {
    let { withCreator = false, withVotes = false, withCurrentVote = undefined, withNestedComments = false } = options;
    let ans = DB.comments[id];
    if (ans === undefined) {
      return undefined;
    }
    ans = { ...ans }

    if (withCreator) {
      ans.creator = users.get_byId(ans.creator_id)
    }
    if (withVotes) {
      let votes = Object.values(DB.comments_votes).filter(v => v.comment_id === id);
      let upvotes = 0;
      let downvotes = 0;
      for (let v of votes) {
        if (v.vote_value > 0) { upvotes++; }
        if (v.vote_value < 0) { downvotes++; }
      }
      ans.upvotes = upvotes;
      ans.downvotes = downvotes;
    }
    if (withCurrentVote !== undefined) {
      ans.current_vote = comments.get_vote({ comment: ans, voter: withCurrentVote })
    }
    if (withNestedComments) {
      ans.children = ans.children.map(child_id => comments.get_byId(child_id, options))
    } else {
      ans.children = []
    }


    return ans;
  },
  get_byFilter: function (filter_cb, options = {}) {
    let ans = Object.values(DB.comments).filter(filter_cb).map(comment => comments.get_byId(comment.id, options));

    let sorting_cb = options.order_by ? options.order_by : (a, b) => (a.ts - b.ts);
    ans.sort(sorting_cb);

    return ans
  },
  create: function ({ creator, text, article, ts = undefined, parent = undefined }) {

    if (!creator || !text || !article) {
      throw Error("missing parameters for new comment")
    }
    ts = ts || Date.now()

    let { user_id: creator_id, user_object } = users.__validate_reference(creator);
    let { article_id, article_object } = articles.__validate_reference(article);

    if (parent) {
      let { comment_id, comment_object } = comments.__validate_reference(parent);
      parent = comment_id;
    }

    let pk = _new_pk(DB.comments);
    DB.comments[pk] = {
      id: pk,
      article_id,
      creator_id,
      ts,
      text,
      parent,
      children: [],
    }
    if (parent) {
      DB.comments[parent].children.push(pk);
    }

    _save_to_json()
    return DB.comments[pk]
  },
  update: function ({ id, text }) {
    if (!id || !text) {
      console.error({ id, text, })
      throw Error("missing parameters to update comment")
    }

    let comment = DB.comments[id];
    if (!comment) {
      throw Error("invalid comment id")
    }

    comment.text = text;

    _save_to_json()
    return DB.comments[id]

  },
  set_vote: function ({ comment, voter, vote_value }) {
    let { user_id: voter_id, user_object: voter_object } = users.__validate_reference(voter);
    let { comment_id, comment_object } = comments.__validate_reference(comment);
    let key = voter_id + ';' + comment_id;

    DB.comments_votes[key] = {
      comment_id,
      voter_id,
      vote_value: Number(vote_value)
    }
    _save_to_json()

  },
  remove_vote: function ({ comment, voter }) {
    let { user_id: voter_id, user_object: voter_object } = users.__validate_reference(voter);
    let { comment_id, comment_object } = comments.__validate_reference(comment);
    let key = voter_id + ';' + comment_id;

    delete DB.comments_votes[key];
    _save_to_json()

  },
  get_vote: function ({ comment, voter }) {
    let { user_id: voter_id, user_object: voter_object } = users.__validate_reference(voter);
    let { comment_id, comment_object } = comments.__validate_reference(comment);
    let key = voter_id + ';' + comment_id;

    return DB.comments_votes[key];
  },
  delete: function (id) {
    let comment = DB.comments[id];
    if (!comment) {
      throw Error("invalid comment id")
    }
    if (comment.children?.length > 0) {
      comment.creator_id = undefined;
      comment.text = undefined;
    } else {
      if (comment.parent) {
        DB.comments[comment.parent].children = DB.comments[comment.parent].children.filter(cid => cid != id)
      }
      delete DB.comments[id]
    }
    _save_to_json()
  },
  __validate_reference: function (comment_id_or_object) {
    let comment_id;
    if (comment_id_or_object && typeof comment_id_or_object === 'object' && comment_id_or_object.id) {
      // if we got a comment object, convert to commentid so that next line works
      comment_id = comment_id_or_object.id;
    } else {
      comment_id = comment_id_or_object;
    }

    let comment_object = comments.get_byId(comment_id)
    if (comment_object === undefined) {
      throw Error("invalid comment id: " + comment_id)
    }

    return { comment_id, comment_object }
  },

}




// Functions for users

const users = {
  get_byId: function (id, { withArticles = false, withComments = false, withVotes = false, withCurrentVote = undefined, order_by = undefined } = {}) {
    let ans = (DB.users[id]);
    if (ans === undefined) {
      return undefined;
    }
    ans = { ...ans }

    if (withArticles) {
      ans.articles = articles.get_byFilter(article => article.creator_id === id, { withCreator: true, withVotes, withCurrentVote, order_by });
    }
    if (withComments) {
      ans.comments = comments.get_byFilter(comment => comment.creator_id === id, { withCreator: true, withVotes, withCurrentVote, order_by });
    }

    return ans;
  },
  get_byUsername: function (username, extra_arguments = {}) {
    let user = Object.values(DB.users).find(user => user.username === username);
    if (user === undefined) {
      return undefined;
    } else {
      // punting to get_byId so that extra arguments are processed consistently
      return users.get_byId(user.id, extra_arguments);
    }
  },
  create: function ({ username, password_hash }) {
    if (!username || !password_hash) {
      throw Error("missing parameters for new user")
    }
    if (users.get_byUsername(username) !== undefined) {
      throw Error("username already exists")
    }

    let pk = _new_pk(DB.users);
    DB.users[pk] = {
      id: pk,
      username,
      password_hash,
    }
    _save_to_json()
    return DB.users[pk]
  },
  __validate_reference: function (user_id_or_object) {
    let user_id;
    if (user_id_or_object && typeof user_id_or_object === 'object' && user_id_or_object.id) {
      // if we got a user object, convert to userid so that next line works
      user_id = user_id_or_object.id;
    } else {
      user_id = user_id_or_object;
    }

    let user_object = users.get_byId(user_id)
    // console.log({ user_object })
    if (user_object === undefined) {
      throw Error("invalid user id")
    }

    return { user_id, user_object }
  },

}



// Functions for debugging

const debug = {
  str_debug: function () {
    return JSON.stringify(DB, null, 2);
  },
  log_debug: function () {
    console.log("PRINTOUT OF DATABASE");
    for (let table_name in DB) {
      console.log("\n##", table_name, "##");
      console.log(JSON.stringify(DB[table_name], null, 2))
    }
  },
  reset_and_seed: function () {

    console.log("RESETTING AND RESEEDING DATABASE");

    for (let k in DB) {
      delete DB[k];
    }

    for (let k of whitelist_of_tables) {
      DB[k] = {};
    }

    let dogadmin = users.create({ username: 'dog', password_hash: bcrypt.hashSync('woof', 12) })
    let catadmin = users.create({ username: 'cat', password_hash: bcrypt.hashSync('meow', 12) })
    let user_a = users.create({ username: 'a', password_hash: bcrypt.hashSync('a', 12) })

    let dogpics = subs.create({ name: 'dogpics', creator: dogadmin.id })
    let catpics = subs.create({ name: 'catpics', creator: catadmin })

    let art1 = articles.create({ sub: dogpics, creator: dogadmin, link: 'https://i.redd.it/ts1jpcw2gvr01.jpg', title: 'goldie', text: 'I stole this picture from reddit' })
    articles.set_vote({ article: art1, voter: dogadmin, vote_value: +1 })
    let art2 = articles.create({ sub: dogpics.name, creator: user_a.id, link: 'https://i.redd.it/akpraooq3nw91.jpg', title: 'Hallo Fren', text: 'Underrated, overcrazy' })
    articles.set_vote({ article: art2, voter: user_a, vote_value: +1 })
    let art3 = articles.create({ sub: catpics, creator: catadmin, link: 'https://i.redd.it/wsuyo83dy4ic1.jpeg', title: 'Prelude to a homicide' })
    articles.set_vote({ article: art3, voter: catadmin, vote_value: +1 })
    let art4 = articles.create({ sub: catpics, creator: user_a, link: 'https://preview.redd.it/aik7h7zqp1ic1.jpg?width=3024&format=pjpg&auto=webp&s=13f532faf8c8e626b2e76938be6cb4eabb58e352', title: 'filing system for cats' })
    articles.set_vote({ article: art4, voter: user_a, vote_value: +1 })

    // cat opinion
    let ts = Date.now();
    let stupid_cat_comments = [
      "ha lol got em", "cat's rule dog's drool", "TYPING is hard", "type is hard", "cat's rule dog'", "cat"
    ]
    let completed_comments = [];
    for (let scc of stupid_cat_comments) {
      ts -= Math.round(Math.random() * 10000);
      let comment = comments.create({ article: art1, creator: catadmin, text: scc, ts })
      completed_comments.push(comment)
      comments.set_vote({ comment, voter: catadmin, vote_value: +1 })
      // comments.set_vote({ comment, voter: dogadmin, vote_value: -1 })
    }

    // dog opinions
    let dc1 = comments.create({ article: art1, creator: dogadmin, text: "hay cat r u ok?", ts: completed_comments[3].ts + 100, parent: completed_comments[3] })
    comments.set_vote({ comment: dc1, voter: dogadmin, vote_value: +1 })
    let dc2 = comments.create({ article: art1, creator: dogadmin, text: "awesome!  what did u get?", ts: completed_comments[0].ts + 1000, parent: completed_comments[0] })
    comments.set_vote({ comment: completed_comments[1], voter: dogadmin, vote_value: -1 })
    comments.set_vote({ comment: dc2, voter: dogadmin, vote_value: +1 })

    // further cat opinions
    let ccx = comments.create({ article: art1, creator: catadmin, text: "omg u dummy", ts: completed_comments[0].ts + 1000, parent: dc2 })
    comments.set_vote({ comment: ccx, voter: catadmin, vote_value: +1 })
    comments.set_vote({ comment: ccx, voter: user_a, vote_value: +1 })


    _save_to_json();

  }
}






_load_from_json();
debug.reset_and_seed();


module.exports = {
  subs,
  articles,
  comments,
  users,
  debug,
}