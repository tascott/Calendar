const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

// Database setup
async function setupDb() {
    // Open database
    const db = await open({
        filename: path.resolve(__dirname, 'events.db'),
        driver: sqlite3.Database
    });

    // Create events table if it doesn't exist
    await db.exec(`
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            date TEXT NOT NULL,
            startTime TEXT NOT NULL,
            endTime TEXT NOT NULL,
            type TEXT NOT NULL,
            xPosition INTEGER DEFAULT 0,
            width INTEGER DEFAULT 50,
            backgroundColor TEXT,
            color TEXT
        )
    `);

    return db;
}

// Get database instance
let dbInstance = null;
async function getDb() {
    if (!dbInstance) {
        dbInstance = await setupDb();
    }
    return dbInstance;
}

// Database operations
async function getAllEvents() {
    const db = await getDb();
    return db.all('SELECT * FROM events');
}

async function replaceAllEvents(events) {
    const db = await getDb();

    // Start transaction
    await db.exec('BEGIN TRANSACTION');

    try {
        // Clear existing events
        await db.run('DELETE FROM events');

        // Insert new events
        const stmt = await db.prepare(`
            INSERT INTO events (id, name, date, startTime, endTime, type, xPosition, width, backgroundColor, color)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const event of events) {
            await stmt.run(
                event.id,
                event.name,
                event.date,
                event.startTime,
                event.endTime,
                event.type,
                event.xPosition !== undefined ? event.xPosition : 0,
                event.width !== undefined ? event.width : 50,
                event.backgroundColor,
                event.color
            );
        }

        await stmt.finalize();
        await db.exec('COMMIT');

        return true;
    } catch (error) {
        await db.exec('ROLLBACK');
        throw error;
    }
}

module.exports = {
    setupDb,
    getAllEvents,
    replaceAllEvents
};