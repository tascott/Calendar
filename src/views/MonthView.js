import React from 'react';
import CalendarNavigation from '../components/CalendarNavigation';

function MonthEvent({ event }) {
    // Don't render status events
    if (event.type === 'status') return null;

    return (
        <div
            className="text-xs p-1 rounded-[1px] truncate border border-[#D3D1C7]"
            style={{
                backgroundColor: event.backgroundColor || '#DBEAFE',
                color: event.color || '#1E40AF'
            }}
        >
            <div className="flex items-start space-x-1">
                {event.recurring && (
                    <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                )}
                <div className="flex-1 truncate">
                    {event.name}
                </div>
            </div>
        </div>
    );
}

function MonthView({ events = [], settings, currentDate = new Date(), onNavigate }) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Get first day of the month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

    // Get last day of the month
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const totalDays = lastDay.getDate();

    // Calculate total number of weeks needed
    const totalWeeks = Math.ceil((startingDayOfWeek + totalDays) / 7);

    // Process events including recurring ones
    const processEvents = (date) => {
        const dateString = date.toISOString().split('T')[0];

        return events.filter(event => {
            // Exclude status events
            if (event.type === 'status') return false;

            // Check if it's the original event date
            if (event.date === dateString) return true;

            // Handle recurring events
            if (!event.recurring || event.recurring === 'none') return false;

            const eventDate = new Date(event.date);
            let recurringDays;
            try {
                recurringDays = typeof event.recurringDays === 'string'
                    ? JSON.parse(event.recurringDays)
                    : event.recurringDays || {};
            } catch (error) {
                console.error('Error parsing recurringDays:', error);
                return false;
            }

            if (event.recurring === 'daily') {
                const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                return recurringDays[dayName];
            }

            if (event.recurring === 'weekly') {
                return date.getDay() === eventDate.getDay();
            }

            if (event.recurring === 'monthly') {
                return date.getDate() === eventDate.getDate();
            }

            return false;
        });
    };

    return (
        <div className="flex flex-col w-full">
            <CalendarNavigation
                viewType="month"
                currentDate={currentDate}
                onNavigate={onNavigate}
            />
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
                                const currentDayDate = new Date(currentYear, currentMonth, dayNumber);
                                const isToday = isCurrentMonth && currentDayDate.toDateString() === new Date().toDateString();
                                const dayEvents = isCurrentMonth ? processEvents(currentDayDate) : [];

                                return (
                                    <div
                                        key={dayIndex}
                                        className={`border-r border-b border-gray-200 p-1 min-h-[100px] ${
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
                                            {dayEvents.map((event, index) => (
                                                <MonthEvent
                                                    key={`${event.id}-${index}`}
                                                    event={event}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default MonthView;