const {Pool} = require('pg'); // Import PostgreSQL client
let pool = null;

// Function to get or initialize the database connection pool
async function getDb() {
    if(!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL, // Use the Railway PostgreSQL connection string
        });
    }
    return pool;
}

// Function to setup the database (tables, etc.)
async function setupDb() {
    const db = await getDb();
    try {
        // Check and create tables if they don't exist
        await db.query(`
            CREATE TABLE IF NOT EXISTS events (
                user_id INTEGER NOT NULL,
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                date TEXT NOT NULL,
                startTime TEXT NOT NULL,
                endTime TEXT NOT NULL,
                type TEXT,
                xPosition REAL DEFAULT 0,
                width REAL DEFAULT 50,
                backgroundColor TEXT,
                color TEXT,
                recurring TEXT DEFAULT 'none',
                recurringDays TEXT DEFAULT '{}',
                recurringEventId TEXT,
                overlayText TEXT
            );

            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                priority TEXT DEFAULT 'medium',
                nudge TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS settings (
                user_id INTEGER PRIMARY KEY,
                primaryColor TEXT DEFAULT '#2C2C2C',
                defaultEventWidth INTEGER DEFAULT 80,
                defaultStatusWidth INTEGER DEFAULT 20,
                dayStartTime TEXT DEFAULT '06:00',
                dayEndTime TEXT DEFAULT '22:00',
                font TEXT DEFAULT 'system-ui'
            );
        `);
        console.log('[Database] Tables verified/created');
    } catch(error) {
        console.error('[Database] Setup error:',error);
        throw error;
    }
}

// Example function to get all events for a user
async function getAllEvents(userId) {
    const db = await getDb();
    const result = await db.query('SELECT * FROM events WHERE user_id = $1',[userId]);
    return result.rows;
}

// Example function to save an event
async function saveEvent(userId,event) {
    const db = await getDb();
    const {id,name,date,startTime,endTime,type,xPosition,width,backgroundColor,color,recurring,recurringDays,recurringEventId,overlayText} = event;

    // Insert or update the event
    await db.query(
        `
        INSERT INTO events (
            user_id, id, name, date, startTime, endTime, type,
            xPosition, width, backgroundColor, color, recurring,
            recurringDays, recurringEventId, overlayText
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO UPDATE SET
            name = $3, date = $4, startTime = $5, endTime = $6, type = $7,
            xPosition = $8, width = $9, backgroundColor = $10, color = $11,
            recurring = $12, recurringDays = $13, recurringEventId = $14, overlayText = $15
        `,
        [
            userId,id,name,date,startTime,endTime,type,
            xPosition || 0,width || 50,backgroundColor,color,
            recurring || 'none',recurringDays || '{}',recurringEventId,overlayText
        ]
    );
    console.log(`[Database] Event ${id} saved/updated`);
}

// Function to create a user
async function createUser(username,hashedPassword) {
    const db = await getDb();
    const result = await db.query(
        'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
        [username,hashedPassword]
    );
    return result.rows[0].id;
}

// Function to fetch a user
async function getUser(username) {
    const db = await getDb();
    const result = await db.query('SELECT * FROM users WHERE username = $1',[username]);
    return result.rows[0];
}

// Function to get user settings
async function getSettings(userId) {
    const db = await getDb();
    const result = await db.query('SELECT * FROM settings WHERE user_id = $1',[userId]);
    if(!result.rows.length) {
        // Insert default settings if none exist
        await db.query(`
            INSERT INTO settings (user_id, primaryColor, defaultEventWidth, defaultStatusWidth, dayStartTime, dayEndTime, font)
            VALUES ($1, '#2C2C2C', 80, 20, '06:00', '22:00', 'system-ui')`,
            [userId]
        );
        return {
            user_id: userId,
            primaryColor: '#2C2C2C',
            defaultEventWidth: 80,
            defaultStatusWidth: 20,
            dayStartTime: '06:00',
            dayEndTime: '22:00',
            font: 'system-ui',
        };
    }
    return result.rows[0];
}

module.exports = {
    setupDb,
    getAllEvents,
    saveEvent,
    createUser,
    getUser,
    getSettings,
};
