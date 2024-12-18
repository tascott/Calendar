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

function GridOverlay() {
    return (
        <div className="absolute inset-0 grid grid-cols-[repeat(100,1fr)]">
            {Array.from({ length: 100 }, (_, i) => (
                <div
                    key={i}
                    className="border-l border-gray-100 first:border-l-0"
                />
            ))}
        </div>
    );
}

function DayGrid() {
    return (
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
    );
}

function App() {
    return (
        <div className="h-screen w-full flex flex-col bg-gray-100">
            {/* Header */}
            <header className="flex-none w-full bg-white shadow-sm">
                <div className="max-w-[1600px] w-full mx-auto px-4 py-4">
                    <h1 className="text-2xl font-semibold text-gray-800">My Calendar</h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full overflow-auto py-4">
                <div className="max-w-[1600px] w-full mx-auto px-4">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex w-full">
                            <TimeColumn />
                            <DayGrid />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;
