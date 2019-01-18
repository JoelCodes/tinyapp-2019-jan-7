"use strict";
// setting up the modules and middleware
const express = require('express');
const app = express();
const PORT = 8080;

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}));

app.set('view engine', 'ejs');

const bcrypt = require('bcrypt');
const user1PW = bcrypt.hashSync('cow', 10);


// universal variables
const urlDatabase = [
  { tinyURL: 'b2xVn2', fullURL: 'http://www.lighthouselabs.ca', owner: "userRandomID"},
  { tinyURL: '9sm5xK', fullURL: 'http://www.google.com', owner: "user2RandomID"},
  { tinyURL: 'C2xVn2', fullURL: 'http://www.blighthouselabs.ca', owner: "userRandomID"},
  ];

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: user1PW,
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "sow"
  }
};

// GET routes are ordered from most to least specific
app.get('/urls/new', (req, res) => {
  let templateVars = {
    user: getUserObj(req.session.user_id),
  };
  if (req.session.user_id){
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get('/urls/:id', (req, res) => {
  let templateVars = {
    user: getUserObj(req.session.user_id), // object
    shortURL: req.params.id,
    longURL: urlsForUser(req.session.user_id), // array
  };

  const usersURLs = urlsForUserObj(req.session.user_id);
  if (!req.session.user_id){
    res.send('Try <a href="/login">logging in</a> first.');
  } else if (req.session.user_id !== usersURLs.urls.owner) {
    res.send('That URL does not belong to you. 😾');
  } else if (req.session.user_id){
    res.render('urls_show', templateVars);
  }
});

app.get('/urls/not-found', (res, req) => {
  res.send('Sorry. That shortened URL is not in our database.')
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  if (req.session.user_id){
    let templateVars = {
      user: getUserObj(req.session.user_id),
      urls: urlsForUser(req.session.user_id),
    };
    res.render('urls_index', templateVars);
  } else {
    res.send('You need to <a href="/login">log in</a> to see your shortened URLs.')
  }
});

app.get('/u/:id', (req, res) => {
  const idString = req.params.id; // the shortURL/id
  const goHere = [];
  for (let item of urlDatabase){
    if (item.tinyURL === idString){
      goHere.push(item.fullURL);
    }
  }
  if (goHere.length > 0){
    return res.redirect(302, goHere.join('')); //302, because this is a temporary redirect
  } else {
    return res.status(404).send('Sorry. That shortened URL is not in our database.');
  }
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/login', (req, res) => {
  const templateVars = {
    user: getUserObj(req.session.user_id),
  };
  res.render('urls_login', templateVars);
})

app.get('/register', (req, res) => {
  const templateVars = {
    user: getUserObj(req.session.user_id),
  };
  res.render('urls_register', templateVars);
})

// POST requests
app.post('/urls/:id/delete', (req, res) => {
  const toBeDel = req.params.id; // the id in the address bar
  for (let index in urlDatabase){
    if(urlDatabase[index].tinyURL === toBeDel){
      urlDatabase.splice(index, 1);
    }
  }
  res.redirect('/urls');
});

app.post('/urls/:id', (req, res) => {
    const idString = req.params.id;
    const newFull = req.body.newFull;
    for (let index in urlDatabase){
      if (urlDatabase[index].tinyURL === idString){
        urlDatabase[index].fullURL = newFull;
      }
    }
    res.redirect(`/urls/${idString}`);

});

app.post('/urls', (req, res) => {
  const idString = generateRandomString();
  const inputURL = req.body.longURL;
  urlDatabase.push({tinyURL: idString, fullURL: inputURL, owner: req.session.user_id});
  console.log(req.session.user_id);
  res.redirect(`/urls/${idString}`);
});

app.post('/login', (req, res) => {
  // does email match a user in the database?
  const submittedEmail = req.body.email;
  const emailMatchCheck = emailMatchChecker(submittedEmail); // boolean

  // does hashed input password match hashed stored password?
  const storedPassword = findPassword(submittedEmail); // using the email address, return the stored (hashed) password
  const passwordMatchCheck = bcrypt.compareSync(req.body.password, storedPassword); //boolean

  const userID = findUser(submittedEmail);

  if (emailMatchCheck && passwordMatchCheck){
    req.session.user_id = users[userID].id;
    res.redirect('/urls/');
  } else if (!emailMatchCheck || !passwordMatchCheck){
    res.send('Sorry, pal. Your email or password do not match. <a href="/login">Try again</a>.');
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('session');
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  for (let user in users){
    if (users[user].email === req.body.email){
      res.status(400).send("Email is already in the system.");
    }
  }
  if (req.body.email && req.body.password){
    req.session.user_id = generateRandomString();
    users[req.session.user_id] = {
      id: req.session.user_id,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10),
    };
    res.redirect('/urls');
  } else {
    res.status(400).send("Yeah, we can't exactly register you with empty fields...");
  }
})

app.listen(PORT, ()=> {
  console.log(`Shmoo's tiny app listening on port ${PORT}!`);
});

function generateRandomString() {
  const everyAlphaNum = `abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890`;
  const output = [];
  for (let i = 0; i < 6; i++){
    let randomIndex = Math.floor(Math.random() * Math.floor(61));
    output.push(everyAlphaNum[randomIndex]);
  }
  return output.join('');
}

function getUserObj(theCookie) {
  const userObj = users[theCookie];
  return userObj;
}

function findUser(email){
  let output;
  for (let user in users){
    if (users[user].email === email){
      output = users[user].id;
      return output;
    }
  }
}

function urlsForUser(id) {
  let ownedURLs = [];
  urlDatabase.forEach((url) => {
    if (url.owner === id){
      ownedURLs.push(url);
    }
  });
  return ownedURLs;
}

function urlsForUserObj(id){
  let ownedURLs = {};
  urlDatabase.forEach((url) => {
    if (url.owner === id){
      ownedURLs.urls = url;
    }
  });
  return ownedURLs;
}

function emailMatchChecker(email){
  for (let user in users){
    if (users[user].email === email){
      return true;
    }
  }
}

function findPassword(email){
  for (let user in users){
    if (users[user].email === email){
      return users[user].password;
    }
  }
}
