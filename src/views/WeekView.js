import React from 'react';
import TimeColumn from '../components/TimeColumn';
import GridOverlay from '../components/GridOverlay';

function WeekView() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
                    {days.map(day => (
                        <div key={day} className="px-2 flex items-center justify-center text-sm font-medium text-gray-600">
                            {day}
                        </div>
                    ))}
                </div>
                {/* Week grid */}
                <div className="relative grid grid-cols-7">
                    {days.map(day => (
                        <div key={day} className="relative grid grid-rows-[repeat(24,3rem)]">
                            {Array.from({ length: 24 }, (_, i) => (
                                <div
                                    key={i}
                                    className="border-t border-gray-200 relative"
                                >
                                    <div className="absolute top-1/2 w-full border-t border-gray-100" />
                                </div>
                            ))}
                        </div>
                    ))}
                    <GridOverlay columns={7} />
                </div>
            </div>
        </div>
    );
}

export default WeekView;