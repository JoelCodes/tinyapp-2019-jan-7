const express = require('express');
const app = express();
const PORT = 8080;

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'ejs');


const urlDatabase = [
  { tinyURL: 'b2xVn2', fullURL: 'http://www.lighthouselabs.ca'},
  { tinyURL: '9sm5xK', fullURL: 'http://www.google.com'},
  ];

// GET routes are ordered from most to least specific
app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

app.get('/urls/:id', (req, res) => {
  let templateVars = { shortURL: req.params.id, longURL: urlDatabase };
  res.render('urls_show', templateVars);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase};
  res.render('urls_index', templateVars);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.post('/urls', (req, res) => {
  const idString = generateRandomString();
  console.log("from post urls", idString);
  const inputURL = req.body.longURL;
  urlDatabase.push({tinyURL: idString, fullURL: inputURL});
  const goHere = `http://localhost:8080/u/${idString}`;
  res.redirect(302, goHere);
});

app.get('/u/:shortURL', (req, res) => {
  const idPath = req.originalUrl;
  const idString = idPath.split('').slice(3).join('');
  const goHere = [];
  for (let item of urlDatabase){
    if (item.tinyURL == idString){
      goHere.push(item.fullURL);
    }
  }
  console.log(goHere.length);
  if (goHere.length > 0){
    res.redirect(302, goHere.join('')); //302, because this is a temporary redirect
  } else {
    res.redirect(404, '/not-found');
  }
});

app.get('/not-found', (res, req) => {
  res.send('Sorry. That shortened URL is not in our database.')
});

app.listen(PORT, ()=> {
  console.log(`Example app listening on port ${PORT}!`);
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
// the urlDatabase is refreshed each time the server is restarted
// 302, yo! It's a temporary redirect.