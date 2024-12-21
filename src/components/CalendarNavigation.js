import React from 'react';

function CalendarNavigation({ viewType, currentDate, onNavigate }) {
    const formatDate = (date) => {
        const options = {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        return date.toLocaleDateString('en-US', options);
    };

    const navigate = (direction) => {
        const newDate = new Date(currentDate);
        switch (viewType) {
            case 'day':
                newDate.setDate(currentDate.getDate() + direction);
                break;
            case 'week':
                newDate.setDate(currentDate.getDate() + (direction * 7));
                break;
            case 'month':
                newDate.setMonth(currentDate.getMonth() + direction);
                break;
        }
        onNavigate(newDate);
    };

    return (
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => navigate(-1)}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                    Previous
                </button>
                <button
                    onClick={() => navigate(1)}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                    Next
                </button>
                <button
                    onClick={() => onNavigate(new Date())}
                    className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-md transition-colors"
                >
                    Today
                </button>
            </div>
            <div className="text-lg font-medium">
                {formatDate(currentDate)}
            </div>
        </div>
    );
}

export default CalendarNavigation;