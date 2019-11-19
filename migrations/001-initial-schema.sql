DROP TABLE IF EXISTS "post";
CREATE TABLE IF NOT EXISTS "post" (
	"post_id"	INTEGER PRIMARY KEY AUTOINCREMENT,
	"title"	varchar(25) NOT NULL,
	"body_text"	varchar(5000) NOT NULL,
	"poster_email"	varchar(25) DEFAULT NULL,
	"post_date"	date NOT NULL,
	"course_subject"	varchar(4) NOT NULL,
	"course_number"	INTEGER NOT NULL,
	"course_semester"	varchar(5) NOT NULL,
	FOREIGN KEY("poster_email") REFERENCES "user"("email") ON DELETE SET NULL ON UPDATE CASCADE,
	FOREIGN KEY("course_subject","course_number","course_semester") REFERENCES "course"("subject","number","semester") ON DELETE CASCADE ON UPDATE CASCADE
);
DROP TABLE IF EXISTS "user";
CREATE TABLE IF NOT EXISTS "user" (
	"email"	varchar(30) NOT NULL,
	"username"	varchar(25) NOT NULL,
	"password"	varchar(40) NOT NULL,
	"faculty"	varchar(30) DEFAULT 'Not Specified',
	PRIMARY KEY("email")
);
DROP TABLE IF EXISTS "moderating";
CREATE TABLE IF NOT EXISTS "moderating" (
	"moderator_email"	varchar(30) NOT NULL,
	"course_subject"	varchar(4) NOT NULL,
	"course_number"	INTEGER NOT NULL,
	"course_semester"	varchar(5) NOT NULL,
	PRIMARY KEY("moderator_email","course_subject","course_number","course_semester"),
	FOREIGN KEY("moderator_email") REFERENCES "user"("email") ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY("course_subject","course_number","course_semester") REFERENCES "course"("subject","number","semester") ON DELETE CASCADE ON UPDATE CASCADE
);
DROP TABLE IF EXISTS "following";
CREATE TABLE IF NOT EXISTS "following" (
	"follower_email"	varchar(30) NOT NULL,
	"course_subject"	varchar(4) NOT NULL,
	"course_number"	INTEGER NOT NULL,
	"course_semester"	varchar(5) NOT NULL,
	PRIMARY KEY("follower_email","course_subject","course_number","course_semester"),
	FOREIGN KEY("follower_email") REFERENCES "user"("email") ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY("course_subject","course_number","course_semester") REFERENCES "course"("subject","number","semester") ON DELETE CASCADE ON UPDATE CASCADE
);
DROP TABLE IF EXISTS "comment";
CREATE TABLE IF NOT EXISTS "comment" (
	"comment_id"	INTEGER PRIMARY KEY AUTOINCREMENT,
	"body_text"	varchar(3000) NOT NULL,
	"post_date"	date NOT NULL,
	"post_id"	INTEGER NOT NULL,
	"poster_email"	varchar(30),
	FOREIGN KEY("post_id") REFERENCES "post"("post_id") ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY("poster_email") REFERENCES "user"("email") ON DELETE SET NULL ON UPDATE CASCADE
);
DROP TABLE IF EXISTS "course";
CREATE TABLE IF NOT EXISTS "course" (
	"subject"	varchar(4) NOT NULL,
	"number"	INTEGER NOT NULL,
	"semester"	varchar(5) NOT NULL,
	"professor_id"	INTEGER,
	PRIMARY KEY("subject","number","semester"),
	FOREIGN KEY("professor_id") REFERENCES "professor"("professor_id") ON DELETE SET NULL ON UPDATE CASCADE
);
DROP TABLE IF EXISTS "review";
CREATE TABLE IF NOT EXISTS "review" (
	"review_id"	INTEGER PRIMARY KEY AUTOINCREMENT,
	"rating"	INTEGER NOT NULL,
	"description"	varchar(1000),
	"post_date"	date NOT NULL,
	"professor_id"	INTEGER NOT NULL,
	"course_name"	varchar(7),
	FOREIGN KEY("professor_id") REFERENCES "professor"("professor_id") ON DELETE CASCADE ON UPDATE CASCADE
);
DROP TABLE IF EXISTS "professor";
CREATE TABLE IF NOT EXISTS "professor" (
	"professor_id"	INTEGER PRIMARY KEY AUTOINCREMENT,
	"firstname"	varchar(25) NOT NULL,
	"middleinitial"	varchar(5),
	"lastname"	varchar(25) NOT NULL,
	"department"	varchar(25) DEFAULT 'Not Specified'
);

-- Down
