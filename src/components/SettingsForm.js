import React, { useState } from 'react';

// Common system fonts that are likely to be available
const SYSTEM_FONTS = [
    { name: 'System Default', value: 'system-ui' },
    { name: 'Arial', value: 'Arial' },
    { name: 'Helvetica', value: 'Helvetica' },
    { name: 'Times New Roman', value: 'Times New Roman' },
    { name: 'Georgia', value: 'Georgia' },
    { name: 'Verdana', value: 'Verdana' },
    { name: 'Tahoma', value: 'Tahoma' },
    { name: 'Trebuchet MS', value: 'Trebuchet MS' },
    { name: 'Courier New', value: 'Courier New' },
    { name: 'Monaco', value: 'Monaco' }
];

function SettingsForm({ onSubmit, onCancel, initialSettings }) {
    const [primaryColor, setPrimaryColor] = useState(initialSettings?.primaryColor || '#3B82F6');
    const [defaultEventWidth, setDefaultEventWidth] = useState(initialSettings?.defaultEventWidth || 80);
    const [defaultStatusWidth, setDefaultStatusWidth] = useState(initialSettings?.defaultStatusWidth || 20);
    const [dayStartTime, setDayStartTime] = useState(initialSettings?.dayStartTime || '06:00');
    const [dayEndTime, setDayEndTime] = useState(initialSettings?.dayEndTime || '22:00');
    const [selectedFont, setSelectedFont] = useState(initialSettings?.font || 'system-ui');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            primaryColor,
            defaultEventWidth,
            defaultStatusWidth,
            dayStartTime,
            dayEndTime,
            font: selectedFont
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Font
                </label>
                <select
                    value={selectedFont}
                    onChange={(e) => setSelectedFont(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    style={{ fontFamily: selectedFont }}
                >
                    {SYSTEM_FONTS.map(font => (
                        <option
                            key={font.value}
                            value={font.value}
                            style={{ fontFamily: font.value }}
                        >
                            {font.name}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Color
                </label>
                <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full h-10 p-1 rounded border border-gray-300"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Day Start Time
                    </label>
                    <input
                        type="time"
                        value={dayStartTime}
                        onChange={(e) => setDayStartTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Day End Time
                    </label>
                    <input
                        type="time"
                        value={dayEndTime}
                        onChange={(e) => setDayEndTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
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
                    Default width for new status events (10-100%)
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
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Save Settings
                </button>
            </div>
        </form>
    );
}

export default SettingsForm;