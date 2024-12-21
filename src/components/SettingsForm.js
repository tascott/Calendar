import React, { useState, useEffect } from 'react';

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
    const [formData, setFormData] = useState({
        primaryColor: initialSettings?.primaryColor || '#2C2C2C',
        defaultEventWidth: initialSettings?.defaultEventWidth || 80,
        defaultStatusWidth: initialSettings?.defaultStatusWidth || 20,
        dayStartTime: initialSettings?.dayStartTime || '06:00',
        dayEndTime: initialSettings?.dayEndTime || '22:00',
        font: initialSettings?.font || 'system-ui'
    });

    // Update form data when initialSettings changes
    useEffect(() => {
        setFormData({
            primaryColor: initialSettings?.primaryColor || '#2C2C2C',
            defaultEventWidth: initialSettings?.defaultEventWidth || 80,
            defaultStatusWidth: initialSettings?.defaultStatusWidth || 20,
            dayStartTime: initialSettings?.dayStartTime || '06:00',
            dayEndTime: initialSettings?.dayEndTime || '22:00',
            font: initialSettings?.font || 'system-ui'
        });
    }, [initialSettings]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleChange = (e) => {
        const newFormData = {
            ...formData,
            [e.target.name]: e.target.value
        };
        setFormData(newFormData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
                    Font
                </label>
                <select
                    name="font"
                    value={formData.font}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-[#2C2C2C] bg-[#F6F5F1] focus:outline-none focus:ring-1 focus:ring-[#2C2C2C]"
                    style={{ fontFamily: formData.font }}
                >
                    {SYSTEM_FONTS.map(font => (
                        <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                            {font.name}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
                    Primary Color
                </label>
                <input
                    type="color"
                    name="primaryColor"
                    value={formData.primaryColor}
                    onChange={handleChange}
                    className="w-full h-10 p-1 border border-[#2C2C2C] bg-[#F6F5F1] focus:outline-none focus:ring-1 focus:ring-[#2C2C2C]"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
                        Day Start Time
                    </label>
                    <input
                        type="time"
                        name="dayStartTime"
                        value={formData.dayStartTime}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-[#2C2C2C] bg-[#F6F5F1] focus:outline-none focus:ring-1 focus:ring-[#2C2C2C]"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
                        Day End Time
                    </label>
                    <input
                        type="time"
                        name="dayEndTime"
                        value={formData.dayEndTime}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-[#2C2C2C] bg-[#F6F5F1] focus:outline-none focus:ring-1 focus:ring-[#2C2C2C]"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
                    Default Event Width
                </label>
                <div className="flex items-center space-x-4">
                    <input
                        type="range"
                        min="10"
                        max="100"
                        name="defaultEventWidth"
                        value={formData.defaultEventWidth}
                        onChange={handleChange}
                        className="flex-1"
                    />
                    <span className="text-sm text-[#2C2C2C] w-12">
                        {formData.defaultEventWidth}%
                    </span>
                </div>
                <div className="mt-1 text-sm text-[#2C2C2C]/70">
                    Default width for new calendar events (10-100%)
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
                    Default Status Width
                </label>
                <div className="flex items-center space-x-4">
                    <input
                        type="range"
                        min="10"
                        max="100"
                        name="defaultStatusWidth"
                        value={formData.defaultStatusWidth}
                        onChange={handleChange}
                        className="flex-1"
                    />
                    <span className="text-sm text-[#2C2C2C] w-12">
                        {formData.defaultStatusWidth}%
                    </span>
                </div>
                <div className="mt-1 text-sm text-[#2C2C2C]/70">
                    Default width for new status events (10-100%)
                </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-normal text-[#2C2C2C] border border-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-[#F6F5F1] transition-colors duration-200"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-normal text-[#F6F5F1] bg-[#2C2C2C] border border-[#2C2C2C] hover:bg-[#2C2C2C]/90 transition-colors duration-200"
                >
                    Save Settings
                </button>
            </div>
        </form>
    );
}

export default SettingsForm;