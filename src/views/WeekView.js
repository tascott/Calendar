import React from 'react';
import TimeColumn from '../components/TimeColumn';
import GridOverlay from '../components/GridOverlay';
import CurrentTimeLine from '../components/CurrentTimeLine';

function WeekEvent({ event, settings }) {
    // Convert time string to minutes since start of day
    const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const startMinutes = timeToMinutes(event.startTime);
    const endMinutes = timeToMinutes(event.endTime);
    const duration = endMinutes - startMinutes;

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
            className={`absolute rounded-lg p-1 ${
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
                color: event.color
            }}
        >
            <div className="font-medium truncate">
                {event.name}
            </div>
            <div className="truncate">
                {event.startTime}
            </div>
        </div>
    );
}

function WeekView({ events = [], settings }) {
    // Change days array to start with Monday
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const startOfWeek = new Date(today);
    // Adjust to get Monday: if today is Sunday (0), go back 6 days, otherwise go back to last Monday
    startOfWeek.setDate(today.getDate() - (today.getDay() || 7) + 1);

    // Convert time string to minutes since start of day
    const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const startMinutes = timeToMinutes(settings?.dayStartTime || '00:00');
    const endMinutes = timeToMinutes(settings?.dayEndTime || '24:00');
    const visibleHours = Math.ceil((endMinutes - startMinutes) / 60);
    const startHour = Math.floor(startMinutes / 60);

    // Group events by day
    const eventsByDay = days.map((_, index) => {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + index);
        const dateString = currentDate.toISOString().split('T')[0];
        return events.filter(event => event.date === dateString);
    });

    return (
        <div className="flex w-full pt-4">
            {/* Time column with offset for day headers */}
            <div className="w-20 flex flex-col">
                <div className="h-10" /> {/* Spacer for day headers */}
                <TimeColumn startHour={startHour} numHours={visibleHours} />
            </div>
            <div className="flex-1 overflow-x-auto">
                {/* Day headers */}
                <div className="h-10 grid grid-cols-7 border-b border-gray-200 min-w-[840px]">
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
                <div className="relative grid grid-cols-7 divide-x divide-gray-200 min-w-[840px]">
                    {days.map((day, dayIndex) => (
                        <div key={day} className="relative">
                            <div
                                className="relative"
                                style={{
                                    display: 'grid',
                                    gridTemplateRows: `repeat(${visibleHours}, 3rem)`
                                }}
                            >
                                {Array.from({ length: visibleHours }, (_, i) => (
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
                                    <WeekEvent
                                        key={event.id}
                                        event={event}
                                        settings={settings}
                                    />
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