import React, { useState } from 'react';
import DayView from './views/DayView';
import WeekView from './views/WeekView';
import MonthView from './views/MonthView';
import ViewSelector from './components/ViewSelector';

function App() {
    const [currentView, setCurrentView] = useState('day');

    const renderView = () => {
        switch (currentView) {
            case 'week':
                return <WeekView />;
            case 'month':
                return <MonthView />;
            default:
                return <DayView />;
        }
    };

    return (
        <div className="h-screen w-full flex flex-col bg-gray-100">
            {/* Header */}
            <header className="flex-none w-full bg-white shadow-sm">
                <div className="max-w-[1600px] w-full mx-auto px-4 py-4">
                    <h1 className="text-2xl font-semibold text-gray-800 mb-4">My Calendar</h1>
                    <ViewSelector currentView={currentView} onViewChange={setCurrentView} />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full overflow-auto py-4">
                <div className="max-w-[1600px] w-full mx-auto px-4">
                    <div className="bg-white rounded-lg shadow p-6">
                        {renderView()}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;
