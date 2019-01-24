'use strict';

/* eslint no-use-before-define: "off" */
// setting up the modules and middleware
const express = require('express');
const MongoClient = require('mongodb').MongoClient

const app = express();
const PORT = 8080;

const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));

const cookieSession = require('cookie-session');

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}));

const methodOverride = require('method-override');

app.use(methodOverride('_method'));

app.set('view engine', 'ejs');

const bcrypt = require('bcrypt');
MongoClient.connect('mongodb://localhost:27017', (err, client) => {
  if(err){
    console.log('Connection Error', err);
    return;
  }
  const db = client.db('tiny-app-7-jan-2019-fresh-to-death');
  const usersColl = db.collection('users');
// universal variables
const urlDatabase = [];


app.use((req, res, next) => {
  getUserObj(req.session.user_id, (err, user) => {
    console.log('Initial User', err, user);
    res.locals.user = req.user = (user || undefined);
    next();
  })
})

// GET routes (from most to least specific)
app.get('/urls/new', (req, res) => {
  const templateVars = {
  };
  if (req.session.user_id) {
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get('/urls/:id', (req, res) => {
  const longURL = matchLongUrl(urlsForUser(req.session.user_id), req.params.id);
  const userID = req.session.user_id;

  const templateVars = {
    userID,
    longURL,
    shortURL: req.params.id,
  };

  if (urlDatabaseChecker(req.params.id)) {
    if (!req.session.user_id) {
      res.send('Try <a href="/login">logging in</a> first.');
    } else if (!isThisYours(req.params.id, req.session.user_id)) {
      res.send('That URL does not belong to you. 😾');
    } else if (req.session.user_id) {
      res.render('urls_show', templateVars);
    }
  } else {
    res.send('That URL is not in the database. 😞 Would you like to <a href="/register">make a new one</a>?');
  }
});

app.get('/urls', (req, res) => {
  if (req.session.user_id) {
    const templateVars = {
      urls: urlsForUser(req.session.user_id), // arr
    };
    res.render('urls_index', templateVars);
  } else {
    res.send('You need to <a href="/login">log in</a> to see your shortened URLs.');
  }
});

app.get('/u/:id', (req, res) => {
  const shortUrl = req.params.id;
  const goHere = findLongUrl(shortUrl); // array
  if (goHere.length > 0) {
    return res.redirect(302, goHere.join(''));
  } else {
    return res.status(404).send('Sorry. That URL is not in our database. 😞 Would you like to <a href="/urls/new">make one</a>?');
  }
});

app.get('/', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
  if (!req.session.user_id) {
    const templateVars = { };
    res.render('urls_login', templateVars);
  } else {
    res.redirect('/urls');
  }
});

app.get('/register', (req, res) => {
  if (!req.user) {
    const templateVars = {};
    res.render('urls_register', templateVars);
  } else {
    res.redirect('/urls');
  }
});

// POST requests (most to least specific)
app.put('/urls/:id', (req, res) => {
  const shortUrl = req.params.id;
  if (req.session.user_id && isThisYours(shortUrl, req.session.user_id)){
    const newFull = inputUrlFixer(req.body.newFull);
    addToDatabase(newFull, shortUrl);
    res.redirect(`/urls/${shortUrl}`);
  } else {
    res.send('Sorry, pal. You can\'t do that. Are you <a href="/login">logged in</a> to the right account?')
  }
})
 .delete('/urls/:id', (req, res) => {
  const toBeDel = req.params.id;
  databaseObjRemover(toBeDel);
  res.redirect('/urls');
});

app.post('/urls', (req, res) => {
  const randomStr = generateRandomString();
  const inputURL = inputUrlFixer(req.body.longURL);
  urlDatabase.push({ tinyURL: randomStr, fullURL: inputURL, owner: req.session.user_id });
  res.redirect(`/urls/${randomStr}`);
});

app.post('/login', (req, res) => {
  authorize(req.body.email, req.body.password, (err, user) => {
    if(user){
      req.session.user_id = user.id;
      res.redirect('/urls');
    } else {
      res.send('Sorry, pal. Your email or password do not match. Try <a href="/login">logging in</a> again or <a href="/register">register an account</a>. 🚶');
    }
  })
});

app.post('/logout', (req, res) => { // leave as post
  req.session = null;
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400).send('Yeah, we can\'t exactly register you with empty fields... <a href="/register">Try again</a>.');
    return;
  }
  emailMatchChecker(req.body.email, (err, emailsMatch) => {
    if (err || emailsMatch){
      res.status(400).send('Email is already in the system. Try <a href="/login">logging in</a>.');
      return;
    }
    insertUser(req.body.email, req.body.password, (err, newUser) => {
      req.session.user_id = newUser.id;
      res.redirect('/urls');  
    });
     
  });
});

app.listen(PORT, () => {
  console.log(`Shmoo's tiny app listening on port ${PORT}!`);
});

// HELPER functions
function generateRandomString() {
  const everyAlphaNum = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
  let output = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * 62);
    output += everyAlphaNum[randomIndex];
  }
  return output;
}

function insertUser(email, password, cb){
  const id = generateRandomString();
  usersColl.insertOne({
    id, email, 
    password: bcrypt.hashSync(password, 10)
  }, (err, result) => {
    if(err){
      cb(err);
    } else {
      cb(null, result.ops[0]);
    }
  });
}

function getUserObj(id, cb) {
  // const userObj = users[id];

  // cb(null, userObj);
  usersColl.findOne({id}, cb)
}

function urlsForUser(id) {
  const ownedURLs = {};
  let counter = 0;
  urlDatabase.forEach((url) => {
    if (url.owner === id) {
      counter++;
      ownedURLs[counter] = url;
    }
  });
  return ownedURLs;
}

function emailMatchChecker(email, cb) {
  usersColl.findOne({email}, (err, result) => {
    cb(err, !!result);
  })
}

function urlDatabaseChecker(shortURL) {
  for (const url of urlDatabase) {
    if (url.tinyURL === shortURL) {
      return true;
    }
  }
}

function isThisYours(shortURL, userID) {
  for (const url of urlDatabase) {
    if (url.tinyURL === shortURL) {
      return url.owner === userID;
    }
  }
  return false;
}

function inputUrlFixer(url) {
  const checkHttpWww = url.split('').splice(0, 11).join('');
  const checkWww = url.split('').splice(0, 4).join('');
  if (checkHttpWww === 'http://www.') {
      return url;
  } else if (checkWww === 'www') {
    url = url.split('').reverse();
    url.push('http://');
    url.reverse();
    url = url.join('');
    return url;
  } else {
    url = url.split('').reverse();
    url.push('http://www.');
    url.reverse();
    url = url.join('');
    return url;
  }
}

function findLongUrl(idStr) {
  const longUrl = [];
  for (const item of urlDatabase) {
    if (item.tinyURL === idStr) {
      longUrl.push(item.fullURL);
    }
  }
  return longUrl;
}

function databaseObjRemover(toBeDel) {
  for (const index in urlDatabase) {
    if (urlDatabase[index].tinyURL === toBeDel) {
      urlDatabase.splice(index, 1);
      return;
    }
  }
}

function addToDatabase(newFull, shortUrl) {
  for (const index in urlDatabase) {
    if (urlDatabase[index].tinyURL === shortUrl) {
      urlDatabase[index].fullURL = newFull;
      return;
    }
  }
}

function authorize(email, password, cb){
  usersColl.findOne({email}, (err, user) => {
    if(err){
      cb(err);
    } else if(user && bcrypt.compareSync(password, user.password)){
      cb(null, user);
    } else {
      cb(null);
    }
    
  })
}

function matchLongUrl (urlsNestObj, shortUrl) {
  for (let item in urlsNestObj){
    if (urlsNestObj[item].tinyURL === shortUrl) {
      return urlsNestObj[item].fullURL;
    }
  }
}
});
