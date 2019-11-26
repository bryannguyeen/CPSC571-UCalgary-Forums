const express = require('express');
const Promise = require('bluebird');
const sqlite = require('sqlite');
const SQL = require('sql-template-strings');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

const app = express();

app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());
app.use(session({
    secret: 'i be doing work',
    resave: false,
    saveUninitialized: true
}));

app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

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

// redirects to login page if user isn't logged in
async function requiresLogin(req, res, next) {
    if (!req.session.userID) {
        return res.redirect('/welcome');
    }
    return next();
}

// redirects to dashboard if user attempts to go to welcome pages
async function requiresLogout(req, res, next) {
    if (req.session.userID) {
        return res.redirect('/dashboard');
    }
    return next();
}

app.get('/', async (req, res, next) => {
    res.redirect('/welcome');
    //res.render('pages/index');

    //const user = await req.db.get(SQL`SELECT * FROM user WHERE email = 'bob@gmail.com'`);
    //res.send(user);
});

app.get('/welcome', requiresLogout, async (req, res, next) => {
    res.render('pages/welcome');
})

app.get('/login', requiresLogout, async (req, res, next) => {
    res.render('pages/login');
})

app.post('/login', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const dbUser = await req.db.get(SQL`SELECT * FROM user WHERE LOWER(email) = LOWER(${email})`);

    // check if user with that email exists
    if (!dbUser) {
        return res.render('pages/login', {
            message: 'There is no account associated with that email',
            emailReturn: email, passwordReturn: password});
    }
    // check if password is correct
    if (!(await bcrypt.compare(password, dbUser.password))) {
        return res.render('pages/login', {
            message: 'Password is incorrect',
            emailReturn: email, passwordReturn: password});
    }

    // if login is valid, create a session
    req.session.userID = dbUser.email;
    res.redirect('/dashboard');
})

app.get('/register', requiresLogout, async (req, res, next) => {
    res.render('pages/register');
})

app.post('/register', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmpassword;
    const username = req.body.username;

    // Correct syntax check
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
            message: 'Invalid username length (at least 1 character, at most 25 characters)',
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

    req.session.userID = email;
    res.redirect('/dashboard');
})

app.get('/login', async (req, res, next) => {
    res.render('pages/login');
})

app.get('/logout', async (req, res, next) => {
    await req.session.destroy();
    res.redirect('welcome');
})

app.get('/dashboard', requiresLogin, async (req, res, next) => {
    res.render('pages/dashboard')
})

app.get('/professors', requiresLogin, async (req, res, next) => {
    var dbProfessors;
    const term = req.query.search;
    if (term) {
        dbProfessors = await req.db.all(
            SQL`SELECT *
                FROM professor
                WHERE
                firstname LIKE ${term} OR
                middleinitial LIKE ${term} OR
                lastname LIKE ${term} OR
                department LIKE ${term}
                ORDER BY department, firstname, lastname`);
    } else {
        dbProfessors = await req.db.all(
            SQL`SELECT *
                FROM professor
                ORDER BY department, firstname, lastname`);
    }
    res.render('pages/professors', {professors: dbProfessors, searchTerm: term})
})

app.get('/professor/:id', requiresLogin, async (req, res, next) => {
    const profID = req.params.id;
    const dbProfessor = await req.db.get(
        SQL`SELECT *
            FROM professor
            WHERE professor_id = ${profID}`);
    const averageRating = await req.db.get(
        SQL`SELECT AVG (rating) as average
            FROM review
            WHERE professor_id = ${profID}`);
    const reviewsDB = await req.db.all(
        SQL`SELECT *
            FROM review
            WHERE professor_id = ${profID}`);

    // Gets the counts of each individual occurence of a tag
    const profTags = await req.db.get(
        SQL`SELECT
            SUM(homework) as homework, SUM(test) as test, SUM(participation) as participation, SUM(respectful) as respectful,
            SUM(notesonline) as notesonline, SUM(available) as available, SUM(lectures) as lectures
            FROM review
            WHERE professor_id = ${profID}`
    );

    // Get the list of questions asked about this professor
    const questionsDB = await req.db.all(
        SQL`SELECT *
            FROM question
            WHERE professor_id = ${profID}`);

    const average = Math.round( averageRating.average * 10 ) / 10;
    res.render('pages/professorprofile', {professor: dbProfessor, rating: average, reviews: reviewsDB, questions: questionsDB, tagCount: profTags});
})

app.get('/newreview', requiresLogin, async (req, res, next) => {
    const profID = req.query.prof_id;
    // if there's no query string redirect to home
    if (!profID) {
        return res.redirect('/dashboard');
    }

    const dbProfessor = await req.db.get(
        SQL`SELECT *
            FROM professor
            WHERE professor_id = ${profID}`);

    res.render('pages/newreview', {professor: dbProfessor});
})

app.post('/newreview', async (req, res, next) => {
    const rating = req.body.rating;
    const description = req.body.description;
    const profID = req.body.prof_id;
    const coursename = req.body.class_name+req.body.class_number;

    const homework = req.body.homework == "on";
    const test = req.body.test == "on";
    const participation = req.body.participation == "on";
    const respectful = req.body.respectful == "on";
    const notesonline = req.body.notesonline == "on";
    const available = req.body.available == "on";
    const lectures = req.body.lectures == "on";

    await req.db.run(SQL`INSERT INTO review (rating, description, professor_id, course_name,
                        homework, test, participation, respectful, notesonline, available, lectures)
                            VALUES(${rating}, ${description}, ${profID}, ${coursename},
                            ${homework}, ${test}, ${participation}, ${respectful}, ${notesonline}, ${available}, ${lectures})`);

    res.redirect('/professor/' + profID)
})

app.get('/newquestion', requiresLogin, async (req, res, next) => {
    const profID = req.query.prof_id;
    // if there's no query string redirect to home
    if (!profID) {
        return res.redirect('/dashboard');
    }

    const dbProfessor = await req.db.get(
        SQL`SELECT *
            FROM professor
            WHERE professor_id = ${profID}`);

    res.render('pages/newquestion', {professor: dbProfessor});
})

app.post('/newquestion', async (req, res, next) => {
    const question = req.body.question;
    const profID = req.body.prof_id;

    await req.db.run(SQL`INSERT INTO question (professor_id, question_text)
                            VALUES(${profID}, ${question})`);

    res.redirect('/professor/' + profID)
})

app.get('/question', requiresLogin, async (req, res, next) => {
    const questionID = req.query.id;
    // if there's no query string redirect to home
    if (!questionID) {
        return res.redirect('/dashboard');
    }

    const questionDB = await req.db.get(
        SQL`SELECT *
            FROM question, professor
            WHERE post_id = ${questionID} AND question.professor_id = professor.professor_id`);
    const answersDB = await req.db.all(
        SQL`SELECT *
            FROM answer
            WHERE question_id = ${questionID}`);

    res.render('pages/question', {question: questionDB, answers: answersDB});
})

app.post('/question', async (req, res, next) => {
    const questionID = req.body.question_id;
    const answer_text = req.body.answer;

    await req.db.run(SQL`INSERT INTO answer (question_id, answer_text)
                        VALUES(${questionID}, ${answer_text})`);


    res.redirect('/question?id=' + questionID);
})

app.get('/newprofessor', requiresLogin, async (req, res, next) => {
    res.render('pages/newprofessor')
})

app.post('/newprofessor', async (req, res, next) => {
    var firstName = req.body.FName;
    var middleInitial = req.body.MInit;
    var lastName = req.body.LName;
    const department = req.body.department;

    // Capitalize names if not done already
    firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
    middleInitial = middleInitial.toUpperCase();
    lastName = lastName.charAt(0).toUpperCase() + lastName.slice(1);

    await req.db.run(SQL`INSERT INTO professor (firstname, middleinitial, lastname, department) VALUES(${firstName}, ${middleInitial}, ${lastName}, ${department})`);
    res.redirect('/professors');
})

main();
