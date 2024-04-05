const bcrypt = require('bcrypt');
const fs = require('fs');




// Do not export the entire "DB", nor the "database tables".
// You can't export database tables when you're using a real database.
// I'm trying to teach you patterns that will work in a real database.
// Yes, it's kind of a pain, but not too bad.

const DB_FILE_NAME = "./database/database_data.json"
const DB = {}
const whitelist_of_tables = ['subs', 'articles', 'comments', 'users'];


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
  get_byName: function (name) {
    let ans = DB.subs[name];
    if (ans === undefined) {
      return undefined;
    }
    ans = { ...ans }
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
    _save_to_json()
    return DB.subs[name]
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
      console.log({ sub_name, sub_object })
      throw Error("invalid subjeddit")
    }

    return { sub_name, sub_object }
  },
}





// Functions for articles

const articles = {
  get_byId: function (id, { withComments = false, withCreator = false } = {}) {
    let ans = DB.articles[id];
    if (ans === undefined) {
      return undefined;
    }
    ans = { ...ans }

    if (withComments) {
      ans.comments = comments.get_byFilter(
        comment => comment.article_id === id,
        { withCreator: true }
      );
    }
    if (withCreator) {
      ans.creator = users.get_byId(ans.creator_id)
    }

    return ans
  },
  get_byFilter: function (filter_cb,) {
    let ans = Object.values(DB.articles).filter(filter_cb).map(article => ({ ...article }));

    return ans
  },
  create: function ({ sub, title, creator, link, text, }) {

    if (!sub || !title || !creator || !link) {
      console.error({ sub, title, creator, link, text, })
      throw Error("missing parameters for new article")
    }

    let { user_id: creator_id, user_object } = users.__validate_reference(creator);

    let { sub_name, sub_object } = subs.__validate_reference(sub);


    let pk = _new_pk(DB.articles);
    DB.articles[pk] = {
      id: pk,
      sub_name,
      title,
      creator_id,
      link,
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
      throw Error("invalid article id")
    }

    return { article_id, article_object }
  },

}





// Functions for comments

const comments = {
  get_byId: function (id, { withCreator = false, reserved_for_later = false } = {}) {
    let ans = DB.comments[id];
    if (ans === undefined) {
      return undefined;
    }
    ans = { ...ans }

    if (withCreator) {
      ans.creator = users.get_byId(ans.creator_id)
    }

    return ans;
  },
  get_byFilter: function (filter_cb, { withCreator = false, reserved_for_later = false } = {}) {
    let ids = Object.values(DB.comments).filter(filter_cb).map(comment => comment.id);

    let ans = ids.map(id => comments.get_byId(id, { withCreator, reserved_for_later }))

    ans.sort((a, b) => (a.ts - b.ts));

    return ans
  },

  create: function ({ creator, text, article, ts = undefined }) {

    if (!creator || !text || !article) {
      throw Error("missing parameters for new comment")
    }
    ts = ts || Date.now()


    let { user_id: creator_id, user_object } = users.__validate_reference(creator);

    let { article_id, article_object } = articles.__validate_reference(article);



    let pk = _new_pk(DB.comments);
    DB.comments[pk] = {
      id: pk,
      article_id,
      creator_id,
      ts,
      text,
      parent: undefined,
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
  delete: function (id) {
    let comment = DB.comments[id];
    if (!comment) {
      throw Error("invalid comment id")
    }
    delete DB.comments[id]
    _save_to_json()
  },
}




// Functions for users

const users = {
  get_byId: function (id, { with_articles = false, with_comments = false } = {}) {
    let ans = (DB.users[id]);
    if (ans === undefined) {
      return undefined;
    }
    ans = { ...ans }

    if (with_articles) {
      ans.articles = articles.get_byFilter(article => article.creator_id === id);
    }
    if (with_comments) {
      ans.comments = comments.get_byFilter(comment => comment.creator_id === id);
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
    let art2 = articles.create({ sub: dogpics.name, creator: user_a.id, link: 'https://i.redd.it/akpraooq3nw91.jpg', title: 'Hallo Fren', text: 'Underrated, overcrazy' })
    let art3 = articles.create({ sub: catpics, creator: catadmin, link: 'https://i.redd.it/wsuyo83dy4ic1.jpeg', title: 'Prelude to a homicide' })
    let art4 = articles.create({ sub: catpics, creator: user_a, link: 'https://preview.redd.it/aik7h7zqp1ic1.jpg?width=3024&format=pjpg&auto=webp&s=13f532faf8c8e626b2e76938be6cb4eabb58e352', title: 'filing system for cats' })

    let now_ts = Date.now();
    comments.create({ article: art1, creator: catadmin, text: 'cats rule dogs droo', })
    comments.create({ article: art1, creator: catadmin, text: 'cats rule dogs', ts: now_ts + 50000 })
    comments.create({ article: art1, creator: catadmin, text: 'type is hard', ts: now_ts + 111000 })
    comments.create({ article: art1, creator: catadmin, text: 'TYPING is hard', ts: now_ts + 250000 })
    comments.create({ article: art1, creator: catadmin, text: 'cats rule dogs drool', ts: now_ts + 420000 })
    comments.create({ article: art1, creator: catadmin, text: 'ha lol got em', ts: now_ts + 460000 })

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