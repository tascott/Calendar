import React from 'react';

function GridOverlay({ columns = 100 }) {
    return (
        <div className={`absolute inset-0 grid grid-cols-[repeat(${columns},1fr)]`}>
            {Array.from({ length: columns }, (_, i) => (
                <div
                    key={i}
                    className="border-l border-gray-100 first:border-l-0"
                />
            ))}
        </div>
    );
}

export default GridOverlay;