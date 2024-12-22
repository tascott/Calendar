const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { setupDb, getAllEvents, replaceAllEvents, createUser, getUser, getSettings, updateSettings, updateEvent, getDb, saveEvent } = require('./db');

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // In production, use environment variable

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

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

// Authentication endpoints
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
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

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Get user
        const user = await getUser(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate token
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
            expiresIn: '24h'
        });

        res.json({ token });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Failed to log in' });
    }
});

// Protected event endpoints
app.get('/events', authenticateToken, async (req, res) => {
    try {
        console.log('[Backend] Getting events for user:', req.user.id);
        const events = await getAllEvents(req.user.id);
        console.log('[Backend] Raw events from database:', events);
        console.log('[Backend] Sending events to frontend, count:', events.length);
        res.json(events);
    } catch (error) {
        console.error('[Backend] Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

app.post('/events', authenticateToken, async (req, res) => {
    const newEvents = req.body;
    console.log('[Backend] Received events to save:', newEvents);

    if (!Array.isArray(newEvents)) {
        console.log('[Backend] Invalid input: not an array');
        return res.status(400).json({
            error: 'Invalid input: expected an array of events'
        });
    }

    try {
        console.log('[Backend] Saving events for user:', req.user.id);
        const db = await getDb();

        // Start a transaction for multiple updates
        await db.exec('BEGIN TRANSACTION');

        try {
            for (const event of newEvents) {
                await saveEvent(req.user.id, event);
            }

            // Commit the transaction
            await db.exec('COMMIT');

            // Fetch and return updated events
            const savedEvents = await getAllEvents(req.user.id);
            console.log('[Backend] Events saved and retrieved:', savedEvents.length);
            res.json(savedEvents);
        } catch (error) {
            // Rollback on error
            await db.exec('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('[Backend] Error saving events:', error);
        res.status(500).json({ error: 'Failed to save events' });
    }
});

// Protected settings endpoints
app.get('/settings', authenticateToken, async (req, res) => {
    try {
        console.log('[Backend] Getting settings for user:', req.user.id);
        const settings = await getSettings(req.user.id);
        console.log('[Backend] Settings retrieved:', settings);
        res.json(settings);
    } catch (error) {
        console.error('[Backend] Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

app.post('/settings', authenticateToken, async (req, res) => {
    try {
        console.log('[Backend] Saving settings for user:', req.user.id);
        console.log('[Backend] New settings:', req.body);
        const settings = await updateSettings(req.user.id, req.body);
        console.log('[Backend] Settings saved:', settings);
        res.json(settings);
    } catch (error) {
        console.error('[Backend] Error saving settings:', error);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});