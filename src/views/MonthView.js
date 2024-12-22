import React from 'react';
import CalendarNavigation from '../components/CalendarNavigation';

function MonthEvent({ event, onEventClick }) {
    // Don't render status events
    if (event.type === 'status') return null;

    return (
        <div
            onClick={() => onEventClick(event.startTime, event)}
            className="text-xs p-1 rounded-[1px] truncate border border-[#D3D1C7] cursor-pointer hover:opacity-75"
            style={{
                backgroundColor: event.backgroundColor || '#DBEAFE',
                color: event.color || '#1E40AF'
            }}
        >
            <div className="flex items-start space-x-1">
                {event.isRecurring && (
                    <div className="recurring-icon">
                        <span className="material-icons text-xs" style={{ fontSize: '14px' }}>autorenew</span>
                    </div>
                )}
                <div className="flex-1 truncate">
                    {event.name}
                </div>
            </div>
        </div>
    );
}

function MonthView({ events = [], settings, currentDate = new Date(), onNavigate, onEventClick }) {
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
                                                    key={`${event.originalEventId || event.id}-${event.date}-${index}`}
                                                    event={event}
                                                    onEventClick={onEventClick}
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