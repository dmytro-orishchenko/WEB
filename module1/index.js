const express = require('express');
const app = express();

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.use(express.json())

const port = 5432;
const secret = 'secret_key';

const username = 'JoCor';
const firstname = 'Dmytro';
const lastname = 'Oryshchenko';
const password = '1111';

const db = new sqlite3.Database('db.sqlite', (err) => {
  if (err) {
    console.error(err.message);
    throw err;
  }
  console.log('Connected to the SQLite database.');
});

db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, firstname TEXT NOT NULL, lastname TEXT NOT NULL, password TEXT NOT NULL)');
});

const checkUserQuery = `
  SELECT * FROM students
  WHERE username = ?
`;
db.get(checkUserQuery, [username], (err, user) => {
  if (err) {
    console.error(err);
  } else if (user) {
    console.log(`User with username ${username} already exists`);
  } else {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        console.error('Could not hash password', err);
      } else {
        const query = `
          INSERT INTO students (username, firstname, lastname, password)
          VALUES (?, ?, ?, ?)
        `;
        const values = [username, firstname, lastname, hash];
        db.run(query, values, (err, res) => {
          if (err) {
            console.error('Could not add student', err);
          } else {
            console.log('Student added');
          }
        });
      }
    });
  }
});

app.get('/students', async (req, res) => {
  try {
    const query = `
      SELECT * FROM studentsz
    `;
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error(err);
        res.status(500).send('Server error');
      }
      const students = rows;
      res.json(students);
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

app.get('/login/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const query = `
      SELECT * FROM students
      WHERE username = ?
    `;
    db.get(query, [username], async (err, user) => {
      if (err) {
        console.error(err);
        res.status(500).send('Server error');
      }

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id }, secret);

      res.json({ user, token });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }


});
