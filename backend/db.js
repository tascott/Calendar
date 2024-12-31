const {Pool} = require('pg'); // Import PostgreSQL client
let pool = null;

// Function to get or initialize the database connection pool
async function getDb() {
    if(!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false // Required for Railway's self-signed certificate
            },
            max: 20, // Maximum number of clients in the pool
            idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
            connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
            maxUses: 7500 // Close and replace a connection after it has been used 7500 times
        });

        // Add error handler to prevent connection issues from crashing the server
        pool.on('error', (err, client) => {
            console.error('Unexpected error on idle client', err);
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
                starttime TEXT NOT NULL,
                endtime TEXT NOT NULL,
                type TEXT,
                xposition REAL DEFAULT 0,
                width REAL DEFAULT 50,
                backgroundcolor TEXT,
                color TEXT,
                recurring TEXT DEFAULT 'none',
                recurringdays TEXT DEFAULT '{}',
                recurringeventid TEXT,
                overlaytext TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
            CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);

            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                priority TEXT DEFAULT 'medium',
                nudge TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                xposition REAL DEFAULT 0
            );

            CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
            CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
            CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

            CREATE TABLE IF NOT EXISTS settings (
                user_id INTEGER PRIMARY KEY,
                primarycolor TEXT DEFAULT '#2C2C2C',
                defaulteventwidth INTEGER DEFAULT 80,
                defaultstatuswidth INTEGER DEFAULT 20,
                daystarttime TEXT DEFAULT '06:00',
                dayendtime TEXT DEFAULT '22:00',
                font TEXT DEFAULT 'system-ui'
            );

            CREATE TABLE IF NOT EXISTS notes (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
            CREATE INDEX IF NOT EXISTS idx_notes_timestamp ON notes(timestamp);

            CREATE TABLE IF NOT EXISTS templates (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                name TEXT NOT NULL,
                events JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Add xposition column to tasks table if it doesn't exist
        await db.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name='tasks' AND column_name='xposition'
                ) THEN
                    ALTER TABLE tasks ADD COLUMN xposition REAL DEFAULT 0;
                END IF;
            END $$;
        `);

        // Add new settings columns if they don't exist
        await db.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name='settings' AND column_name='tasknotifications'
                ) THEN
                    ALTER TABLE settings ADD COLUMN tasknotifications BOOLEAN DEFAULT false;
                END IF;

                IF NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name='settings' AND column_name='taskavoidfocus'
                ) THEN
                    ALTER TABLE settings ADD COLUMN taskavoidfocus BOOLEAN DEFAULT false;
                END IF;
            END $$;
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

    // Handle deletion first, only need id and deleted flag
    if (event.deleted === true) {
        console.log('[DELETE] Processing delete for event:', event.id);
        const result = await db.query('DELETE FROM events WHERE id = $1 AND user_id = $2', [event.id, userId]);
        console.log('[DELETE] Event deleted:', event.id, 'Rows affected:', result.rowCount);
        return;
    }

    // For non-delete operations, validate required fields
    const {id, name, date, startTime, endTime, type, xPosition, width, backgroundColor, color, recurring, recurringDays, recurringEventId, overlayText} = event;

    if (!id || !name || !date || !startTime || !endTime) {
        console.error('[Database] Missing required fields:', { id, name, date, startTime, endTime });
        throw new Error('Missing required fields for event');
    }

    // Insert or update the event
    await db.query(
        `
        INSERT INTO events (
            user_id, id, name, date, starttime, endtime, type,
            xposition, width, backgroundcolor, color, recurring,
            recurringdays, recurringeventid, overlaytext
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO UPDATE SET
            name = $3, date = $4, starttime = $5, endtime = $6, type = $7,
            xposition = $8, width = $9, backgroundcolor = $10, color = $11,
            recurring = $12, recurringdays = $13, recurringeventid = $14, overlaytext = $15
        `,
        [
            userId, id, name, date, startTime, endTime, type,
            xPosition || 0, width || 50, backgroundColor, color,
            recurring || 'none', recurringDays || '{}', recurringEventId, overlayText
        ]
    );
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
            tasknotifications: false,
            taskavoidfocus: false
        };

        await db.query(`
            INSERT INTO settings (
                user_id, primarycolor, defaulteventwidth, defaultstatuswidth,
                daystarttime, dayendtime, font, tasknotifications, taskavoidfocus
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [userId, defaultSettings.primarycolor, defaultSettings.defaulteventwidth,
             defaultSettings.defaultstatuswidth, defaultSettings.daystarttime,
             defaultSettings.dayendtime, defaultSettings.font, defaultSettings.tasknotifications,
             defaultSettings.taskavoidfocus]
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
            font: defaultSettings.font,
            taskNotifications: defaultSettings.tasknotifications,
            taskAvoidFocus: defaultSettings.taskavoidfocus
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
        font: settings.font,
        taskNotifications: settings.tasknotifications,
        taskAvoidFocus: settings.taskavoidfocus
    };
}

// Function to save a task
async function saveTask(userId, task) {
    const db = await getDb();

    // Handle deletion first
    if (task.deleted === true) {
        console.log('[DELETE] Processing delete for task:', task.id, 'User ID:', userId);
        try {
            const result = await db.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id', [task.id, userId]);
            console.log('[DELETE] Task deletion result:', result.rows);
            if (result.rowCount === 0) {
                console.log('[DELETE] No task found to delete with id:', task.id, 'and user_id:', userId);
                throw new Error('Task not found');
            }
            console.log('[DELETE] Task successfully deleted:', task.id, 'Rows affected:', result.rowCount);
            return task.id;
        } catch (error) {
            console.error('[DELETE] Error deleting task:', error);
            throw error;
        }
    }

    const { id, title, date, time, priority, nudge, xposition } = task;
    const result = await db.query(
        `INSERT INTO tasks (id, user_id, title, date, time, priority, nudge, xposition)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
         title = $3, date = $4, time = $5, priority = $6, nudge = $7, xposition = $8
         RETURNING id`,
        [id, userId, title, date, time, priority, nudge, xposition || 0]
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
        font: settings.font,
        tasknotifications: settings.taskNotifications,
        taskavoidfocus: settings.taskAvoidFocus
    };

    const result = await db.query(`
        INSERT INTO settings (
            user_id, primarycolor, defaulteventwidth, defaultstatuswidth,
            daystarttime, dayendtime, font, tasknotifications, taskavoidfocus
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (user_id) DO UPDATE SET
            primarycolor = $2,
            defaulteventwidth = $3,
            defaultstatuswidth = $4,
            daystarttime = $5,
            dayendtime = $6,
            font = $7,
            tasknotifications = $8,
            taskavoidfocus = $9
        RETURNING *`,
        [userId, dbSettings.primarycolor, dbSettings.defaulteventwidth,
         dbSettings.defaultstatuswidth, dbSettings.daystarttime,
         dbSettings.dayendtime, dbSettings.font, dbSettings.tasknotifications,
         dbSettings.taskavoidfocus]
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
        font: updatedSettings.font,
        taskNotifications: updatedSettings.tasknotifications,
        taskAvoidFocus: updatedSettings.taskavoidfocus
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

// Function to get user notes
async function getNotes(userId) {
    const db = await getDb();
    const result = await db.query(
        'SELECT * FROM notes WHERE user_id = $1 ORDER BY timestamp DESC',
        [userId]
    );
    return result.rows;
}

// Function to save a note
async function saveNote(userId, content) {
    const db = await getDb();
    await db.query(
        'INSERT INTO notes (user_id, content) VALUES ($1, $2)',
        [userId, content]
    );
    // Return all notes after saving
    return getNotes(userId);
}

// Function to get templates for a user
async function getTemplates(userId) {
    const db = await getDb();
    const result = await db.query(
        'SELECT * FROM templates WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
    );
    return result.rows;
}

// Function to create a template
async function createTemplate(userId, name, events) {
    const db = await getDb();
    const result = await db.query(
        'INSERT INTO templates (user_id, name, events) VALUES ($1, $2, $3) RETURNING *',
        [userId, name, JSON.stringify(events)]
    );
    return result.rows[0];
}

// Function to delete a template
async function deleteTemplate(userId, templateId) {
    const db = await getDb();
    const result = await db.query(
        'DELETE FROM templates WHERE user_id = $1 AND id = $2 RETURNING id',
        [userId, templateId]
    );
    return result.rows[0];
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
    getNotes,
    saveNote,
    getTemplates,
    createTemplate,
    deleteTemplate,
};
