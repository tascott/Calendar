import React, { useState } from 'react';

function SettingsForm({ onSubmit, onCancel, initialSettings }) {
    const [settings, setSettings] = useState({
        dayStartTime: initialSettings?.dayStartTime || '06:00',
        dayEndTime: initialSettings?.dayEndTime || '22:00',
        primaryColor: initialSettings?.primaryColor || '#3B82F6', // Tailwind blue-500
        defaultEventWidth: initialSettings?.defaultEventWidth || 50,
        statusEventWidth: initialSettings?.statusEventWidth || 50,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(settings);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="dayStartTime" className="block text-sm font-medium text-gray-700 mb-1">
                        Day Start Time
                    </label>
                    <input
                        type="time"
                        id="dayStartTime"
                        name="dayStartTime"
                        value={settings.dayStartTime}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label htmlFor="dayEndTime" className="block text-sm font-medium text-gray-700 mb-1">
                        Day End Time
                    </label>
                    <input
                        type="time"
                        id="dayEndTime"
                        name="dayEndTime"
                        value={settings.dayEndTime}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Color
                </label>
                <div className="flex items-center space-x-2">
                    <input
                        type="color"
                        id="primaryColor"
                        name="primaryColor"
                        value={settings.primaryColor}
                        onChange={handleChange}
                        className="h-10 w-20 p-1 rounded border border-gray-300"
                    />
                    <span className="text-sm text-gray-500">{settings.primaryColor}</span>
                </div>
            </div>

            <div>
                <label htmlFor="defaultEventWidth" className="block text-sm font-medium text-gray-700 mb-1">
                    Default Event Width (%)
                </label>
                <div className="flex items-center space-x-2">
                    <input
                        type="range"
                        id="defaultEventWidth"
                        name="defaultEventWidth"
                        min="20"
                        max="100"
                        value={settings.defaultEventWidth}
                        onChange={handleChange}
                        className="flex-1"
                    />
                    <span className="text-sm text-gray-500 w-12">{settings.defaultEventWidth}%</span>
                </div>
            </div>

            <div>
                <label htmlFor="statusEventWidth" className="block text-sm font-medium text-gray-700 mb-1">
                    Status Event Width (%)
                </label>
                <div className="flex items-center space-x-2">
                    <input
                        type="range"
                        id="statusEventWidth"
                        name="statusEventWidth"
                        min="20"
                        max="100"
                        value={settings.statusEventWidth}
                        onChange={handleChange}
                        className="flex-1"
                    />
                    <span className="text-sm text-gray-500 w-12">{settings.statusEventWidth}%</span>
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Save Settings
                </button>
            </div>
        </form>
    );
}

export default SettingsForm;