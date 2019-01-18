// setting up the modules and middleware
const express = require('express');
const app = express();
const PORT = 8080;

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

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
    user: getUserObj(req.cookies["user_id"]),
  };
  if (req.cookies.user_id){
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
  // if logged in, return HTML with...
    // site header
    // a form with text input for long URL, submit button POST '/urls'
  // if not logged in, redirect to '/login'
});

app.get('/urls/:id', (req, res) => {
  let templateVars = {
    user: getUserObj(req.cookies["user_id"]), // object
    shortURL: req.params.id,
    longURL: urlsForUser(req.cookies["user_id"]), // array
  };

  const usersURLs = urlsForUserObj(req.cookies["user_id"]);
  if (!req.cookies["user_id"]){
    res.send('Try <a href="/login">logging in</a> first.');
  } else if (req.cookies["user_id"] !== usersURLs.urls.owner) {
    res.send('That URL does not belong to you. 😾');
  } else if (req.cookies["user_id"]){
    res.render('urls_show', templateVars);
  }
  // if logged in and owns the URL for the given ID, return HTML with...
    // site header
    // short URL for the given ID
    // a form with corresponding long URL, update button that POSTs to '/urls/:id'
    // (more stretch)
  // if URL for the ID does not exist
    // returns HTML with relevant error message
  // if not logged in
    // returns HTML with error
  // if logged in but doesn't own the URL with the ID
    // error
});

app.get('/urls/not-found', (res, req) => {
  res.send('Sorry. That shortened URL is not in our database.')
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  // if user is logged in, return HTML with...
    // a site header
    // a list of the URLs the user has created including...
      // a short URL and matching long URL
      // edit button, GET to '/urls/:id'
      // delete button, POST to '/urls/:id/delete'
      // (others in stretch)
    // a link, GET to '/urls/new'
  // if user is not logged int, return HTML with error
  if (req.cookies["user_id"]){
    let templateVars = {
      user: getUserObj(req.cookies["user_id"]),
      urls: urlsForUser(req.cookies["user_id"]),
    };
    res.render('urls_index', templateVars);
  } else {
    res.send('You need to <a href="/login">log in</a> to see your shortened URLs.')
  }
});

app.get('/u/:id', (req, res) => {
  // if URL for ID exists...
    // redirect to URL
  // else
    // error message

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
}); // SOMETHING HAS GONE WEIRD HERE...

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.get('/', (req, res) => {
  // if user is logged in, redirect to '/urls'
  // if user is not logged in, redirect to '/login'
  res.send('Hello!');
});

app.get('/login', (req, res) => {
  const templateVars = {
    user: getUserObj(req.cookies["user_id"]),
  };
  res.render('urls_login', templateVars);
  // if logged in
    // redirect to '/urls'
  // not logged in, returns HTML with...
    // a form with input fields (email and pass), submit POST to '/login'
})

app.get('/register', (req, res) => {
  // logged in
    // redirect to /urls
  // not logged in, return HTML with...
    // a form to register (form with email/pass, button POST '/register')
  const templateVars = {
    user: getUserObj(req.cookies["user_id"]),
  };
  res.render('urls_register', templateVars);
})

// POST requests
app.post('/urls/:id/delete', (req, res) => {
  // logged in && owns URL/ID
    // deletes the URL
    // redirects to /urls
  // not logged in
    // returns error
  // does not own
    // error
  const toBeDel = req.params.id; // the id in the address bar
  for (let index in urlDatabase){
    if(urlDatabase[index].tinyURL === toBeDel){
      urlDatabase.splice(index, 1);
    }
  }
  res.redirect('/urls');
});

app.post('/urls/:id', (req, res) => {
  // logged in && owns URL for given ID
    // update the URL
    // redirects to /urls
  // not logged int
    // error message
  // does not own
    // error
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
  // if logged in...
    // generate short URL, saves it, associates it with the user
    // redirects to '/urls/:id', where :id matches the ID of the newly saved URL
  // not logged in...
    // returns error message
  const idString = generateRandomString();
  const inputURL = req.body.longURL;
  urlDatabase.push({tinyURL: idString, fullURL: inputURL, owner: req.cookies.user_id});
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
    res.cookie('user_id', users[userID].id);
    res.redirect('/urls/');
  } else if (!emailMatchCheck || !passwordMatchCheck){
    res.send('Sorry, pal. Your email or password do not match. <a href="/login">Try again</a>.');
  }
});

app.post('/logout', (req, res) => {
  // deletes cookies
  // redirects to '/urls'
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  for (let user in users){
    if (users[user].email === req.body.email){
      res.status(400).send("Email is already in the system.");
    }
  }
  if (req.body.email && req.body.password){
    const randomUserId = generateRandomString();
    users[randomUserId] = {
      id: randomUserId,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10),
    };
    res.cookie('user_id', randomUserId);
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

function findUser(email){//, password){
  let output;
  for (let user in users){
    if (users[user].email === email){//} && users[user].password === password){
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
