const express = require('express');
const Promise = require('bluebird');
const sqlite = require('sqlite');
const SQL = require('sql-template-strings');
const ejs = require('ejs');

const app = express();

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
    //res.render('pages/index');

    const user = await req.db.get(SQL`SELECT * FROM user WHERE email = 'bob@gmail.com'`);
    res.send(user);

});

main();