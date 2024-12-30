const {Pool} = require('pg'); // Import PostgreSQL client
let pool = null;

// Function to get or initialize the database connection pool
async function getDb() {
    if(!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false // Required for Railway's self-signed certificate
            }
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

            DROP TABLE IF EXISTS settings;
            CREATE TABLE settings (
                user_id INTEGER PRIMARY KEY,
                primarycolor TEXT DEFAULT '#2C2C2C',
                defaulteventwidth INTEGER DEFAULT 80,
                defaultstatuswidth INTEGER DEFAULT 20,
                daystarttime TEXT DEFAULT '06:00',
                dayendtime TEXT DEFAULT '22:00',
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
async function saveEvent(userId, event) {
    const db = await getDb();
    const {id, name, date, startTime, endTime, type, xPosition, width, backgroundColor, color, recurring, recurringDays, recurringEventId, overlayText} = event;

    // Log event data for debugging
    console.log('[Database] Saving event:', {
        id, name, date, startTime, endTime, type,
        xPosition, width, backgroundColor, color,
        recurring, recurringDays, recurringEventId
    });

    // Validate required fields
    if (!id || !name || !date || !startTime || !endTime) {
        console.error('[Database] Missing required fields:', { id, name, date, startTime, endTime });
        throw new Error('Missing required fields for event');
    }

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
            userId, id, name, date, startTime, endTime, type,
            xPosition || 0, width || 50, backgroundColor, color,
            recurring || 'none', recurringDays || '{}', recurringEventId, overlayText
        ]
    );
    console.log(`[Database] Event ${id} saved/updated successfully`);
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
    console.log('[Database] Getting settings for user:', userId);
    const result = await db.query('SELECT * FROM settings WHERE user_id = $1', [userId]);
    console.log('[Database] Settings query result:', result.rows);

    if (!result.rows.length) {
        console.log('[Database] No settings found, creating defaults');
        // Insert default settings if none exist
        const defaultSettings = {
            user_id: userId,
            primarycolor: '#2C2C2C',
            defaulteventwidth: 80,
            defaultstatuswidth: 20,
            daystarttime: '06:00',
            dayendtime: '22:00',
            font: 'system-ui',
        };

        await db.query(`
            INSERT INTO settings (
                user_id, primarycolor, defaulteventwidth, defaultstatuswidth,
                daystarttime, dayendtime, font
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [userId, defaultSettings.primarycolor, defaultSettings.defaulteventwidth,
             defaultSettings.defaultstatuswidth, defaultSettings.daystarttime,
             defaultSettings.dayendtime, defaultSettings.font]
        );
        console.log('[Database] Created default settings:', defaultSettings);

        // Convert to camelCase before returning
        return {
            user_id: defaultSettings.user_id,
            primaryColor: defaultSettings.primarycolor,
            defaultEventWidth: defaultSettings.defaulteventwidth,
            defaultStatusWidth: defaultSettings.defaultstatuswidth,
            dayStartTime: defaultSettings.daystarttime,
            dayEndTime: defaultSettings.dayendtime,
            font: defaultSettings.font
        };
    }

    // Convert to camelCase before returning
    const settings = result.rows[0];
    return {
        user_id: settings.user_id,
        primaryColor: settings.primarycolor,
        defaultEventWidth: settings.defaulteventwidth,
        defaultStatusWidth: settings.defaultstatuswidth,
        dayStartTime: settings.daystarttime,
        dayEndTime: settings.dayendtime,
        font: settings.font
    };
}

// Function to save a task
async function saveTask(userId, task) {
    const db = await getDb();
    const { id, title, date, time, priority, nudge } = task;
    const result = await db.query(
        `INSERT INTO tasks (id, user_id, title, date, time, priority, nudge)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
         title = $3, date = $4, time = $5, priority = $6, nudge = $7
         RETURNING id`,
        [id, userId, title, date, time, priority || 'medium', nudge]
    );
    return result.rows[0].id;
}

// Function to get user tasks
async function getUserTasks(userId) {
    const db = await getDb();
    const result = await db.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return result.rows;
}

// Function to update user settings
async function updateSettings(userId, settings) {
    const db = await getDb();
    console.log('[Database] Updating settings for user:', userId);
    console.log('[Database] New settings:', settings);

    // Convert from camelCase to lowercase for database
    const dbSettings = {
        primarycolor: settings.primaryColor,
        defaulteventwidth: settings.defaultEventWidth,
        defaultstatuswidth: settings.defaultStatusWidth,
        daystarttime: settings.dayStartTime,
        dayendtime: settings.dayEndTime,
        font: settings.font
    };

    const result = await db.query(`
        INSERT INTO settings (
            user_id, primarycolor, defaulteventwidth, defaultstatuswidth,
            daystarttime, dayendtime, font
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id) DO UPDATE SET
            primarycolor = $2,
            defaulteventwidth = $3,
            defaultstatuswidth = $4,
            daystarttime = $5,
            dayendtime = $6,
            font = $7
        RETURNING *`,
        [userId, dbSettings.primarycolor, dbSettings.defaulteventwidth,
         dbSettings.defaultstatuswidth, dbSettings.daystarttime,
         dbSettings.dayendtime, dbSettings.font]
    );

    console.log('[Database] Settings update result:', result.rows[0]);

    // Convert to camelCase before returning
    const updatedSettings = result.rows[0];
    return {
        user_id: updatedSettings.user_id,
        primaryColor: updatedSettings.primarycolor,
        defaultEventWidth: updatedSettings.defaulteventwidth,
        defaultStatusWidth: updatedSettings.defaultstatuswidth,
        dayStartTime: updatedSettings.daystarttime,
        dayEndTime: updatedSettings.dayendtime,
        font: updatedSettings.font
    };
}

// Function to replace all events for a user
async function replaceAllEvents(userId, events) {
    const db = await getDb();
    await db.query('BEGIN');
    try {
        // Delete all existing events for the user
        await db.query('DELETE FROM events WHERE user_id = $1', [userId]);

        // Insert all new events
        for (const event of events) {
            await saveEvent(userId, event);
        }

        await db.query('COMMIT');
        return await getAllEvents(userId);
    } catch (error) {
        await db.query('ROLLBACK');
        throw error;
    }
}

// Function to update a specific event
async function updateEvent(userId, eventId, updates) {
    const db = await getDb();
    const event = await db.query('SELECT * FROM events WHERE user_id = $1 AND id = $2', [userId, eventId]);
    if (!event.rows.length) {
        throw new Error('Event not found');
    }

    // Merge existing event with updates
    const updatedEvent = { ...event.rows[0], ...updates };
    await saveEvent(userId, updatedEvent);
    return updatedEvent;
}

module.exports = {
    setupDb,
    getAllEvents,
    saveEvent,
    createUser,
    getUser,
    getSettings,
    saveTask,
    getUserTasks,
    getDb,
    updateSettings,
    replaceAllEvents,
    updateEvent,
};
