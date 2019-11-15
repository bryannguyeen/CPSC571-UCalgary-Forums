const express = require('express');
const promise = require('bluebird');
const sqlite = require('sqlite');
const ejs = require('ejs');

const app = express();

const port = 3000;

app.set('view engine', 'ejs');

// TODO: Set up sqlite database and dbPromise

app.get('/', async (req, res, next) => {
    // TODO: Add frontend pages
    res.render('pages/index');
});

app.listen(port);
console.log(`Server listening on port ${port}`);
