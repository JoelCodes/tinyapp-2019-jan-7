// const express = require('express');
// const app = express();
// const PORT = 8080;

// const bodyParser = require('body-parser');
// app.use(bodyParser.urlencoded({extended: true}));

// app.set('view engine', 'ejs');


// const urlDatabase = [
//   { tinyURL: 'b2xVn2', fullURL: 'http://www.lighthouselabs.ca'},
//   { tinyURL: '9sm5xK', fullURL: 'http://www.google.com'},
//   ];

// // GET routes are ordered from most to least specific
// app.get('/urls/new', (req, res) => {
//   res.render('urls_new');
// });

// app.get('/urls/:id', (req, res) => {
//   let templateVars = { shortURL: req.params.id, longURL: urlDatabase };
//   res.render('urls_show', templateVars);
// });

// app.get('/urls.json', (req, res) => {
//   res.json(urlDatabase);
// });

// app.get('/urls', (req, res) => {
//   let templateVars = { urls: urlDatabase};
//   res.render('urls_index', templateVars);
// });

// app.get('/hello', (req, res) => {
//   res.send('<html><body>Hello <b>World</b></body></html>\n');
// });

// app.get('/', (req, res) => {
//   res.send('Hello!');
// });

// app.post('/urls', (req, res) => {
//   console.log(req.body);
//   res.send('Okie dokie');
// });

// app.listen(PORT, ()=> {
//   console.log(`Example app listening on port ${PORT}!`);
// });

function generateRandomString() {
  const everyAlphaNum = `abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890`;
  const output = [];
  for (let aN in everyAlphaNum){
    let index = Math.floor(Math.random() * Math.floor(61))
    if (aN <= 5){
      output.push(everyAlphaNum[index]);
    }
  }
  console.log(output.join(''));
}

generateRandomString();