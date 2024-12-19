import React, { useState, useEffect } from 'react';

function CurrentTimeLine() {
    const [position, setPosition] = useState(calculatePosition());

    function calculatePosition() {
        const now = new Date();
        const minutes = now.getHours() * 60 + now.getMinutes();
        return (minutes / (24 * 60)) * 100; // Convert to percentage
    }

    useEffect(() => {
        // Update position immediately and then every minute
        const interval = setInterval(() => {
            setPosition(calculatePosition());
        }, 60000); // 60000ms = 1 minute

        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, []);

    return (
        <div
            className="absolute left-0 right-0 flex items-center pointer-events-none"
            style={{ top: `${position}%` }}
        >
            {/* Time label */}
            <div className="absolute right-full pr-2 text-xs text-red-500 font-medium">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            {/* Line */}
            <div className="flex-1 h-[2px] bg-red-500" />
            {/* Dot */}
            <div className="absolute left-0 w-2 h-2 bg-red-500 rounded-full -translate-x-1 -translate-y-[3px]" />
        </div>
    );
}

export default CurrentTimeLine;