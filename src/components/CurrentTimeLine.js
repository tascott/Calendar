import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

function CurrentTimeLine({ settings, events = [], tasks = [], onTaskUpdate }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [notifiedEvents, setNotifiedEvents] = useState(new Set());
    const [activeEvents, setActiveEvents] = useState(new Set());
    const [activeTaskNotification, setActiveTaskNotification] = useState(null);
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

        // Set the active notification
        setActiveTaskNotification({
            task,
            time: new Date().toLocaleTimeString()
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

    // Add helper function to calculate new time
    function addMinutesToTime(timeStr, minutesToAdd) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        let totalMinutes = hours * 60 + minutes + minutesToAdd;

        // Handle day overflow
        totalMinutes = totalMinutes % (24 * 60);

        const newHours = Math.floor(totalMinutes / 60);
        const newMinutes = totalMinutes % 60;

        return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
    }

    // Handle snooze action
    const handleSnooze = async (task) => {
        const newTime = addMinutesToTime(task.time, 15);
        console.log('[CurrentTimeLine] Snoozing task:', task.title, 'from', task.time, 'to', newTime);

        // Remove current notification
        setActiveTaskNotification(null);

        // Remove from notified tasks so it can trigger again
        notifiedTasks.current.delete(task.id);

        // Update the task with new time
        await onTaskUpdate({
            ...task,
            time: newTime
        });
    };

    // Don't render if current time is outside visible range
    if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
        return null;
    }

    const visibleDuration = endMinutes - startMinutes;
    const percentage = ((currentMinutes - startMinutes) / visibleDuration) * 100;

    return (
        <>
            {/* Current time line */}
            <div
                className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
                style={{ top: `${percentage}%` }}
            >
                <div className="w-full border-t-2 border-red-500" />
            </div>

            {/* Task notification modal */}
            {activeTaskNotification && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl border-2 border-[#2C2C2C]">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-semibold text-[#2C2C2C] mb-1">Task Due</h2>
                                <p className="text-sm text-gray-500">
                                    Notification time: {activeTaskNotification.time}
                                </p>
                            </div>
                            <button
                                onClick={() => setActiveTaskNotification(null)}
                                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-lg font-medium text-[#2C2C2C] mb-2">
                                {activeTaskNotification.task.title}
                            </h3>
                            <div className="space-y-2">
                                <p className="text-sm">
                                    <span className="font-medium">Time:</span> {activeTaskNotification.task.time}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium">Priority:</span>{' '}
                                    <span className={
                                        activeTaskNotification.task.priority === 'high' ? 'text-red-600' :
                                        activeTaskNotification.task.priority === 'medium' ? 'text-yellow-600' :
                                        'text-green-600'
                                    }>
                                        {activeTaskNotification.task.priority}
                                    </span>
                                </p>
                                {activeTaskNotification.task.notes && (
                                    <p className="text-sm">
                                        <span className="font-medium">Notes:</span> {activeTaskNotification.task.notes}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => handleSnooze(activeTaskNotification.task)}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                                Snooze 15min
                            </button>
                            <button
                                onClick={() => setActiveTaskNotification(null)}
                                className="px-4 py-2 bg-[#2C2C2C] text-white rounded hover:bg-[#3C3C3C] transition-colors"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default CurrentTimeLine;