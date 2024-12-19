import React, { useState } from 'react';

function SettingsForm({ onSubmit, onCancel, initialSettings }) {
    const [primaryColor, setPrimaryColor] = useState(initialSettings.primaryColor);
    const [defaultEventWidth, setDefaultEventWidth] = useState(initialSettings.defaultEventWidth);
    const [defaultStatusWidth, setDefaultStatusWidth] = useState(initialSettings.defaultStatusWidth);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            primaryColor,
            defaultEventWidth,
            defaultStatusWidth
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Color
                </label>
                <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-20 p-1 rounded border border-gray-300"
                />
                <div className="mt-1 text-sm text-gray-500">
                    This color will be used for buttons and interactive elements
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Event Width
                </label>
                <div className="flex items-center space-x-4">
                    <input
                        type="range"
                        min="10"
                        max="100"
                        value={defaultEventWidth}
                        onChange={(e) => setDefaultEventWidth(parseInt(e.target.value, 10))}
                        className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-12">
                        {defaultEventWidth}%
                    </span>
                </div>
                <div className="mt-1 text-sm text-gray-500">
                    Default width for new calendar events (10-100%)
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Status Width
                </label>
                <div className="flex items-center space-x-4">
                    <input
                        type="range"
                        min="10"
                        max="100"
                        value={defaultStatusWidth}
                        onChange={(e) => setDefaultStatusWidth(parseInt(e.target.value, 10))}
                        className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-12">
                        {defaultStatusWidth}%
                    </span>
                </div>
                <div className="mt-1 text-sm text-gray-500">
                    Default width for new status events (10-100%), right-aligned
                </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    style={{ backgroundColor: primaryColor }}
                    className="px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Save Changes
                </button>
            </div>
        </form>
    );
}

export default SettingsForm;