var express = require("express");
const session = require("express-session");
const bodyParser = require('body-parser');
var app = express();

app.use(express.static("static"));
app.use(express.static("static/html"));

app.use(session({
	secret: "SessionKEY",
	resave: false,
	saveUninitialized: false
}));

const path = require('path');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug')

var mysql = require("mysql2");
var connection = mysql.createConnection({
host: "localhost",
user: "C4131S25S02U36",
password: "Yr6764zh!",
database: "C4131S25S02U36",
port: 3306
});

const port = 4131

connection.connect(function(err) {
    if (err) {
      throw err;
    };
    console.log("Connected to MYSQL Database!");
});

const bcrypt = require("bcrypt"); 
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.get("/login", (req, res) => {
	if (req.session.user) return res.redirect("/tasks");
	res.render("login");
});

app.post("/login", (req, res) => {
	const {username, password} = req.body;

	const query = "SELECT * FROM users WHERE username = ?";
	connection.query(query, [username], async (err, results) => {
		if (err) {
			console.error("Login query error:", err);
			return res.status(500).json({ status: "fail" });
		}

		if (results.length === 0) {
			return res.json({ status: "fail" }); // no user found
		}

		const user = results[0];
		const passwordMatch = await bcrypt.compare(password, user.password);

		if (passwordMatch) {
			req.session.user = username;
			return res.json({ status: "success" });
		} else {
			return res.json({ status: "fail" });
		}
	});
});

app.get("/logout", (req, res) => {
	req.session.destroy(() => {
		res.redirect("/login");
	});
});

app.get("/register", (req, res) => {
	if (req.session.user) 
        return res.redirect("/tasks");
	res.render("register");
});

app.post("/register", async (req, res) => {
	const { username, password } = req.body;
	if (!username || !password) 
        return res.json({ status: "fail" });

	// Check if user already exists
	connection.query("SELECT * FROM users WHERE username = ?", [username], async (err, results) => {
		if (err) return res.status(500).json({ status: "fail" });

		if (results.length > 0) {
			return res.json({ status: "fail" }); // Username taken
		}

		const hashed = await bcrypt.hash(password, 10);

		connection.query("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashed], (err2) => {
			if (err2) {
				console.error("Insert failed:", err2);
				return res.status(500).json({ status: "fail" });
			}

			req.session.user = username; // auto-login
			res.json({ status: "success" });
		});
	});
});

app.get("/delete-account", (req, res) => {
	res.render("delete");
});

app.post("/delete-account", (req, res) => {
	if (!req.session.user) return res.redirect("/login");

	const username = req.session.user;

	// Delete user's list items
	connection.query("DELETE FROM todos WHERE username = ?", [username], (err1) => {
		if (err1) {
			console.error("Failed to delete todos:", err1);
			return res.status(500).send("Error deleting tasks.");
		}

		// Delete the user
		connection.query("DELETE FROM users WHERE username = ?", [username], (err2) => {
			if (err2) {
				console.error("Failed to delete user:", err2);
				return res.status(500).send("Error deleting user.");
			}

			// Destroy the session and redirect to login
			req.session.destroy(() => {
				res.redirect("/login");
			});
		});
	});
});

app.get("/tasks", (req, res) => {
	if (!req.session.user) return res.redirect("/login");

	const status = req.query.status;
	const sort = req.query.sort;
	const overdue = req.query.overdue;
	const username = req.session.user;

	const params = [username];
	let query = "SELECT * FROM todos WHERE username = ?";
	const conditions = [];

	if (status === "done" || status === "in progress") { // Status Filter
		conditions.push("status = ?");
		params.push(status);
	}

	if (overdue === "true") { // Overdue Filter
        conditions.push("deadline < CURDATE()");
        conditions.push("status = 'in progress'");
    }

	if (conditions.length > 0) {
		query += " AND " + conditions.join(" AND ");
	}

	if (sort === "deadline_desc") { // Sort by Deadline
		query += " ORDER BY deadline DESC";
	} else if (sort === "deadline_asc") {
		query += " ORDER BY deadline ASC";
	}

	connection.query(query, params, (err, results) => {
		if (err) return res.status(500).send("Database error.");
		res.render("index", { todos: results, status, sort, overdue });
	});
});

app.patch("/update-status/:id", (req, res) => {
	if (!req.session.user) 
        return res.status(403).send("Not authorized");

	const { status } = req.body;
	const id = req.params.id;
	const username = req.session.user;

	const sql = "UPDATE todos SET status = ? WHERE id = ? AND username = ?";
	connection.query(sql, [status, id, username], (err) => {
		if (err) {
			console.error("Failed to update status:", err);
			return res.status(500).send("Database error.");
		}
		res.sendStatus(200);
	});
});

  app.post("/add", (req, res) => {
	if (!req.session.user) 
        return res.status(403).send("Not authorized");

	const { title, deadline } = req.body;
	const status = "in progress";
	const username = req.session.user;

	const sql = "INSERT INTO todos (title, deadline, status, username) VALUES (?, ?, ?, ?)";
	connection.query(sql, [title, deadline || null, status, username], (err) => {
		if (err) {
			console.error("Failed to add task:", err);
			return res.status(500).send("Database error.");
		}
		res.redirect("/tasks");
	});
});


app.delete("/delete/:id", (req, res) => {
	if (!req.session.user) 
        return res.status(403).send("Not authorized");

	const id = req.params.id;
	const username = req.session.user;

	const sql = "DELETE FROM todos WHERE id = ? AND username = ?";
	connection.query(sql, [id, username], (err) => {
		if (err) {
			console.error("Failed to delete task:", err);
			return res.status(500).send("Database error.");
		}
		res.sendStatus(200);
	});
});

app.use((req, res, next) => {
    res.status(404).send('Route Not Found.');
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
