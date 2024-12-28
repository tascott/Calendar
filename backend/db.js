const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
let db = null;

async function getDb() {
    if (db) return db;

    db = await open({
        filename: 'calendar.db',
        driver: sqlite3.Database
    });
    return db;
}

async function setupDb() {
    const db = await getDb();

    try {
        // Check if the events table exists
        const tableExists = await db.get(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='events'"
        );

        if (!tableExists) {
            // Create events table if it doesn't exist
            await db.exec(`
                CREATE TABLE events (
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
                )
            `);
            console.log('[Database] Events table created');
        } else {
            // Check if overlayText column exists
            const columnExists = await db.get(
                "SELECT * FROM pragma_table_info('events') WHERE name='overlayText'"
            );

            if (!columnExists) {
                // Add overlayText column if it doesn't exist
                await db.exec('ALTER TABLE events ADD COLUMN overlayText TEXT');
                console.log('[Database] Added overlayText column to events table');
            }
        }

        // Check if tasks table exists
        const tasksTableExists = await db.get(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='tasks'"
        );

        if (!tasksTableExists) {
            await db.exec(`
                CREATE TABLE tasks (
                    id TEXT PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    date TEXT NOT NULL,
                    time TEXT NOT NULL,
                    priority TEXT DEFAULT 'medium',
                    nudge TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('[Database] Tasks table created');
        }

        // Check if users table exists
        const usersTableExists = await db.get(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
        );

        if (!usersTableExists) {
            await db.exec(`
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL
                )
            `);
            console.log('[Database] Users table created');
        }

        // Check if settings table exists
        const settingsTableExists = await db.get(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='settings'"
        );

        if (!settingsTableExists) {
            await db.exec(`
                CREATE TABLE settings (
                    user_id INTEGER PRIMARY KEY,
                    primaryColor TEXT DEFAULT '#2C2C2C',
                    defaultEventWidth INTEGER DEFAULT 80,
                    defaultStatusWidth INTEGER DEFAULT 20,
                    dayStartTime TEXT DEFAULT '06:00',
                    dayEndTime TEXT DEFAULT '22:00',
                    font TEXT DEFAULT 'system-ui'
                )
            `);
            console.log('[Database] Settings table created');
        }

        console.log('[Database] Database setup completed successfully');
    } catch (error) {
        console.error('[Database] Setup error:', error);
        throw error;
    }
}

async function getAllEvents(userId) {
    console.log('[Database] Fetching events for user:', userId);
    const db = await getDb();
    const events = await db.all('SELECT * FROM events WHERE user_id = ?', [userId]);
    console.log('[Database] Raw events from database:', JSON.stringify(events, null, 2));

    if (events.length === 0) {
        console.log('[Database] No events found for user');
        return [];
    }

    // Calculate date range (current month +/- 6 months)
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 6, 0);

    console.log('[Database] Date range:', {
        today: today.toISOString(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
    });

    // Group events by recurringEventId
    const eventGroups = events.reduce((groups, event) => {
        if (event.recurringEventId) {
            if (!groups[event.recurringEventId]) {
                groups[event.recurringEventId] = [];
            }
            groups[event.recurringEventId].push(event);
        } else {
            if (!groups.nonRecurring) {
                groups.nonRecurring = [];
            }
            groups.nonRecurring.push(event);
        }
        return groups;
    }, {});

    // Process each group
    const allInstances = [];

    // Handle non-recurring events
    if (eventGroups.nonRecurring) {
        allInstances.push(...eventGroups.nonRecurring.map(event => ({
            ...event,
            isRecurring: false
        })));
    }

    // Handle recurring events
    for (const [recurringId, groupEvents] of Object.entries(eventGroups)) {
        if (recurringId === 'nonRecurring') continue;

        // Use the earliest event in the group as the base event
        const baseEvent = groupEvents.reduce((earliest, current) => {
            const earliestDate = new Date(earliest.date);
            const currentDate = new Date(current.date);
            return currentDate < earliestDate ? current : earliest;
        }, groupEvents[0]);

        try {
            console.log(`[Database] Processing recurring event group ${recurringId}:`, {
                baseEvent: baseEvent.id,
                date: baseEvent.date,
                recurring: baseEvent.recurring,
                recurringDays: baseEvent.recurringDays
            });

            const instances = generateRecurringInstances(baseEvent, startDate, endDate);
            console.log(`[Database] Event group ${recurringId} generated ${instances.length} instances`);
            allInstances.push(...instances);
        } catch (error) {
            console.error(`[Database] Error processing recurring event group ${recurringId}:`, error);
            // If there's an error, include the original events
            allInstances.push(...groupEvents);
        }
    }

    // Remove duplicates based on date and recurringEventId
    const uniqueInstances = allInstances.reduce((unique, event) => {
        const key = `${event.date}-${event.recurringEventId || event.id}`;
        if (!unique[key] || new Date(event.date) < new Date(unique[key].date)) {
            unique[key] = event;
        }
        return unique;
    }, {});

    const finalEvents = Object.values(uniqueInstances);
    console.log('[Database] Total events being returned:', finalEvents.length);
    return finalEvents;
}

async function saveEvent(userId, event) {
    const db = await getDb();
    console.log('[SAVE] Received event:', {
        userId,
        eventId: event.id,
        deleted: event.deleted,
        recurring: event.recurring,
        recurringEventId: event.recurringEventId
    });

    // If event is marked for deletion
    if (event.deleted) {
        console.log('[DELETE] Backend received delete request:', {
            id: event.id,
            recurring: event.recurring,
            recurringEventId: event.recurringEventId
        });

        try {
            let result;
            if (event.recurring !== 'none' || event.recurringEventId) {
                // Delete all events in the recurring series
                console.log('[DELETE] Deleting recurring series:', event.recurringEventId);
                result = await db.run(
                    'DELETE FROM events WHERE user_id = ? AND (recurringEventId = ? OR id = ?)',
                    [userId, event.recurringEventId, event.id]
                );
                console.log('[DELETE] Recurring series deletion result:', {
                    recurringId: event.recurringEventId,
                    eventId: event.id,
                    rowsAffected: result.changes
                });
            } else {
                // Delete single event
                console.log('[DELETE] Deleting single event:', event.id);
                result = await db.run(
                    'DELETE FROM events WHERE id = ? AND user_id = ?',
                    [event.id, userId]
                );
                console.log('[DELETE] Single event deletion result:', {
                    id: event.id,
                    rowsAffected: result.changes
                });
            }

            // Get all remaining events for verification
            const remainingEvents = await db.all(
                'SELECT id, recurring, recurringEventId FROM events WHERE user_id = ? AND (recurringEventId = ? OR id = ?)',
                [userId, event.recurringEventId, event.id]
            );
            console.log('[DELETE] Checking for remaining events in series:', remainingEvents);

            return getAllEvents(userId);
        } catch (error) {
            console.error('[DELETE] Error during deletion:', error);
            throw error;
        }
    }

    // Check if event exists
    const existingEvent = await db.get('SELECT id FROM events WHERE id = ? AND user_id = ?', [event.id, userId]);

    if (existingEvent) {
        // Update existing event
        await db.run(
            `UPDATE events
             SET name = ?, date = ?, startTime = ?, endTime = ?, type = ?,
                 xPosition = ?, width = ?, backgroundColor = ?, color = ?,
                 recurring = ?, recurringDays = ?, recurringEventId = ?, overlayText = ?
             WHERE id = ? AND user_id = ?`,
            [
                event.name, event.date, event.startTime, event.endTime, event.type,
                event.xPosition || 0, event.width || 50, event.backgroundColor, event.color,
                event.recurring || 'none',
                typeof event.recurringDays === 'string' ? event.recurringDays : '{}',
                event.recurringEventId,
                event.overlayText,
                event.id, userId
            ]
        );
    } else {
        // Insert new event
        await db.run(
            `INSERT INTO events (
                user_id, id, name, date, startTime, endTime, type,
                xPosition, width, backgroundColor, color, recurring, recurringDays, recurringEventId, overlayText
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId, event.id, event.name, event.date, event.startTime, event.endTime, event.type,
                event.xPosition || 0, event.width || 50, event.backgroundColor, event.color,
                event.recurring || 'none',
                typeof event.recurringDays === 'string' ? event.recurringDays : '{}',
                event.recurringEventId,
                event.overlayText
            ]
        );
    }

    return getAllEvents(userId);
}

// Helper function to generate recurring event instances
function generateRecurringInstances(event, startDate, endDate) {
    // If recurring is undefined, null, false, or 'none', return original event without isRecurring flag
    if (!event.recurring || event.recurring === 'none' || event.recurring === false) {
        return [{
            ...event,
            isRecurring: false,
            recurring: 'none',
            recurringDays: '{}'
        }];
    }

    const instances = [];
    let recurringDays;
    try {
        recurringDays = typeof event.recurringDays === 'string'
            ? JSON.parse(event.recurringDays)
            : event.recurringDays || {};
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

    // Limit to 6 months from today
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 6);

    // Use the earliest of maxDate and endDate
    const effectiveEndDate = end > maxDate ? maxDate : end;

    // Start from the event date or start date, whichever is later
    let currentDate = new Date(Math.max(start.getTime(), eventDate.getTime()));

    // Add the original event if it falls within our date range
    if (eventDate >= start && eventDate <= effectiveEndDate) {
        instances.push({
            ...event,
            isRecurring: true
        });
    }

    // Generate future instances
    while (currentDate <= effectiveEndDate) {
        // Skip the original event date
        if (currentDate.toISOString().split('T')[0] === event.date) {
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
        }

        let shouldAdd = false;

        if (event.recurring === 'daily') {
            const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            shouldAdd = recurringDays[dayName] === true;
        } else if (event.recurring === 'weekly') {
            shouldAdd = currentDate.getDay() === eventDate.getDay();
        } else if (event.recurring === 'monthly') {
            shouldAdd = currentDate.getDate() === eventDate.getDate();
        }

        if (shouldAdd) {
            const instanceDate = currentDate.toISOString().split('T')[0];
            instances.push({
                ...event,
                id: `${event.id}-${instanceDate}`,
                date: instanceDate,
                isRecurring: true,
                originalEventId: event.id,
                originalDate: event.date
            });
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return instances;
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

// Add task-related functions while keeping existing functions unchanged
async function saveTask(userId, task) {
    const db = await getDb();
    console.log('[Tasks] Saving task:', { userId, task });

    try {
        if (task.id) {
            // Update existing task
            await db.run(
                `UPDATE tasks
                SET title = ?, date = ?, time = ?, priority = ?, nudge = ?
                WHERE id = ? AND user_id = ?`,
                [task.title, task.date, task.time, task.priority, task.nudge, task.id, userId]
            );
            console.log('[Tasks] Updated existing task:', task.id);
        } else {
            // Create new task
            const taskId = Date.now().toString();
            await db.run(
                `INSERT INTO tasks (id, user_id, title, date, time, priority, nudge)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [taskId, userId, task.title, task.date, task.time, task.priority, task.nudge]
            );
            console.log('[Tasks] Created new task:', taskId);
        }

        // Return all tasks for the user
        return await getUserTasks(userId);
    } catch (error) {
        console.error('[Tasks] Error saving task:', error);
        throw error;
    }
}

async function getUserTasks(userId) {
    const db = await getDb();
    try {
        const tasks = await db.all(
            'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        return tasks;
    } catch (error) {
        console.error('[Database] Error fetching tasks:', error);
        throw error;
    }
}

// Keep existing exports and add new task functions
module.exports = {
    setupDb,
    getDb,
    getAllEvents,
    saveEvent,
    createUser,
    getUser,
    getSettings,
    updateSettings,
    saveTask,
    getUserTasks
};