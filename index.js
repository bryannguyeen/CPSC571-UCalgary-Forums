const express = require('express');
const Promise = require('bluebird');
const sqlite = require('sqlite');
const SQL = require('sql-template-strings');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();

app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());

app.set('view engine', 'ejs');

let db;

app.use(function(req, res, next) {
    req.db = db;
    next();
});

async function main() {
    const port = 3000;
    db = await sqlite.open('./database.sqlite', { cached: true, Promise }).then(db => db.migrate());
    await db.run(SQL`PRAGMA foreign_keys = ON`);

    app.listen(port);
    console.log(`Listening on port ${port}: http://localhost:${port}`);
}

app.get('/', async (req, res, next) => {
    // TODO: Add frontend pages
    res.render('pages/index');

    const user = await req.db.get(SQL`SELECT * FROM user WHERE email = 'bob@gmail.com'`);
    //res.send(user);
});

app.get('/welcome', async (req, res, next) => {
    res.render('pages/welcome');
})

app.get('/login', async (req, res, next) => {
    res.render('pages/login');
})

// TODO: app.post('/login'

app.get('/register', async (req, res, next) => {
    res.render('pages/register');
})

app.post('/register', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmpassword;
    const username = req.body.username;

    // Basic syntax check
    if (!(/\S+@\S+\.\S+/.test(email))) {
        return res.render('pages/register', {
            message: 'Not a valid email address',
            emailReturn: email, usernameReturn: username, passwordReturn: password, confirmpasswordReturn: confirmPassword });
    }
    if (/[^A-Za-z0-9\d]/.test(username)) {
        return res.render('pages/register', {
            message: 'Nickname can only contain letters and numbers',
            emailReturn: email, usernameReturn: username, passwordReturn: password, confirmpasswordReturn: confirmPassword });
    }
    if (username.length < 1 || username.length > 25) {
        return res.render('pages/register', {
            message: 'Invalid username length', 
            emailReturn: email, usernameReturn: username, passwordReturn: password, confirmpasswordReturn: confirmPassword });

    }
    if (password != confirmPassword) {
        return res.render('pages/register', {
            message: 'Passwords do not match',
            emailReturn: email, usernameReturn: username, passwordReturn: password, confirmpasswordReturn: confirmPassword });
    }
    if (password.length < 8) {
        return res.render('pages/register', {
            message: 'Password must be at least 8 characters',
            emailReturn: email, usernameReturn: username, passwordReturn: password, confirmpasswordReturn: confirmPassword });
    }

    // Check if email already exists under that account
    const dbEmail = await req.db.get(SQL`SELECT * FROM user WHERE LOWER(email) = LOWER(${email})`);
    if (dbEmail) {
        return res.render('pages/register', {
            message: 'There is already an account under that email',
            emailReturn: email, usernameReturn: username, passwordReturn: password, confirmpasswordReturn: confirmPassword });
    }

    // Check if nickname is taken
    const dbUsername = await req.db.get(SQL`SELECT * FROM user WHERE LOWER(username) = LOWER(${username})`);
    if (dbUsername) {
        return res.render('pages/register', {
            message: 'Nickname is already taken',
            emailReturn: email, usernameReturn: username, passwordReturn: password, confirmpasswordReturn: confirmPassword });
    }

    // if all conditions are met, enter user to database
    const hashedPassword = await bcrypt.hash(password, 10);
    await req.db.run(SQL`INSERT INTO user (email, username, password) VALUES(${email}, ${username}, ${hashedPassword})`);

})

main();