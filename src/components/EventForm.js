import React, { useState, useEffect } from 'react';

// Default colors for different event types
const EVENT_DEFAULTS = {
    event: {
        backgroundColor: '#DBEAFE', // light blue
        color: '#1E40AF',          // dark blue
        width: 50
    },
    status: {
        backgroundColor: '#FEF3C7', // light yellow
        color: '#92400E',          // dark yellow/brown
        width: 20
    },
    focus: {
        backgroundColor: '#DCF7E3', // light green
        color: '#166534',          // dark green
        width: 20
    }
};

function EventForm({ onSubmit, onCancel, initialTime, initialDate, initialData }) {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        date: initialData?.date || initialDate,
        startTime: initialData?.startTime || initialTime || '09:00',
        endTime: initialData?.endTime || (initialTime ? addHour(initialTime) : '10:00'),
        type: initialData?.type || 'event',
        backgroundColor: initialData?.backgroundColor || EVENT_DEFAULTS.event.backgroundColor,
        color: initialData?.color || EVENT_DEFAULTS.event.color,
        width: initialData?.width || EVENT_DEFAULTS.event.width
    });

    // Helper function to add one hour to a time string
    function addHour(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const newHours = hours + 1;
        return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // Helper function to validate and adjust times
    function validateTimes(newStartTime, newEndTime) {
        const [startHours, startMinutes] = newStartTime.split(':').map(Number);
        const [endHours, endMinutes] = newEndTime.split(':').map(Number);
        const startInMinutes = startHours * 60 + startMinutes;
        const endInMinutes = endHours * 60 + endMinutes;

        if (endInMinutes <= startInMinutes) {
            return {
                startTime: newStartTime,
                endTime: addHour(newStartTime)
            };
        }

        return {
            startTime: newStartTime,
            endTime: newEndTime
        };
    }

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'startTime') {
            const [hours] = value.split(':').map(Number);
            if (hours < 9) return;

            const { startTime, endTime } = validateTimes(value, formData.endTime);
            setFormData(prev => ({
                ...prev,
                startTime,
                endTime
            }));
        } else if (name === 'endTime') {
            const [hours] = value.split(':').map(Number);
            if (hours < Math.floor(formData.startTime.split(':')[0]) + 1) return;

            const { startTime, endTime } = validateTimes(formData.startTime, value);
            setFormData(prev => ({
                ...prev,
                startTime,
                endTime
            }));
        } else if (name === 'type') {
            // Update colors and width when type changes
            const defaults = EVENT_DEFAULTS[value];
            setFormData(prev => ({
                ...prev,
                type: value,
                backgroundColor: defaults.backgroundColor,
                color: defaults.color,
                width: defaults.width
            }));
        } else if (name === 'width') {
            setFormData(prev => ({
                ...prev,
                width: Math.min(100, Math.max(10, parseInt(value, 10) || 0))
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Name
                </label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                </label>
                <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="event">Event</option>
                    <option value="status">Status</option>
                    <option value="focus">Focus</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                </label>
                <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time
                    </label>
                    <input
                        type="time"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleChange}
                        min="09:00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                    </label>
                    <input
                        type="time"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleChange}
                        min={addHour(formData.startTime)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Background Color
                    </label>
                    <input
                        type="color"
                        name="backgroundColor"
                        value={formData.backgroundColor}
                        onChange={handleChange}
                        className="w-full h-10 p-1 rounded border border-gray-300"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Text Color
                    </label>
                    <input
                        type="color"
                        name="color"
                        value={formData.color}
                        onChange={handleChange}
                        className="w-full h-10 p-1 rounded border border-gray-300"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Width
                </label>
                <div className="flex items-center space-x-4">
                    <input
                        type="range"
                        name="width"
                        min="10"
                        max="100"
                        value={formData.width}
                        onChange={handleChange}
                        className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-12">
                        {formData.width}%
                    </span>
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
                    {initialData ? 'Update Event' : 'Create Event'}
                </button>
            </div>

            {/* Preview */}
            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview
                </label>
                <div
                    className="p-3 rounded-lg"
                    style={{
                        backgroundColor: formData.backgroundColor,
                        color: formData.color,
                        width: `${formData.width}%`
                    }}
                >
                    <div className="font-medium">{formData.name || 'Event Name'}</div>
                    <div className="text-sm">{formData.startTime} - {formData.endTime}</div>
                </div>
            </div>
        </form>
    );
}

export default EventForm;