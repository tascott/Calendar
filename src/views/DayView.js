import React from 'react';
import TimeColumn from '../components/TimeColumn';
import GridOverlay from '../components/GridOverlay';

function DayView({ onDoubleClick }) {
    const handleDoubleClick = (e) => {
        if (!onDoubleClick) return;

        // Get click position relative to grid
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;

        // Calculate hour based on click position
        const hourHeight = 48; // 3rem = 48px
        const hour = Math.floor(y / hourHeight);
        const minutes = Math.floor((y % hourHeight) / (hourHeight / 60));

        // Format time string (HH:MM)
        const timeString = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        onDoubleClick(timeString);
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
            </div>
        </div>
    );
}

export default DayView;