import React from 'react';

function ViewSelector({ currentView, onViewChange }) {
    const views = ['Day', 'Week', 'Month'];

    return (
        <div className="flex space-x-2 mb-4">
            {views.map(view => (
                <button
                    key={view}
                    onClick={() => onViewChange(view.toLowerCase())}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                        ${currentView === view.toLowerCase()
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    {view}
                </button>
            ))}
        </div>
    );
}

export default ViewSelector;