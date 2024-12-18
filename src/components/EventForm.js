import React, { useState } from 'react';

function EventForm({ onSubmit, onCancel, initialDate, initialTime }) {
    const [formData, setFormData] = useState({
        name: '',
        date: initialDate || new Date().toISOString().split('T')[0],
        startTime: initialTime || '09:00',
        endTime: initialTime ?
            new Date(new Date(`2000-01-01T${initialTime}`).getTime() + 60*60*1000).toTimeString().slice(0,5)
            : '10:00',
        type: 'event'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Event Name
                </label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter event name"
                />
            </div>

            <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                </label>
                <input
                    type="date"
                    id="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time
                    </label>
                    <input
                        type="time"
                        id="startTime"
                        name="startTime"
                        required
                        value={formData.startTime}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                    </label>
                    <input
                        type="time"
                        id="endTime"
                        name="endTime"
                        required
                        value={formData.endTime}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                </label>
                <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="event">Event</option>
                    <option value="status">Status</option>
                </select>
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
                    Create Event
                </button>
            </div>
        </form>
    );
}

export default EventForm;