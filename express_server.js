const express = require('express');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');

const urlDatabase = [
  { shortURL: 'b2xVn2', fullURL: 'http://www.lighthouselabs.ca'},
  { shortURL: '9sm5xK', fullURL: 'http://www.google.com'},
  ];

app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase};
  res.render('urls_index', templateVars);
});

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.listen(PORT, ()=> {
  console.log(`Example app listening on port ${PORT}!`);
});
