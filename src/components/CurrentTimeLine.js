import React, { useState, useEffect } from 'react';

function CurrentTimeLine({ settings }) {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute

        return () => clearInterval(timer);
    }, []);

    // Convert time string to minutes since start of day
    const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const startMinutes = timeToMinutes(settings?.dayStartTime || '00:00');
    const endMinutes = timeToMinutes(settings?.dayEndTime || '24:00');
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

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