[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-24ddc0f5d75046c5622901739e7c5dd533143b0c8e959d652212380cedb1ea36.svg)](https://classroom.github.com/a/6obdcLqg)





## Introduction

In this Assignment, you will make a complete MPA web application with multiple routes and logins, in particular a simple social media aggregator, like Diggg.

You should use Node, Express, and EJS (and HTML).  You may use CSS to make it nice if you like.

This Assignment is worth 25% of your final grade.


## Intellectual Honesty

Please remember that this assignment is **individual work**.  You may use any online resource that already existed a week ago, but you may not ask anyone to look at your code, or show you their code, and you may not show your code to anyone else.

If in doubt about what conduct is fair, ask me.

Also the previous advice about SOURCES.md is still in play.


## Due Date

This Assignment is due on Sunday, March 3rd, at 11:59pm.

## Submission

You presumably got this assignment via GitHub Classroom.  Submit it the same way.

If you are using a different GitHub account than you used in prior assignment, make sure I know about it.




## Concepts

In this project there are multiple types of resources.

There are *articles*, which are basically just links to external resources.  They have a URL, and a title, and maybe also some commentary text.

There are *comments*, on articles, which are basically just some text.

There are *subjeddits*, aka "subs", which organize several articles together under a theme.

There are *users*, because every sub, every article, and every comment, needs to know which user it belongs to.




## PASS tier

This is a straightforward extension of the skills from Jiki.  You're going to make a CRUD app with 3 ~~database tables~~ resource types, plus user login and registration, and using Express.Router to organize the code.

At this level, there is only one type of user, so all users have equivalent permissions.

* as with Jiki, you need to start the project
    * `npm init` and `npm install nodemon express body-parser ejs`
    * probably add a script for nodemon, eh
    * I'll give you a starting `index.js`, but you might want to add things to it, like adding more middlewares if you want, or other ideas
* required routes for main resource types
    * `GET /`
        * this should simply redirect to `GET /subs/list`
    * routes for subjeddits:
        * all these route-handlers should be defined in an Express.Router, in a file with a suitable name like `subsRouter.js`
        * `GET /subs/list`
            * this should simply list all the subs that exist, in any order
            * it needs a link to create a new subjeddit, of course
        * `GET /subs/show/:id`
            * this should show every article within the subjeddit, in any order
            * should have a link to create a new article within the sub, and a link to the homepage
        * `GET /subs/create`
        * `POST /subs/create`
    * routes for articles within a subjeddit:
        * it'd be more thematic if I called these "posts" or "links", but those are both confusing terms, so let's use "articles"
        * all these route-handlers should be defined in an Express.Router, in a file with a suitable name like `articlesRouter.js`
        * you don't need to be able to list articles, because that's what subjeddits are for
        * `GET /articles/show/:id`
        * `GET /articles/create`
            * this is the route to create a new article.  you must link to this route from the `/subs/show/:id` route, and the article must be automatically added to the relevant subjeddit, without the user doing anything
            * you MAY, if you choose, instead put this route at `GET /subs/show/:id/articles/create`
        * `POST /articles/create`
        * `GET /articles/edit/:id`
        * `POST /articles/edit/:id`
        * `GET /articles/delete/:id`
        * `POST /articles/delete/:id`
    * routes for comments, which are attached to a subjeddit:
        * all these route-handlers should be defined in an Express.Router, in a file with a suitable name like `commentsRouter.js`
        * you don't need to be able to list comments, because that's what articles are for
        * also articles are used for the comment-creation form
        * `GET /comments/show/:id`
        * `POST /comments/create`
        * `GET /comments/edit/:id`
        * `POST /comments/edit/:id`
        * `GET /comments/delete/:id`
        * `POST /comments/delete/:id`
* suggested routes to help your development process:
    * I personally find these *really helpful*, I *strongly suggest* you do them for your own benefit
    * `GET /debug_db`
        * this would call `db.debug.log_debug()` and then `res.send("check the console")`
    * `POST /reset_db`
        * this would call `db.debug.reset_and_seed()` and then `res.send("check the console")`
* user logins and registration
    * all relevant route-handlers should be defined in an Express.Router, in a file with a suitable name like `usersRouter.js`
    * `GET /users/login`
    * `POST /users/login`
        * if successful, redirect to `/`
    * `GET /users/register`
    * `POST /users/register`
        * if successful, redirect to `/`
    * `POST /users/logout`
        * if successful, redirect to `/`
    * `GET /users/profile/:id`
    * cookie security
        * cookie security must be good enough that I cannot casually change my user_id with the dev tools
        * in other words, maybe just use `cookie-session`
    * password security
        * all passwords must be hashed in the DB, using `bcrypt`
* authentication and authorization
    * some routes must work whether or not you are logged in
        * all routes for listing and viewing subs, articles, and comments, and user profiles
        * also the root route (`/`), and any debug routes you're using for debugging during dev
    * some routes work only if you are NOT logged in
        * all routes to do with login and registration, including the GETs and POSTs
    * some routes only work if you are logged in, but any user is good enough
        * all routes for creating subs, articles, and comments
        * logout
    * some routes only work if you are logged in, as the correct user
        * routes editing, and deleting, your own articles and comments
    * remember that the bad guy can modify HTML forms in their dev tools, and your app should stay secure
    * remember that the bad guy can modify cookies in their dev tools, and your app should stay secure
* header on every page
    * every page should have a header with a link to `/`, and information about whether the user is logged in or not
    * if they're logged in, add a logout button
    * if they're not logged in, add links to log in and to register
    * optional: I personally also added a link for debugging to my header

    
Remember to think about code presentation.  That's all the concerns from the previous assignment (variable names, indentation, general tidiness), plus also now you need to organize code into multiple files in a way that doesn't cause misery to yourself or others.



## SATIS tier

You need to switch from using `jeddit-fake-db-pass` to using `jeddit-fake-db-exemp`.  This adds a few new tables (some for satis, some for exemp), and new methods, and even new data to an old table because I made an oopsie.

* autotagify images
    * let's make it so that, when an article's link is an image, it made an image tag
        * so in the `GET /articles/show/:id` route, the image would appear right there, rather than having to click through
    * at the SATIS tier, it's good enough to do something mediocre to detect if it's an image
        * for example, you could assume that any link that ends with `.jpg` or `.jpeg` or `.gif` or `.png` is an image
        * if you really want to be crazy, do a `fetch` from the server, examine the `Content-Type` header to see what type the sending server thinks it is
            * this is a fairly high-quality plan, but totally out of scope for what we've covered so far
* voting
    * unlike all features up to this point, this feature *requires CSS* to be implemented (because of colours, explained below)
    * logged-in users should be able to vote on articles and comments, being able to vote UP or DOWN (and also to have no vote, including being able to cancel their vote)
    * users who are not logged in should not be able to vote, but they should still be able to see the voting totals
    * on articles
        * next to an article, display a count of the net votes (upvotes minus downvotes)
        * if the user is logged in, also display an upvote-button and a downvote-button
            * if the current user has not upvoted or downvoted the article, both buttons should be coloured in some boring colour (e.g. white or gray)
            * if the current user has upvoted the article, the upvote button should be coloured an emphatic colour to show that (e.g. green)
            * if the current user has downvoted the article, the downvote button should be coloured an emphatic colour to show that (e.g. red)
        * if the user clicks an unvoted button, it creates-or-updates their vote as necessary
        * if the user clicks on a button that was already activated, it deactivates their vote
        * both buttons work via backend logic, no frontend!
        * you must implement this where articles are listed in subjeddits, and in the article/show route
            * optionally, also implement this everywhere else articles are seen, such as on the frontpage, or in user profiles
        * add a single route like this: `POST /articles/vote/:id/:votevalue`
            * decide for yourself what `votevalue` should be, but remember there are three possible values
    * on comments
        * same thing, except for comments
        * you must implement this where comments are listed in articles, and in the comments/show route
            * optionally, also implement this everywhere else comments are seen, such as in user profiles
        * add a single route like this: `POST /comments/vote/:id/:votevalue`
            * the meaning of `votevalue` should be consistent with what you did for articles
    * when you vote, it should request to the appropriate POST route, and the POST route-handler should redirect you back to the route you were on
        * use a query param to make this work
    * when an user creates an article or comment, assume that they would like to immediately create a vote for their own content
        * do actually create the vote for them, so that they can't create an additional vote for themselves later
* custom ordering
    * anywhere that articles or comments are displayed in a list, it should not be possible to reorder them
        * articles or comments can be ordered four (or five) ways:
            * "top" means ordered by `(upvotes - downvotes)`, with higher valeus of `(upvotes - downvotes)` at the top
            * "new" means ordered by timestamp, newest ones at the top
                * note that the new DB has added timestamps for articles, I don't know why I didn't have them before
            * "old" is the oppsite of "new", of course
            * "ragebait" means ordered by `(upvotes + downvotes)`
            * optionally, try to figure out an algorithm for "new", and add that, if you want!
    * on every page (i.e. view) that has article-ordering or comment-ordering, there needs to be a dropdown for the user to select an order
        * if you know how to use event handlers to submit the form without using a Submit butotn, you may
        * or you may use a Submit button
        * but either way, the reordering must be done on the backend
        * the action should go to the same page as currently, but with a `?ordering=` query param added
    * every route that has article-ordering or comment-ordering, needs to look for the query-param and use it to reorder the values before sending them to the EJS
        * (or reorder them in the EJS, maybe)




## EXEMP tier

* moderators
    * everybody loves mods, let's add mods
    * when a user creates a subjeddit, they are automatically made a mod of that subjeddit
    * when viewing a subjeddit, or viewing an article, mods see the following extra buttons next to all articles and comments:
        * "Mod Delete", works just like "Delete"
    * when viewing a subjeddit, mods of that subjeddit can see an extra button: "Mod List", which goes to:
        * `GET /subs/show/:subname/mods/list`
    * implement the following routes for managing the mod list:
        * `GET /subs/show/:subname/mods/add`
        * `POST /subs/show/:subname/mods/add`
        * `GET /subs/show/:subname/mods/remove/:mod_name`
        * `POST /subs/show/:subname/mods/remove/:mod_name`
        * should these routes be in their own router?   do whatever you want, but think about it!
    * note that in a real social media app, you'd probably want to have supermods who cannot be removed by regular mods, but we're going to skip that
        * so it's possible to create a sub, then promote someone else to mod, and then they remove you as a mod!
* nested comments
    * previously, every comment was a reply to an article.  let's make it so that comments can reply to comments.
        * that includes letting comments reply to comments thare are replies to comments, and comments that are replies to replies to comments, etc
    * so now next to every comment, when a user is logged in, there should be a `Reply` button
        * that button goes to the `GET /comments/show/:id` route for the existing comment (which already exists)
            * now that page should, if the user is logged in, have a form to reply
                * that goes to `POST /comments/create`, which also already exists, but now it need to pass a parameter or something so that it knows that it's a reply
    * when viewing an article and all of its comments, nested reply comments should display nicely
    * when viewing a single comment, all of its nested replies should display at the bottom
