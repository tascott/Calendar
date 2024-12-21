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
        width: 100,                // Changed from 20 to 100
        overlayText: 'focus.'      // Changed from text to overlayText
    }
};

function EventForm({ onSubmit, onCancel, initialTime, initialDate, initialData }) {
    // Parse recurringDays from initialData if it exists
    const getInitialRecurringDays = () => {
        const defaultDays = {
            monday: false,
            tuesday: false,
            wednesday: false,
            thursday: false,
            friday: false,
            saturday: false,
            sunday: false
        };

        if (!initialData?.recurringDays) return defaultDays;

        try {
            // If it's a string, try to parse it
            if (typeof initialData.recurringDays === 'string') {
                const parsed = JSON.parse(initialData.recurringDays);
                // Ensure we have boolean values
                return Object.keys(defaultDays).reduce((acc, day) => {
                    acc[day] = Boolean(parsed[day]);
                    return acc;
                }, {...defaultDays});
            }
            // If it's already an object, ensure we have boolean values
            return Object.keys(defaultDays).reduce((acc, day) => {
                acc[day] = Boolean(initialData.recurringDays[day]);
                return acc;
            }, {...defaultDays});
        } catch (e) {
            console.error('Error parsing recurringDays:', e);
            return defaultDays;
        }
    };

    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        date: initialData?.date || initialDate,
        startTime: initialData?.startTime || initialTime || '09:00',
        endTime: initialData?.endTime || (initialTime && addHalfHour(initialTime)) || '09:30',
        type: initialData?.type || 'event',
        backgroundColor: initialData?.backgroundColor || EVENT_DEFAULTS.event.backgroundColor,
        color: initialData?.color || EVENT_DEFAULTS.event.color,
        width: initialData?.width || EVENT_DEFAULTS.event.width,
        overlayText: initialData?.overlayText || EVENT_DEFAULTS.focus.overlayText,
        recurring: initialData?.recurring || 'none',
        recurringDays: getInitialRecurringDays(),
        recurringEventId: initialData?.recurringEventId || null
    });

    // Helper function to add 30 minutes to a time string
    function addHalfHour(timeStr) {
        if (!timeStr || typeof timeStr !== 'string') return '09:30';
        try {
            const [hours, minutes] = timeStr.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes + 30;
            const newHours = Math.floor(totalMinutes / 60);
            const newMinutes = totalMinutes % 60;
            return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
        } catch (error) {
            console.error('Error processing time:', error);
            return '09:30';
        }
    }

    // Helper function to validate and adjust times
    function validateTimes(newStartTime, newEndTime) {
        try {
            const [startHours, startMinutes] = newStartTime.split(':').map(Number);
            const [endHours, endMinutes] = newEndTime.split(':').map(Number);
            const startInMinutes = startHours * 60 + startMinutes;
            const endInMinutes = endHours * 60 + endMinutes;

            // Ensure minimum 30-minute duration
            if (endInMinutes < startInMinutes + 30) {
                return {
                    startTime: newStartTime,
                    endTime: addHalfHour(newStartTime)
                };
            }

            return {
                startTime: newStartTime,
                endTime: newEndTime
            };
        } catch (error) {
            console.error('Error validating times:', error);
            return {
                startTime: '09:00',
                endTime: '09:30'
            };
        }
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'startTime') {
            const { startTime, endTime } = validateTimes(value, formData.endTime);
            setFormData(prev => ({
                ...prev,
                startTime,
                endTime
            }));
        } else if (name === 'endTime') {
            const { startTime, endTime } = validateTimes(formData.startTime, value);
            setFormData(prev => ({
                ...prev,
                startTime,
                endTime
            }));
        } else if (name.startsWith('recurringDay-')) {
            const day = name.replace('recurringDay-', '');
            setFormData(prev => ({
                ...prev,
                recurringDays: {
                    ...prev.recurringDays,
                    [day]: checked
                }
            }));
        } else if (name === 'recurring' && value === 'none') {
            setFormData(prev => ({
                ...prev,
                recurring: value,
                recurringDays: {
                    monday: false,
                    tuesday: false,
                    wednesday: false,
                    thursday: false,
                    friday: false,
                    saturday: false,
                    sunday: false
                }
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

        // If this is a recurring event and we're creating a new event (not editing),
        // generate a unique recurring event ID
        const processedData = {
            ...formData,
            recurringEventId: formData.recurring !== 'none'
                ? (formData.recurringEventId || `recurring-${Date.now()}`)
                : null
        };

        onSubmit(processedData);
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

            {formData.type === 'focus' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Focus Overlay Message
                    </label>
                    <input
                        type="text"
                        name="overlayText"
                        value={formData.overlayText}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        required
                        placeholder="Text to display during focus sessions"
                    />
                </div>
            )}

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
                        min={addHalfHour(formData.startTime)}
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

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recurring
                </label>
                <select
                    name="recurring"
                    value={formData.recurring}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="none">Not recurring</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                </select>
            </div>

            {formData.recurring === 'daily' && (
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Repeat on
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {Object.entries({
                            monday: 'Mon',
                            tuesday: 'Tue',
                            wednesday: 'Wed',
                            thursday: 'Thu',
                            friday: 'Fri',
                            saturday: 'Sat',
                            sunday: 'Sun'
                        }).map(([day, label]) => (
                            <label key={day} className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    name={`recurringDay-${day}`}
                                    checked={formData.recurringDays[day]}
                                    onChange={handleChange}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">{label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

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
                        color: formData.color
                    }}
                >
                    <div className="font-medium">
                        {formData.name || 'Event Name'}
                    </div>
                    <div className="text-sm">{formData.startTime} - {formData.endTime}</div>
                </div>
            </div>
        </form>
    );
}

export default EventForm;