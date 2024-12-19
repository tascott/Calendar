import React from 'react';

function MonthEvent({ event }) {
    const isStatus = event.type === 'status';
    const leftPosition = event.xPosition || 0;

    return (
        <div
            className={`rounded px-1 py-0.5 text-xs truncate mb-1 ${
                isStatus ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
            }`}
            style={{
                marginLeft: `${leftPosition}%`,
                width: '50%'
            }}
        >
            {event.startTime} {event.name}
        </div>
    );
}

function MonthView({ events = [] }) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Get first day of the month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startingDayOfWeek = firstDay.getDay();

    // Get last day of the month
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const totalDays = lastDay.getDate();

    // Calculate total number of weeks needed
    const totalWeeks = Math.ceil((startingDayOfWeek + totalDays) / 7);

    // Group events by date
    const eventsByDate = events.reduce((acc, event) => {
        acc[event.date] = [...(acc[event.date] || []), event];
        return acc;
    }, {});

    const getDayEvents = (dayDate) => {
        const dateString = dayDate.toISOString().split('T')[0];
        return eventsByDate[dateString] || [];
    };

    return (
        <div className="w-full">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-200">
                {days.map(day => (
                    <div key={day} className="px-2 py-2 text-center text-sm font-medium text-gray-600">
                        {day}
                    </div>
                ))}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-rows-6 border-b border-gray-200">
                {Array.from({ length: totalWeeks }, (_, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7">
                        {Array.from({ length: 7 }, (_, dayIndex) => {
                            const dayNumber = weekIndex * 7 + dayIndex - startingDayOfWeek + 1;
                            const isCurrentMonth = dayNumber > 0 && dayNumber <= totalDays;
                            const currentDate = new Date(currentYear, currentMonth, dayNumber);
                            const isToday = isCurrentMonth && currentDate.toDateString() === today.toDateString();
                            const dayEvents = isCurrentMonth ? getDayEvents(currentDate) : [];

                            return (
                                <div
                                    key={dayIndex}
                                    className={`border-r border-b border-gray-200 p-1 ${
                                        isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                                    }`}
                                >
                                    <div className={`text-sm mb-1 ${
                                        isToday
                                            ? 'text-blue-600 font-semibold'
                                            : isCurrentMonth
                                                ? 'text-gray-900'
                                                : 'text-gray-400'
                                    }`}>
                                        {isCurrentMonth ? dayNumber : ''}
                                    </div>
                                    <div className="space-y-1 overflow-y-auto max-h-24">
                                        {dayEvents.map(event => (
                                            <MonthEvent key={event.id} event={event} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MonthView;