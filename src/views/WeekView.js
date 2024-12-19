import React from 'react';
import TimeColumn from '../components/TimeColumn';
import GridOverlay from '../components/GridOverlay';
import CurrentTimeLine from '../components/CurrentTimeLine';

function WeekEvent({ event }) {
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
    const leftPosition = event.xPosition || 0;

    const isStatus = event.type === 'status';

    return (
        <div
            className={`absolute rounded-lg p-1 ${
                isStatus ? 'bg-yellow-100' : 'bg-blue-100'
            }`}
            style={{
                top: `${topPercentage}%`,
                height: `${heightPercentage}%`,
                minHeight: '1.25rem',
                left: `${leftPosition}%`,
                width: '50%',
                fontSize: '0.75rem'
            }}
        >
            <div className={`font-medium truncate ${
                isStatus ? 'text-yellow-800' : 'text-blue-800'
            }`}>
                {event.name}
            </div>
            <div className={`truncate ${
                isStatus ? 'text-yellow-600' : 'text-blue-600'
            }`}>
                {event.startTime}
            </div>
        </div>
    );
}

function WeekView({ events = [] }) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Set to Sunday

    // Group events by day
    const eventsByDay = days.map((_, index) => {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + index);
        const dateString = currentDate.toISOString().split('T')[0];
        return events.filter(event => event.date === dateString);
    });

    return (
        <div className="flex w-full">
            {/* Time column with offset for day headers */}
            <div className="w-20 flex flex-col">
                <div className="h-10" /> {/* Spacer for day headers */}
                <TimeColumn />
            </div>
            <div className="flex-1">
                {/* Day headers */}
                <div className="h-10 grid grid-cols-7 border-b border-gray-200">
                    {days.map((day, index) => {
                        const currentDate = new Date(startOfWeek);
                        currentDate.setDate(startOfWeek.getDate() + index);
                        const isToday = currentDate.toDateString() === today.toDateString();

                        return (
                            <div
                                key={day}
                                className={`px-2 flex flex-col items-center justify-center text-sm font-medium
                                    ${isToday ? 'text-blue-600' : 'text-gray-600'}
                                    ${index > 0 ? 'border-l border-gray-200' : ''}`}
                            >
                                <div>{day}</div>
                                <div className="text-xs">
                                    {currentDate.getDate()}
                                </div>
                            </div>
                        );
                    })}
                </div>
                {/* Week grid */}
                <div className="relative grid grid-cols-7 divide-x divide-gray-200">
                    {days.map((day, dayIndex) => (
                        <div key={day} className="relative">
                            <div className="relative grid grid-rows-[repeat(24,3rem)]">
                                {Array.from({ length: 24 }, (_, i) => (
                                    <div
                                        key={i}
                                        className="border-t border-gray-200 relative"
                                    >
                                        <div className="absolute top-1/2 w-full border-t border-gray-100" />
                                    </div>
                                ))}
                            </div>
                            {/* Events for this day */}
                            <div className="absolute inset-0">
                                {eventsByDay[dayIndex].map(event => (
                                    <WeekEvent key={event.id} event={event} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default WeekView;