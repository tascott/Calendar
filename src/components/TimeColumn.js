import React from 'react';

function TimeColumn() {
    const hours = Array.from({ length: 24 }, (_, i) =>
        i.toString().padStart(2, '0') + ':00'
    );

    return (
        <div className="w-20 pr-4 flex flex-col text-right text-sm text-gray-500">
            {hours.map((time) => (
                <div key={time} className="h-12">{time}</div>
            ))}
        </div>
    );
}

export default TimeColumn;