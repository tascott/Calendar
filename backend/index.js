const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3001;

// In-memory storage for events
let events = [];

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Test endpoint
app.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});

// Get all events
app.get('/events', (req, res) => {
    res.json(events);
});

// Replace all events
app.post('/events', (req, res) => {
    const newEvents = req.body;

    // Validate input
    if (!Array.isArray(newEvents)) {
        return res.status(400).json({
            error: 'Invalid input: expected an array of events'
        });
    }

    // Replace existing events with new events
    events = newEvents;

    res.json({
        message: 'Events updated successfully',
        count: events.length
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log('Available endpoints:');
    console.log('  GET  /ping   - Test endpoint');
    console.log('  GET  /events - Get all events');
    console.log('  POST /events - Replace all events');
});