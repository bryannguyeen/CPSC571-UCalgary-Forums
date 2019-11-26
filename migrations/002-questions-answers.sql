DROP TABLE IF EXISTS "answer";
CREATE TABLE IF NOT EXISTS "answer" (
	"post_id"	INTEGER PRIMARY KEY AUTOINCREMENT,
	"question_id"	INTEGER NOT NULL,
	"post_date"	date NOT NULL DEFAULT ((datetime('now','localtime'))),
	"answer_text"	varchar(500) NOT NULL,
	FOREIGN KEY("question_id") REFERENCES "question"("post_id") ON DELETE CASCADE ON UPDATE CASCADE
);
DROP TABLE IF EXISTS "question";
CREATE TABLE IF NOT EXISTS "question" (
	"post_id"	INTEGER PRIMARY KEY AUTOINCREMENT,
	"professor_id"	INTEGER NOT NULL,
	"question_text"	varchar(200),
	FOREIGN KEY("professor_id") REFERENCES "professor"("professor_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Down
