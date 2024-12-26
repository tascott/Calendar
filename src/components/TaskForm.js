import React, { useState } from 'react';

function TaskForm({ onSubmit, onCancel }) {
    const [enableNudge, setEnableNudge] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = {
            time: e.target.time.value || new Date().toLocaleTimeString(),
            date: e.target.date.value || new Date().toISOString().split('T')[0],
            title: e.target.title.value,
            priority: e.target.priority.value,
            nudge: enableNudge ? parseInt(e.target.nudge.value, 10) : null,
            complete: false
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
                    defaultValue={new Date().toISOString().split('T')[0]}
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
                    defaultValue={new Date().toLocaleTimeString('en-US', { hour12: false }).slice(0, 5)}
                    className="w-full px-3 py-2 border border-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#2C2C2C] bg-[#F6F5F1]"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
                    Priority
                </label>
                <select
                    name="priority"
                    className="w-full px-3 py-2 border border-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#2C2C2C] bg-[#F6F5F1]"
                >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>
            </div>

            <div className="flex items-center">
                <input
                    type="checkbox"
                    id="enableNudge"
                    checked={enableNudge}
                    onChange={(e) => setEnableNudge(e.target.checked)}
                    className="h-4 w-4 border-[#2C2C2C] rounded"
                />
                <label htmlFor="enableNudge" className="ml-2 block text-sm font-medium text-[#2C2C2C]">
                    Enable Nudge Reminders
                </label>
            </div>

            {enableNudge && (
                <div>
                    <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
                        Nudge Every (minutes)
                    </label>
                    <input
                        type="number"
                        name="nudge"
                        min="1"
                        defaultValue="30"
                        className="w-full px-3 py-2 border border-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#2C2C2C] bg-[#F6F5F1]"
                    />
                </div>
            )}

            <div className="flex justify-end space-x-4 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-normal text-[#2C2C2C] border border-[#2C2C2C]"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-normal text-white bg-[#2C2C2C] border border-[#2C2C2C]"
                >
                    Create Task
                </button>
            </div>
        </form>
    );
}

export default TaskForm;