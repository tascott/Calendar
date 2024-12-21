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

    // Create users table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Create events table with user_id foreign key
    await db.exec(`
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            date TEXT NOT NULL,
            startTime TEXT NOT NULL,
            endTime TEXT NOT NULL,
            type TEXT NOT NULL,
            xPosition INTEGER DEFAULT 0,
            width INTEGER DEFAULT 50,
            backgroundColor TEXT,
            color TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
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
async function getAllEvents(userId) {
    const db = await getDb();
    return db.all('SELECT * FROM events WHERE user_id = ?', [userId]);
}

async function replaceAllEvents(userId, events) {
    const db = await getDb();
    await db.exec('BEGIN TRANSACTION');

    try {
        // Delete only the user's events
        await db.run('DELETE FROM events WHERE user_id = ?', [userId]);

        const stmt = await db.prepare(`
            INSERT INTO events (user_id, id, name, date, startTime, endTime, type, xPosition, width, backgroundColor, color)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const event of events) {
            await stmt.run(
                userId,
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

// Add user-related database operations
async function createUser(username, hashedPassword) {
    const db = await getDb();
    try {
        const result = await db.run(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword]
        );
        return result.lastID;
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT') {
            throw new Error('Username already exists');
        }
        throw error;
    }
}

async function getUser(username) {
    const db = await getDb();
    return db.get('SELECT * FROM users WHERE username = ?', [username]);
}

module.exports = {
    setupDb,
    getAllEvents,
    replaceAllEvents,
    createUser,
    getUser
};