import React, { useState } from 'react';
import PomodoroDialog from './PomodoroDialog';

function ViewSelector({ currentView, onViewChange, primaryColor, onTemplatesClick }) {
    const views = ['day', 'week', 'month'];
    const [showPomodoro, setShowPomodoro] = useState(false);

    return (
        <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {views.map(view => (
                        <button
                            key={view}
                            onClick={() => onViewChange(view)}
                            style={currentView === view ? { backgroundColor: primaryColor } : {}}
                            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                                currentView === view
                                    ? 'text-white hover:opacity-90'
                                    : 'text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-300'
                            }`}
                        >
                            {view.charAt(0).toUpperCase() + view.slice(1)}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={onTemplatesClick}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm font-medium text-[#2C2C2C] border-2 border-[#2C2C2C] rounded hover:bg-[#F6F5F1] transition-colors duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                    >
                        Templates
                    </button>
                    <button
                        onClick={() => setShowPomodoro(true)}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm font-medium text-[#2C2C2C] border-2 border-[#2C2C2C] rounded hover:bg-[#F6F5F1] transition-colors duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
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