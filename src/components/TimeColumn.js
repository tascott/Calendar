import React from 'react';

function TimeColumn({ startHour = 0, numHours = 24 }) {
    return (
        <div className="w-20 flex-none grid" style={{ gridTemplateRows: `repeat(${numHours}, 3rem)` }}>
            {Array.from({ length: numHours + 1 }, (_, i) => {
                const hour = (startHour + i) % 24;
                return (
                    <div key={i} className="relative text-right pr-4">
                        <span className="absolute right-4 -top-2.5 text-sm text-gray-500">
                            {hour.toString().padStart(2, '0')}:00
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

export default TimeColumn;