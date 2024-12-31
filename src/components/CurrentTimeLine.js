import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

function CurrentTimeLine({ settings, events = [], tasks = [] }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [notifiedEvents, setNotifiedEvents] = useState(new Set());
    const [activeEvents, setActiveEvents] = useState(new Set());
    const lastEventStates = useRef(new Map());
    const lastEventsLength = useRef(0);
    const notifiedTasks = useRef(new Map()); // Track tasks that have been notified and their times

    // Log events for debugging
    useEffect(() => {
        if (process.env.NODE_ENV === 'development' && events.length !== lastEventsLength.current) {
            console.log('[CurrentTimeLine] Events changed:', events);
            console.log('[CurrentTimeLine] Settings:', settings);
            lastEventsLength.current = events.length;
        }
    }, [events, settings]);

    // Convert time string to minutes since start of day
    const timeToMinutes = (timeStr) => {
        if (!timeStr) return 0; // Return 0 for undefined or empty time strings
        try {
            const [hours, minutes] = timeStr.split(':').map(Number);
            if (isNaN(hours) || isNaN(minutes)) return 0;
            return hours * 60 + minutes;
        } catch (error) {
            console.error('Error converting time to minutes:', error);
            return 0;
        }
    };

    const startMinutes = timeToMinutes(settings?.dayStartTime || '00:00');
    const endMinutes = timeToMinutes(settings?.dayEndTime || '24:00');
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

    function isEventInProgress(event, currentTime) {
        // Check if event is for today
        const today = new Date().toISOString().split('T')[0];
        if (event.date !== today) return false;

        const startMinutes = timeToMinutes(event.startTime);
        const endMinutes = timeToMinutes(event.endTime);
        const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }

    function handleEventStart(event) {
        // Skip notifications for focus events
        // TODO: Add different triggers/actions for different event types here
        if (event.type === 'focus') return;

        toast(`Event starting: ${event.name}`, {
            duration: 5000,
            position: 'top-right',
            icon: '🔔',
            style: {
                background: '#E0F2FE',
                color: '#075985'
            }
        });
        notifiedEvents.add(event.id);
    }

    function handleEventInProgress(event) {
        // Skip notifications for focus events
        // TODO: Add different triggers/actions for different event types here
        if (event.type === 'focus') return;

        toast(`Event in progress: ${event.name}`, {
            duration: 5000,
            position: 'top-right',
            icon: '⏳',
            style: {
                background: '#FEF3C7',
                color: '#92400E'
            }
        });
        setActiveEvents(prev => new Set([...prev, event.id]));
    }

    // Check if a task's time matches the current time
    function isTaskTime(task, currentTime) {
        const today = new Date().toISOString().split('T')[0];
        if (task.date !== today) return false;

        const taskMinutes = timeToMinutes(task.time);
        const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();


        return taskMinutes === currentMinutes;
    }

    // Handle task notification
    function handleTaskNotification(task) {
        if (!settings?.taskNotifications) {
            console.log('[CurrentTimeLine] Task notifications disabled');
            return;
        }

        // Check if we've already notified for this task
        const lastNotification = notifiedTasks.current.get(task.id);
        if (lastNotification && lastNotification.time === task.time) {
            console.log('[CurrentTimeLine] Task already notified:', task.title);
            return;
        }

        console.log('[CurrentTimeLine] Notifying task:', task.title, 'Previous notification:', lastNotification);
        toast(`Task due: ${task.title}`, {
            duration: 5000,
            position: 'top-right',
            icon: '⏰',
            style: {
                background: '#E0F2FE',
                color: '#075985'
            }
        });

        // Update the notification record
        notifiedTasks.current.set(task.id, {
            time: task.time,
            notifiedAt: new Date()
        });
    }

    // Clean up old notifications when tasks change
    useEffect(() => {
        const currentTaskIds = new Set(tasks.map(t => t.id));
        for (const [taskId] of notifiedTasks.current) {
            if (!currentTaskIds.has(taskId)) {
                notifiedTasks.current.delete(taskId);
            }
        }
    }, [tasks]);

    useEffect(() => {
        const checkTasks = () => {
            if (!settings?.taskNotifications) {
                console.log('[CurrentTimeLine] Task notifications disabled, skipping check. Settings:', settings);
                return;
            }

            const now = new Date();
            console.log('[CurrentTimeLine] Checking tasks at:', now.toLocaleTimeString(), 'Tasks:', tasks, 'Settings:', settings);

            tasks.forEach(task => {
                if (isTaskTime(task, now)) {
                    console.log('[CurrentTimeLine] Task time matched:', task.title, task.time);
                    handleTaskNotification(task);
                }
            });
        };

        // Check immediately when mounted or dependencies change
        checkTasks();

        // Set up interval for frequent checks (every 10 seconds)
        const checkInterval = setInterval(checkTasks, 10000);
        return () => clearInterval(checkInterval);
    }, [tasks, settings?.taskNotifications, currentTime, settings]);

    // Update current time display every 10 seconds
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            console.log('[CurrentTimeLine] Updating current time:', now.toLocaleTimeString());
            setCurrentTime(now);
        };
        updateTime(); // Run immediately
        const timer = setInterval(updateTime, 10000);
        return () => clearInterval(timer);
    }, []);

    // Don't render if current time is outside visible range
    if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
        return null;
    }

    const visibleDuration = endMinutes - startMinutes;
    const percentage = ((currentMinutes - startMinutes) / visibleDuration) * 100;

    return (
        <div
            className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
            style={{ top: `${percentage}%` }}
        >
            <div className="w-full border-t-2 border-red-500" />
        </div>
    );
}

export default CurrentTimeLine;