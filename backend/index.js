const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { setupDb, getAllEvents, replaceAllEvents } = require('./db');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize database
setupDb().catch(console.error);

// Test endpoint
app.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});

// Get all events
app.get('/events', async (req, res) => {
    try {
        const events = await getAllEvents();
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Replace all events
app.post('/events', async (req, res) => {
    const newEvents = req.body;

    // Validate input
    if (!Array.isArray(newEvents)) {
        return res.status(400).json({
            error: 'Invalid input: expected an array of events'
        });
    }

    try {
        await replaceAllEvents(newEvents);
        // Return the actual events from the database
        const savedEvents = await getAllEvents();
        res.json(savedEvents);
    } catch (error) {
        console.error('Error saving events:', error);
        res.status(500).json({ error: 'Failed to save events' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log('Available endpoints:');
    console.log('  GET  /ping   - Test endpoint');
    console.log('  GET  /events - Get all events');
    console.log('  POST /events - Replace all events');
});