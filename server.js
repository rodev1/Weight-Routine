const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const SECRET_KEY = 'muscle-cheat-super-secret-key';
const db = new sqlite3.Database('./database.sqlite');

// Initialize DB
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS routines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        goal TEXT,
        routine_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);
});

// Middleware for authentication
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Signup Endpoint
app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: '아이디와 비밀번호를 입력해주세요.' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) return res.status(400).json({ error: '이미 존재하는 아이디입니다.' });
                return res.status(500).json({ error: '서버 오류' });
            }
            res.status(201).json({ message: '회원가입 완료!' });
        });
    } catch (e) {
        res.status(500).json({ error: '서버 오류' });
    }
});

// Login Endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: '아이디 또는 비밀번호가 틀렸습니다.' });
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: '아이디 또는 비밀번호가 틀렸습니다.' });

        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '7d' });
        res.json({ token, username: user.username });
    });
});

// Save Routine
app.post('/api/routines', authenticateToken, (req, res) => {
    const { goal, routine_data } = req.body;
    const userId = req.user.id;

    db.run('INSERT INTO routines (user_id, goal, routine_data) VALUES (?, ?, ?)', [userId, goal, JSON.stringify(routine_data)], function(err) {
        if (err) return res.status(500).json({ error: '저장 실패' });
        res.status(201).json({ message: '루틴이 안전하게 저장되었습니다!', id: this.lastID });
    });
});

// Get User Routines
app.get('/api/routines', authenticateToken, (req, res) => {
    const userId = req.user.id;
    db.all('SELECT * FROM routines WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: '불러오기 실패' });
        res.json(rows.map(row => ({
            id: row.id,
            goal: row.goal,
            created_at: row.created_at,
            routine_data: JSON.parse(row.routine_data)
        })));
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
