import React from 'react';
import TimeColumn from '../components/TimeColumn';
import GridOverlay from '../components/GridOverlay';
import CurrentTimeLine from '../components/CurrentTimeLine';

function EventBlock({ event, onClick }) {
    // Convert time string to minutes since start of day
    const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const startMinutes = timeToMinutes(event.startTime);
    const endMinutes = timeToMinutes(event.endTime);
    const duration = endMinutes - startMinutes;

    // Calculate position and height
    const topPercentage = (startMinutes / (24 * 60)) * 100;
    const heightPercentage = (duration / (24 * 60)) * 100;

    const isStatus = event.type === 'status';

    const handleClick = (e) => {
        e.stopPropagation(); // Prevent grid's double-click from firing
        onClick?.(event);
    };

    return (
        <div
            onDoubleClick={handleClick}
            className={`absolute left-1 right-1 rounded-lg p-2 cursor-pointer hover:opacity-90 ${
                isStatus ? 'bg-yellow-100' : 'bg-blue-100'
            }`}
            style={{
                top: `${topPercentage}%`,
                height: `${heightPercentage}%`,
                minHeight: '1.5rem'
            }}
        >
            <div className={`text-sm font-medium ${
                isStatus ? 'text-yellow-800' : 'text-blue-800'
            }`}>
                {event.name}
            </div>
            <div className={`text-xs ${
                isStatus ? 'text-yellow-600' : 'text-blue-600'
            }`}>
                {event.startTime} - {event.endTime}
            </div>
        </div>
    );
}

function DayView({ onDoubleClick, events = [] }) {
    const snapToNearestFifteen = (minutes) => {
        return Math.round(minutes / 15) * 15;
    };

    const handleDoubleClick = (e) => {
        if (!onDoubleClick) return;

        // Get click position relative to grid
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;

        // Calculate minutes since start of day
        const hourHeight = 48; // 3rem = 48px
        const totalMinutes = (y / hourHeight) * 60;
        const snappedMinutes = snapToNearestFifteen(totalMinutes);

        // Convert to hours and minutes
        const hours = Math.floor(snappedMinutes / 60);
        const minutes = snappedMinutes % 60;

        // Format time string (HH:MM)
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        onDoubleClick(timeString);
    };

    const handleEventClick = (event) => {
        onDoubleClick(event.startTime, event); // Pass the entire event object for editing
    };

    return (
        <div className="flex w-full">
            <TimeColumn />
            <div
                className="relative flex-1 grid grid-rows-[repeat(24,3rem)]"
                onDoubleClick={handleDoubleClick}
            >
                {/* Horizontal hour lines */}
                {Array.from({ length: 24 }, (_, i) => (
                    <div
                        key={i}
                        className="border-t border-gray-200 relative"
                    >
                        {/* 30-minute marker */}
                        <div className="absolute top-1/2 w-full border-t border-gray-100" />
                    </div>
                ))}
                {/* Vertical grid overlay */}
                <GridOverlay />

                {/* Current time line */}
                <CurrentTimeLine />

                {/* Events */}
                <div className="absolute inset-0">
                    {events.map(event => (
                        <EventBlock
                            key={event.id}
                            event={event}
                            onClick={handleEventClick}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default DayView;