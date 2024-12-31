require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const compression = require('compression');
const { setupDb, getAllEvents, replaceAllEvents, createUser, getUser, getSettings, updateSettings, updateEvent, getDb, saveEvent, saveTask, getUserTasks, getNotes, saveNote } = require('./db');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(compression());
app.use(bodyParser.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../build')));

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Initialize database
setupDb().catch(console.error);

// API Routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = await createUser(username, hashedPassword);
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        if (error.message === 'Username already exists') {
            res.status(409).json({ error: error.message });
        } else {
            console.error('Error creating user:', error);
            res.status(500).json({ error: 'Failed to create user' });
        }
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await getUser(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
            expiresIn: '24h'
        });
        res.json({ token });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Failed to log in' });
    }
});

app.get('/api/events', authenticateToken, async (req, res) => {
    try {
        const events = await getAllEvents(req.user.id);
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

app.post('/api/events', authenticateToken, async (req, res) => {
    const newEvents = req.body;
    if (!Array.isArray(newEvents)) {
        return res.status(400).json({
            error: 'Invalid input: expected an array of events'
        });
    }

    try {
        const db = await getDb();
        await db.query('BEGIN');
        try {
            for (const event of newEvents) {
                await saveEvent(req.user.id, event);
            }
            await db.query('COMMIT');
            const savedEvents = await getAllEvents(req.user.id);
            res.json(savedEvents);
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error saving events:', error);
        res.status(500).json({ error: 'Failed to save events' });
    }
});

app.get('/api/settings', authenticateToken, async (req, res) => {
    try {
        const settings = await getSettings(req.user.id);
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

app.post('/api/settings', authenticateToken, async (req, res) => {
    try {
        const settings = await updateSettings(req.user.id, req.body);
        res.json(settings);
    } catch (error) {
        console.error('Error saving settings:', error);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const taskId = await saveTask(req.user.id, req.body);
        if (req.body.deleted) {
            res.json({ success: true, deleted: req.body.id });
        } else {
            // Just return the updated task
            const task = await db.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
            res.json(task.rows[0]);
        }
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const tasks = await getUserTasks(req.user.id);
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Get user settings
app.get('/api/settings', authenticateToken, async (req, res) => {
    try {
        const settings = await getSettings(req.user.id);
        res.json(settings);
    } catch (error) {
        console.error('Error getting settings:', error);
        res.status(500).json({ error: 'Failed to get settings' });
    }
});

// Get user notes
app.get('/api/notes', authenticateToken, async (req, res) => {
    try {
        const notes = await getNotes(req.user.id);
        res.json(notes);
    } catch (error) {
        console.error('Error getting notes:', error);
        res.status(500).json({ error: 'Failed to get notes' });
    }
});

// Save a note
app.post('/api/notes', authenticateToken, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'Note content is required' });
        }
        const notes = await saveNote(req.user.id, content);
        res.json(notes);
    } catch (error) {
        console.error('Error saving note:', error);
        res.status(500).json({ error: 'Failed to save note' });
    }
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});