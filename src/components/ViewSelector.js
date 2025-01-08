import React, { useState } from 'react';
import PomodoroDialog from './PomodoroDialog';

function ViewSelector({ currentView, onViewChange, primaryColor, onTemplatesClick }) {
    const views = ['day', 'week', 'month'];
    const [showPomodoro, setShowPomodoro] = useState(false);

    return (
        <>
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                    {views.map(view => (
                        <button
                            key={view}
                            onClick={() => onViewChange(view)}
                            style={currentView === view ? { backgroundColor: primaryColor } : {}}
                            className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                                currentView === view
                                    ? 'text-white hover:opacity-90'
                                    : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                            }`}
                        >
                            {view.charAt(0).toUpperCase() + view.slice(1)}
                        </button>
                    ))}
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={onTemplatesClick}
                        className="px-4 py-2 text-sm font-medium text-[#2C2C2C] border-2 border-[#2C2C2C] rounded hover:bg-[#F6F5F1] transition-colors duration-200 shadow-sm hover:shadow-md"
                    >
                        Templates
                    </button>
                    <button
                        onClick={() => setShowPomodoro(true)}
                        className="px-4 py-2 text-sm font-medium text-[#2C2C2C] border-2 border-[#2C2C2C] rounded hover:bg-[#F6F5F1] transition-colors duration-200 shadow-sm hover:shadow-md"
                    >
                        Pomodoro
                    </button>
                </div>
            </div>

            {showPomodoro && (
                <PomodoroDialog onClose={() => setShowPomodoro(false)} />
            )}
        </>
    );
}

export default ViewSelector;