import React from 'react';
import TimeColumn from '../components/TimeColumn';
import GridOverlay from '../components/GridOverlay';

function DayView() {
    return (
        <div className="flex w-full">
            <TimeColumn />
            <div className="relative flex-1 grid grid-rows-[repeat(24,3rem)]">
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