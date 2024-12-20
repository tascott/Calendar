import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

function CurrentTimeLine({ settings, events = [] }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [notifiedEvents, setNotifiedEvents] = useState(new Set());
    const [activeEvents, setActiveEvents] = useState(new Set());
    const lastEventStates = useRef(new Map());

    // Convert time string to minutes since start of day
    const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
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

    // Check for events when component mounts or time/events change
    useEffect(() => {
        // Function to check events
        const checkEvents = () => {
            const now = new Date();
            const today = now.toISOString().split('T')[0];

            events.forEach(event => {
                // Skip events that are being dragged
                if (event.isDragging) return;

                // Only check today's events
                if (event.date !== today) return;

                const isCurrentlyInProgress = isEventInProgress(event, now);
                const wasInProgress = lastEventStates.current.get(event.id);
                const justDropped = 'justDropped' in event;

                // Handle initial load or event becoming in progress
                if (isCurrentlyInProgress) {
                    // Only notify if:
                    // 1. Initial load (no previous state)
                    // 2. Just dropped into current time
                    // 3. Naturally entered current time
                    if (!lastEventStates.current.has(event.id) || // Initial load
                        (justDropped && !wasInProgress) || // Just dropped into current time
                        (!wasInProgress && !activeEvents.has(event.id))) { // Naturally entered current time
                        handleEventInProgress(event);
                    }
                }

                // Handle event start
                const eventStartMinutes = timeToMinutes(event.startTime);
                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                if (eventStartMinutes === currentMinutes && !notifiedEvents.has(event.id)) {
                    handleEventStart(event);
                }

                // If event was in progress but isn't anymore, remove from active events
                if (!isCurrentlyInProgress && wasInProgress) {
                    setActiveEvents(prev => {
                        const next = new Set(prev);
                        next.delete(event.id);
                        return next;
                    });
                }

                // Update last state
                lastEventStates.current.set(event.id, isCurrentlyInProgress);
            });
        };

        // Reset notifications at midnight
        const resetNotifications = () => {
            setNotifiedEvents(new Set());
            setActiveEvents(new Set());
            lastEventStates.current = new Map();
        };

        // Check if we need to reset notifications (if it's a new day)
        const lastDate = localStorage.getItem('lastNotificationDate');
        const today = new Date().toISOString().split('T')[0];
        if (lastDate !== today) {
            resetNotifications();
            localStorage.setItem('lastNotificationDate', today);
        }

        // Check immediately when mounted or dependencies change
        checkEvents();

        // Set up interval for frequent checks (every 10 seconds)
        const checkInterval = setInterval(checkEvents, 10000);
        return () => clearInterval(checkInterval);
    }, [events, notifiedEvents, activeEvents]); // Removed lastEventStates from dependencies

    // Update current time display every 10 seconds
    useEffect(() => {
        const updateTime = () => setCurrentTime(new Date());
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