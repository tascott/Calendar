import React, { useState } from 'react';

function TaskForm({ onSubmit, onCancel, initialData }) {
    const [enableNudge, setEnableNudge] = useState(initialData?.nudge != null);

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = {
            id: initialData?.id, // Preserve ID if editing
            time: e.target.time.value || new Date().toLocaleTimeString(),
            date: e.target.date.value || new Date().toISOString().split('T')[0],
            title: e.target.title.value,
            priority: e.target.priority.value,
            nudge: enableNudge ? parseInt(e.target.nudge.value, 10) : null,
            complete: initialData?.complete || false
        };
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
                    Title
                </label>
                <input
                    type="text"
                    name="title"
                    required
                    defaultValue={initialData?.title || ''}
                    className="w-full px-3 py-2 border border-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#2C2C2C] bg-[#F6F5F1]"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
                    Date
                </label>
                <input
                    type="date"
                    name="date"
                    defaultValue={initialData?.date || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#2C2C2C] bg-[#F6F5F1]"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
                    Time
                </label>
                <input
                    type="time"
                    name="time"
                    defaultValue={initialData?.time || new Date().toLocaleTimeString('en-US', { hour12: false }).slice(0, 5)}
                    className="w-full px-3 py-2 border border-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#2C2C2C] bg-[#F6F5F1]"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
                    Priority
                </label>
                <select
                    name="priority"
                    defaultValue={initialData?.priority || 'medium'}
                    className="w-full px-3 py-2 border border-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#2C2C2C] bg-[#F6F5F1]"
                >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>
            </div>
            <div className="space-y-2">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="enableNudge"
                        checked={enableNudge}
                        onChange={(e) => setEnableNudge(e.target.checked)}
                        className="mr-2"
                    />
                    <label htmlFor="enableNudge" className="text-sm font-medium text-[#2C2C2C]">
                        Enable Nudge
                    </label>
                </div>
                {enableNudge && (
                    <div>
                        <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
                            Nudge (minutes before)
                        </label>
                        <input
                            type="number"
                            name="nudge"
                            min="1"
                            defaultValue={initialData?.nudge || 15}
                            className="w-full px-3 py-2 border border-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#2C2C2C] bg-[#F6F5F1]"
                        />
                    </div>
                )}
            </div>
            <div className="flex justify-end space-x-4 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-[#2C2C2C] text-sm border border-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-[#F6F5F1] transition-colors duration-200"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-[#2C2C2C] text-sm border border-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-[#F6F5F1] transition-colors duration-200"
                >
                    {initialData ? 'Update Task' : 'Create Task'}
                </button>
            </div>
        </form>
    );
}

export default TaskForm;