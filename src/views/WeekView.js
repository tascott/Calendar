import React from 'react';
import { format } from 'date-fns';
import CalendarNavigation from '../components/CalendarNavigation';

function WeekEvent({ event, settings, onEventClick }) {
    // Convert time string to minutes since start of day
    const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const startMinutes = timeToMinutes(event.startTime);
    const endMinutes = timeToMinutes(event.endTime);
    const duration = endMinutes - startMinutes;
    const isShortEvent = duration < 45; // Check if event is less than 45 minutes

    // Get visible time range
    const visibleStartMinutes = timeToMinutes(settings?.dayStartTime || '00:00');
    const visibleEndMinutes = timeToMinutes(settings?.dayEndTime || '24:00');
    const visibleDuration = visibleEndMinutes - visibleStartMinutes || 24 * 60;

    // Calculate position and height relative to visible range
    const topPercentage = ((startMinutes - visibleStartMinutes) / visibleDuration) * 100;
    const heightPercentage = (duration / visibleDuration) * 100;
    const leftPosition = event.xPosition || 0;

    const isStatus = event.type === 'status';

    return (
        <div
            onClick={() => onEventClick(event.startTime, event)}
            className={`absolute rounded-[1px] border border-[#D3D1C7] cursor-pointer hover:opacity-75 overflow-hidden ${
                isStatus ? 'bg-yellow-100' : 'bg-blue-100'
            }`}
            style={{
                top: `${topPercentage}%`,
                height: `${heightPercentage}%`,
                minHeight: '1.25rem',
                left: `${leftPosition}%`,
                width: `${event.width || 50}%`,
                fontSize: '0.75rem',
                backgroundColor: event.backgroundColor || (isStatus ? undefined : undefined),
                color: event.color,
                padding: isShortEvent ? '0.25rem 0.5rem' : '0.5rem'
            }}
        >
            <div className="flex items-start space-x-1 max-w-full">
                {event.isRecurring && (
                    <div className="recurring-icon flex-shrink-0">
                        <span className="material-icons text-xs" style={{ fontSize: '14px' }}>autorenew</span>
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    {isShortEvent ? (
                        <div className="truncate">
                            {event.name} ({event.startTime})
                        </div>
                    ) : (
                        <>
                            <div className="font-medium truncate">
                                {event.name}
                            </div>
                            <div className="truncate">
                                {event.startTime}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function WeekView({ events = [], settings, currentDate = new Date(), onNavigate, onEventClick }) {
    // Change days array to start with Monday
    const days = [];
    const startOfWeek = new Date(currentDate);
    // Adjust to get Monday: if today is Sunday (0), go back 6 days, otherwise go back to last Monday
    startOfWeek.setDate(currentDate.getDate() - (currentDate.getDay() || 7) + 1);

    // Generate array of dates for the week
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        days.push(day);
    }

    // Convert time string to minutes since start of day
    const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const startMinutes = timeToMinutes(settings?.dayStartTime || '00:00');
    const endMinutes = timeToMinutes(settings?.dayEndTime || '24:00');
    const visibleHours = Math.ceil((endMinutes - startMinutes) / 60);
    const startHour = Math.floor(startMinutes / 60);

    // Function to get events for a specific day
    const eventsForDay = (date) => {
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
        <div className="flex flex-col h-full">
            <CalendarNavigation
                viewType="week"
                currentDate={currentDate}
                onNavigate={onNavigate}
            />
            <div className="flex flex-col flex-1 overflow-y-auto">
                <div className="flex flex-1">
                    {/* Time column */}
                    <div className="w-20 flex-shrink-0 border-r border-[#D3D1C7]">
                        <div className="h-16 border-b border-[#D3D1C7]" /> {/* Increased header spacer height */}
                        <div className="relative" style={{ height: `${visibleHours * 60}px` }}>
                            {Array.from({ length: visibleHours + 1 }, (_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-full text-xs text-gray-500 pl-1"
                                    style={{ top: `${i * 60}px`, transform: 'translateY(-50%)' }}
                                >
                                    {String(i + startHour).padStart(2, '0')}:00
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Days grid */}
                    <div className="grid grid-cols-7 flex-1">
                        {days.map((day, index) => (
                            <div
                                key={day.toISOString()}
                                className={`border-r border-b ${index === 0 ? 'border-l' : ''} border-[#D3D1C7]`}
                            >
                                <div className="sticky top-0 z-10 bg-white border-b border-[#D3D1C7] px-2 py-1 h-16">
                                    <div className="font-medium">{format(day, 'EEEE')}</div>
                                    <div className="text-sm text-gray-500">{format(day, 'MMM d')}</div>
                                </div>
                                <div className="relative" style={{ height: `${visibleHours * 60}px` }}>
                                    {Array.from({ length: visibleHours }, (_, i) => (
                                        <div
                                            key={i}
                                            className="absolute w-full border-b border-[#D3D1C7]"
                                            style={{ top: `${i * 60}px`, height: '60px' }}
                                        />
                                    ))}
                                    {eventsForDay(day).map((event, index) => (
                                        <WeekEvent
                                            key={`${event.originalEventId || event.id}-${event.date}-${index}`}
                                            event={event}
                                            settings={settings}
                                            onEventClick={onEventClick}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WeekView;