// setting up the modules and middleware
const express = require('express');
const app = express();
const PORT = 8080;

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.set('view engine', 'ejs');

// universal variables
const urlDatabase = [
  { tinyURL: 'b2xVn2', fullURL: 'http://www.lighthouselabs.ca'},
  { tinyURL: '9sm5xK', fullURL: 'http://www.google.com'},
  ];

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

// GET routes are ordered from most to least specific
app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

app.get('/urls/:id', (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
    shortURL: req.params.id,
    longURL: urlDatabase,
  };
  res.render('urls_show', templateVars);
});

app.get('/urls/not-found', (res, req) => {
  res.send('Sorry. That shortened URL is not in our database.')
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase,
  };
  res.render('urls_index', templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  // const idPath = req.originalUrl;
  // const idString = idPath.split('').slice(3).join('');
  const idString = req.params.id; // the shortURL/id
  const goHere = [];
  for (let item of urlDatabase){
    if (item.tinyURL == idString){
      goHere.push(item.fullURL);
    }
  }
  if (goHere.length > 0){
    res.redirect(302, goHere.join('')); //302, because this is a temporary redirect
  } else {
    res.redirect(404, 'http://localhost:8080/urls/not-found');
  }
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/register', (req, res) => {
  res.render('urls_register');
})

// POST requests
app.post('/urls/:id/delete', (req, res) => {
  const toBeDel = req.params.id; // the id in the address bar
  for (let index in urlDatabase){
    if(urlDatabase[index].tinyURL == toBeDel){
      urlDatabase.splice(index, 1);
    }
  }
  res.redirect('/urls');
});

app.post('/urls/:id', (req, res) => {
  const idString = req.params.id; // the shortURL/id
  const newFull = req.body.newFull; // the contents of the input field
  // change the urlDatabase array
  for (let index in urlDatabase){
    if (urlDatabase[index].tinyURL == idString){
      urlDatabase[index].fullURL = newFull;
    }
  }
  res.redirect(`/urls/${idString}`);
});

app.post('/urls', (req, res) => {
  const idString = generateRandomString();
  const inputURL = req.body.longURL;
  urlDatabase.push({tinyURL: idString, fullURL: inputURL});
  const goHere = `http://localhost:8080/u/${idString}`;
  res.redirect(302, goHere);
});

app.post('/login', (req, res) => {
  const userName = req.body.username;
  res.cookie('username', userName);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});


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

// edge cases:
// a non-existent shortURL reveals header information but nothing else; but the status says "found" which... is untrue.
  // fixed! Now it sends an error message on the browser.
  // apparently it's not fixed.
  // FIXED!
// the urlDatabase is refreshed each time the server is restarted
// 302, yo! It's a temporary redirect.