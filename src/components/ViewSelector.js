import React from 'react';

function ViewSelector({ currentView, onViewChange, primaryColor, onTemplatesClick }) {
    const views = ['day', 'week', 'month'];

    return (
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
            <button
                onClick={onTemplatesClick}
                className="px-4 py-2 text-sm font-medium text-[#2C2C2C] border-2 border-[#2C2C2C] rounded hover:bg-[#F6F5F1] transition-colors duration-200 shadow-sm hover:shadow-md"
            >
                Templates
            </button>
        </div>
    );
}

export default ViewSelector;