import React, { useState, useEffect } from 'react';

const EventForm = ({ onSubmit, onCancel, initialTime, initialDate, initialData, settings }) => {
    // Parse recurringDays from initialData if it exists
    const parseRecurringDays = (data) => {
        const defaultDays = {
            monday: false,
            tuesday: false,
            wednesday: false,
            thursday: false,
            friday: false,
            saturday: false,
            sunday: false
        };

        if (!data?.recurringDays) return defaultDays;

        try {
            // If it's a string, parse it
            if (typeof data.recurringDays === 'string') {
                return { ...defaultDays, ...JSON.parse(data.recurringDays) };
            }
            // If it's already an object, use it
            return { ...defaultDays, ...data.recurringDays };
        } catch (e) {
            console.error('[FORM] Error parsing recurringDays:', e);
            return defaultDays;
        }
    };

    const [formData, setFormData] = useState({
        id: initialData?.id || undefined,
        name: initialData?.name || '',
        date: initialData?.date || initialDate || new Date().toISOString().split('T')[0],
        startTime: initialData?.startTime || initialTime || '09:00',
        endTime: initialData?.endTime || (initialTime ? addHours(initialTime, 1) : '10:00'),
        type: initialData?.type || 'event',
        recurring: initialData?.recurring || 'none',
        recurringEventId: initialData?.recurringEventId || null,
        recurringDays: parseRecurringDays(initialData),
        backgroundColor: initialData?.backgroundColor || '#DBEAFE',
        color: initialData?.color || '#1E40AF',
        width: initialData?.width || (initialData?.type === 'status' ? (settings?.defaultStatusWidth || 20) : (settings?.defaultEventWidth || 80)),
        overlayText: initialData?.overlayText || 'Focus.'
    });

    // Update form data when initialData changes
    useEffect(() => {
        if (initialData) {
            console.log('[FORM] Initializing with data:', {
                id: initialData.id,
                recurring: initialData.recurring,
                recurringEventId: initialData.recurringEventId,
                recurringDays: parseRecurringDays(initialData)
            });
            setFormData({
                id: initialData.id,
                name: initialData.name || '',
                date: initialData.date || initialDate || new Date().toISOString().split('T')[0],
                startTime: initialData.startTime || initialTime || '09:00',
                endTime: initialData.endTime || (initialTime ? addHours(initialTime, 1) : '10:00'),
                type: initialData.type || 'event',
                recurring: initialData.recurring || 'none',
                recurringEventId: initialData.recurringEventId || null,
                recurringDays: parseRecurringDays(initialData),
                backgroundColor: initialData.backgroundColor || '#DBEAFE',
                color: initialData.color || '#1E40AF',
                width: initialData.width || (initialData.type === 'status' ? (settings?.defaultStatusWidth || 20) : (settings?.defaultEventWidth || 80)),
                overlayText: initialData?.overlayText || 'Focus.'
            });
        }
    }, [initialData, initialDate, initialTime, settings]);

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

    // Helper function to add hours to a time string
    function addHours(timeStr, hours) {
        if (!timeStr || typeof timeStr !== 'string') return '09:00';
        try {
            const [timeHours, timeMinutes] = timeStr.split(':').map(Number);
            const newHours = timeHours + hours;
            const newMinutes = timeMinutes;
            return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
        } catch (error) {
            console.error('Error processing time:', error);
            return '09:00';
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
        } else if (name === 'recurring') {
            if (value === 'none') {
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
            } else if (value === 'daily') {
                setFormData(prev => ({
                    ...prev,
                    recurring: value,
                    recurringDays: {
                        monday: true,
                        tuesday: true,
                        wednesday: true,
                        thursday: true,
                        friday: true,
                        saturday: true,
                        sunday: true
                    }
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    recurring: value
                }));
            }
        } else if (name === 'type') {
            setFormData(prev => ({
                ...prev,
                type: value,
                width: value === 'status' ? (settings?.defaultStatusWidth || 20) : (settings?.defaultEventWidth || 80)
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

        // Process the form data
        const processedData = {
            ...formData,
            // Ensure recurringDays is properly stringified
            recurringDays: formData.recurring === 'none' ?
                '{}' :
                JSON.stringify(formData.recurringDays)
        };

        onSubmit(processedData);
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this event?' +
            (initialData?.recurring !== 'none' ? ' This will delete all recurring instances.' : ''))) {
            console.log('[DELETE] Initiating delete for event:', {
                id: initialData?.id,
                recurring: initialData?.recurring,
                recurringEventId: initialData?.recurringEventId
            });

            // Use initialData for deletion to ensure we have the original event's properties
            onSubmit({
                id: initialData?.id,
                deleted: true,
                recurring: initialData?.recurring || 'none',
                recurringEventId: initialData?.recurringEventId
            });
        }
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
                    <div className="flex gap-2 items-center">
                        <input
                            type="time"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleChange}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => {
                                setFormData(prev => ({
                                    ...prev,
                                    startTime: settings?.dayStartTime || '00:00',
                                    endTime: settings?.dayEndTime || '23:59'
                                }));
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 whitespace-nowrap"
                        >
                            All Day
                        </button>
                    </div>
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

            <div className="flex justify-end space-x-4 mt-6">
                {initialData && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                    >
                        Delete Event
                    </button>
                )}
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
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