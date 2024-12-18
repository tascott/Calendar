import React from 'react';

function MonthView() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
            <div className="grid grid-rows-5 border-b border-gray-200">
                {Array.from({ length: 5 }, (_, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 h-32">
                        {Array.from({ length: 7 }, (_, dayIndex) => (
                            <div
                                key={dayIndex}
                                className="border-r border-b border-gray-200 p-2"
                            >
                                <div className="text-sm text-gray-500">
                                    {weekIndex * 7 + dayIndex + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MonthView;