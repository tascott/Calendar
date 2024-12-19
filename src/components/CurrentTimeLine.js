import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

function CurrentTimeLine({ events = [] }) {
    const [position, setPosition] = useState(calculatePosition());
    const [notifiedEvents, setNotifiedEvents] = useState(new Set());
    const [activeEvents, setActiveEvents] = useState(new Set());

    function calculatePosition() {
        const now = new Date();
        const minutes = now.getHours() * 60 + now.getMinutes();
        return (minutes / (24 * 60)) * 100; // Convert to percentage
    }

    function getCurrentTimeInMinutes() {
        const now = new Date();
        return now.getHours() * 60 + now.getMinutes();
    }

    function timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    function isEventInProgress(event, currentMinutes) {
        const startMinutes = timeToMinutes(event.startTime);
        const endMinutes = timeToMinutes(event.endTime);
        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }

    function handleEventStart(event) {
        // Show notification
        toast.success(`Event starting: ${event.name}`, {
            duration: 5000,
            position: 'top-right',
            icon: '🗓️'
        });

        // EXTENSION POINT:
        // Add additional event start triggers here
        // Examples:
        // - Send push notification
        // - Play sound
        // - Trigger calendar sync
        // - Start recording/meeting
        // - Update status (e.g., busy/available)

        // Mark event as notified
        setNotifiedEvents(prev => new Set([...prev, event.id]));
    }

    function handleEventInProgress(event) {
        // Show "in progress" notification
        toast(`Event in progress: ${event.name}`, {
            duration: 5000,
            position: 'top-right',
            icon: '⏳',
            style: {
                background: '#FEF3C7', // Light yellow background
                color: '#92400E'       // Dark yellow text
            }
        });

        // EXTENSION POINT:
        // Add additional in-progress triggers here
        // Examples:
        // - Update status indicators
        // - Sync with external systems
        // - Start time tracking
        // - Load relevant resources/documents

        // Mark event as active
        setActiveEvents(prev => new Set([...prev, event.id]));
    }

    function checkForEventNotifications() {
        const currentMinutes = getCurrentTimeInMinutes();

        events.forEach(event => {
            const eventStartMinutes = timeToMinutes(event.startTime);

            // Check for event start
            if (eventStartMinutes === currentMinutes && !notifiedEvents.has(event.id)) {
                handleEventStart(event);
            }

            // Check for in-progress events that haven't been marked as active
            if (isEventInProgress(event, currentMinutes) && !activeEvents.has(event.id)) {
                handleEventInProgress(event);
            }
        });
    }

    // Check for events when component mounts or events change
    useEffect(() => {
        checkForEventNotifications();
    }, [events]); // Run when events change

    // Regular interval updates
    useEffect(() => {
        const interval = setInterval(() => {
            setPosition(calculatePosition());
            checkForEventNotifications();
        }, 60000); // 60000ms = 1 minute

        return () => clearInterval(interval);
    }, [events, notifiedEvents, activeEvents]);

    return (
        <div
            className="absolute left-0 right-0 flex items-center pointer-events-none z-20"
            style={{ top: `${position}%` }}
        >
            {/* Time label */}
            <div className="absolute right-full pr-2 text-xs text-red-500 font-medium">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            {/* Line */}
            <div className="flex-1 h-[2px] bg-red-500" />
            {/* Dot */}
            <div className="absolute left-0 top--3 w-2 h-2 bg-red-500 rounded-full -translate-x-1" />
        </div>
    );
}

export default CurrentTimeLine;