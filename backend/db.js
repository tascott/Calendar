const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

// Database setup
async function setupDb() {
    const dbPath = path.resolve(__dirname, 'events.db');
    console.log('[Database] Opening database at:', dbPath);

    // Open database
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });
    console.log('[Database] Successfully opened database');

    // Create users table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('[Database] Users table ready');

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
    console.log('[Database] Events table ready');

    // Add recurring columns if they don't exist
    try {
        await db.exec(`
            ALTER TABLE events ADD COLUMN recurring TEXT DEFAULT 'none';
            ALTER TABLE events ADD COLUMN recurringDays TEXT DEFAULT '{}';
        `);
        console.log('[Database] Added recurring columns to events table');
    } catch (error) {
        // Columns might already exist, which is fine
        console.log('[Database] Recurring columns already exist or error:', error.message);
    }

    // Create settings table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
            user_id INTEGER PRIMARY KEY,
            primaryColor TEXT DEFAULT '#2C2C2C',
            defaultEventWidth INTEGER DEFAULT 80,
            defaultStatusWidth INTEGER DEFAULT 20,
            dayStartTime TEXT DEFAULT '06:00',
            dayEndTime TEXT DEFAULT '22:00',
            font TEXT DEFAULT 'system-ui',
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);
    console.log('[Database] Settings table ready');

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

// Helper function to generate recurring event instances
function generateRecurringInstances(event, startDate, endDate) {
    console.log('[Recurring] Event:', {
        id: event.id,
        name: event.name,
        recurring: event.recurring,
        recurringDays: event.recurringDays
    });

    // If recurring is undefined, null, false, or 'none', return original event without isRecurring flag
    if (!event.recurring || event.recurring === 'none' || event.recurring === false) {
        console.log('[Recurring] Not a recurring event');
        const nonRecurringEvent = {
            ...event,
            isRecurring: false,
            recurring: 'none',
            recurringDays: '{}'
        };
        console.log('[Recurring] Returning non-recurring event:', {
            id: nonRecurringEvent.id,
            isRecurring: nonRecurringEvent.isRecurring,
            recurring: nonRecurringEvent.recurring
        });
        return [nonRecurringEvent];
    }

    const instances = [];
    let recurringDays;
    try {
        // Handle both string and object formats
        if (typeof event.recurringDays === 'string') {
            try {
                recurringDays = JSON.parse(event.recurringDays);
            } catch (e) {
                console.log('[Recurring] Failed to parse recurringDays string:', event.recurringDays);
                recurringDays = {};
            }
        } else {
            recurringDays = event.recurringDays || {};
        }

        console.log('[Recurring] Parsed recurring days:', recurringDays);
    } catch (error) {
        console.log('[Recurring] Error parsing recurringDays, treating as non-recurring');
        return [{
            ...event,
            isRecurring: false,
            recurring: 'none',
            recurringDays: '{}'
        }];
    }

    // If no days selected for daily recurring, return as non-recurring
    if (event.recurring === 'daily' && Object.values(recurringDays).every(day => !day)) {
        console.log('[Recurring] Daily event with no days selected, treating as non-recurring');
        return [{
            ...event,
            isRecurring: false,
            recurring: 'none',
            recurringDays: '{}'
        }];
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const eventDate = new Date(event.date);

    // Generate instances for 3 months from the event date
    const maxDate = new Date(eventDate);
    maxDate.setMonth(maxDate.getMonth() + 3);

    // Don't generate instances beyond the max date
    if (end > maxDate) {
        end.setTime(maxDate.getTime());
    }

    let currentDate = new Date(Math.max(start.getTime(), eventDate.getTime()));

    while (currentDate <= end) {
        let shouldAdd = false;
        let reason = '';

        if (event.recurring === 'daily') {
            const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            shouldAdd = recurringDays[dayName] === true;
            reason = `daily - ${dayName}`;
        } else if (event.recurring === 'weekly') {
            shouldAdd = currentDate.getDay() === eventDate.getDay();
            reason = `weekly - day ${currentDate.getDay()}`;
        } else if (event.recurring === 'monthly') {
            shouldAdd = currentDate.getDate() === eventDate.getDate();
            reason = `monthly - date ${currentDate.getDate()}`;
        }

        if (shouldAdd) {
            instances.push({
                ...event,
                date: currentDate.toISOString().split('T')[0],
                isRecurring: true,
                originalDate: event.date
            });
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log('[Recurring] Generated', instances.length, 'instances');
    return instances;
}

// Database operations
async function getAllEvents(userId) {
    console.log('[Database] Fetching events for user:', userId);
    const db = await getDb();
    const events = await db.all('SELECT * FROM events WHERE user_id = ?', [userId]);
    console.log('[Database] Raw events from database:', JSON.stringify(events, null, 2));

    if (events.length === 0) {
        console.log('[Database] No events found for user');
        return [];
    }

    // Log the first event as a sample
    console.log('[Database] Sample event structure:', {
        id: events[0].id,
        name: events[0].name,
        date: events[0].date,
        type: events[0].type,
        recurring: events[0].recurring,
        recurringDays: events[0].recurringDays
    });

    // Calculate date range (current month +/- 1 month)
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);

    console.log('[Database] Date range:', {
        today: today.toISOString(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
    });

    // Process each event
    const allInstances = [];
    for (const event of events) {
        try {
            console.log(`[Database] Processing event ${event.id}:`, {
                name: event.name,
                date: event.date,
                recurring: event.recurring,
                recurringDays: event.recurringDays
            });

            const instances = generateRecurringInstances(event, startDate, endDate);
            console.log(`[Database] Event ${event.id} generated ${instances.length} instances`);
            allInstances.push(...instances);
        } catch (error) {
            console.error(`[Database] Error processing event ${event.id}:`, error);
            // If there's an error processing a recurring event, include the original
            allInstances.push(event);
        }
    }

    console.log('[Database] Total events being returned:', allInstances.length);
    return allInstances;
}

async function replaceAllEvents(userId, events) {
    const db = await getDb();
    await db.exec('BEGIN TRANSACTION');

    try {
        await db.run('DELETE FROM events WHERE user_id = ?', [userId]);

        const stmt = await db.prepare(`
            INSERT INTO events (
                user_id, id, name, date, startTime, endTime, type,
                xPosition, width, backgroundColor, color, recurring, recurringDays
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const event of events) {
            // Ensure proper defaults for recurring fields
            const recurring = event.recurring === true ? 'daily' : (event.recurring || 'none');

            // Handle recurringDays properly
            let recurringDays;
            if (typeof event.recurringDays === 'string') {
                try {
                    // If it's already a JSON string, use it as is
                    JSON.parse(event.recurringDays);
                    recurringDays = event.recurringDays;
                } catch (e) {
                    // If it's not valid JSON, stringify it
                    recurringDays = JSON.stringify(event.recurringDays || {});
                }
            } else {
                // If it's an object, stringify it
                recurringDays = JSON.stringify(event.recurringDays || {});
            }

            console.log('[Recurring] Saving event:', {
                id: event.id,
                name: event.name,
                recurring,
                recurringDays
            });

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
                event.color,
                recurring,
                recurringDays
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
        await db.exec('BEGIN TRANSACTION');

        // Create user
        const result = await db.run(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword]
        );
        const userId = result.lastID;

        // Initialize default settings for the new user
        await db.run(`
            INSERT INTO settings (
                user_id, primaryColor, defaultEventWidth, defaultStatusWidth,
                dayStartTime, dayEndTime, font
            ) VALUES (?, '#2C2C2C', 80, 20, '06:00', '22:00', 'system-ui')
        `, [userId]);

        await db.exec('COMMIT');
        return userId;
    } catch (error) {
        await db.exec('ROLLBACK');
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

// Add settings-related database operations
async function getSettings(userId) {
    const db = await getDb();
    const settings = await db.get('SELECT * FROM settings WHERE user_id = ?', [userId]);
    if (!settings) {
        // Insert default settings if none exist
        await db.run(`
            INSERT INTO settings (
                user_id, primaryColor, defaultEventWidth, defaultStatusWidth,
                dayStartTime, dayEndTime, font
            ) VALUES (?, '#2C2C2C', 80, 20, '06:00', '22:00', 'system-ui')
        `, [userId]);
        return {
            primaryColor: '#2C2C2C',
            defaultEventWidth: 80,
            defaultStatusWidth: 20,
            dayStartTime: '06:00',
            dayEndTime: '22:00',
            font: 'system-ui'
        };
    }
    return settings;
}

async function updateSettings(userId, settings) {
    const db = await getDb();
    await db.run(`
        INSERT OR REPLACE INTO settings (
            user_id, primaryColor, defaultEventWidth, defaultStatusWidth,
            dayStartTime, dayEndTime, font
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
        userId,
        settings.primaryColor,
        settings.defaultEventWidth,
        settings.defaultStatusWidth,
        settings.dayStartTime,
        settings.dayEndTime,
        settings.font
    ]);
    return settings;
}

module.exports = {
    setupDb,
    getAllEvents,
    replaceAllEvents,
    createUser,
    getUser,
    getSettings,
    updateSettings
};