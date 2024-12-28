import React, { useState } from 'react';

function TaskDialog({ task, onClose, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTask, setEditedTask] = useState(task);

    if (!task) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditedTask(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = () => {
        onUpdate(editedTask);
        setIsEditing(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]" onClick={onClose}>
            <div className="bg-[#F6F5F1] p-6 rounded-lg max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-4">
                    {isEditing ? (
                        <input
                            type="text"
                            name="title"
                            value={editedTask.title}
                            onChange={handleChange}
                            className="text-xl font-medium text-[#2C2C2C] bg-[#F6F5F1] border-b border-[#2C2C2C] focus:outline-none"
                        />
                    ) : (
                        <h2 className="text-xl font-medium text-[#2C2C2C]">{task.title}</h2>
                    )}
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="text-[#2C2C2C] hover:text-[#2C2C2C]/70"
                        >
                            {isEditing ? '✕' : '✎'}
                        </button>
                        <button
                            onClick={onClose}
                            className="text-[#2C2C2C] hover:text-[#2C2C2C]/70"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#2C2C2C]/70 mb-1">Time</label>
                        {isEditing ? (
                            <input
                                type="time"
                                name="time"
                                value={editedTask.time}
                                onChange={handleChange}
                                className="w-full px-2 py-1 text-[#2C2C2C] bg-[#F6F5F1] border border-[#2C2C2C] focus:outline-none"
                            />
                        ) : (
                            <div className="text-[#2C2C2C]">{task.time}</div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#2C2C2C]/70 mb-1">Date</label>
                        {isEditing ? (
                            <input
                                type="date"
                                name="date"
                                value={editedTask.date}
                                onChange={handleChange}
                                className="w-full px-2 py-1 text-[#2C2C2C] bg-[#F6F5F1] border border-[#2C2C2C] focus:outline-none"
                            />
                        ) : (
                            <div className="text-[#2C2C2C]">{task.date}</div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#2C2C2C]/70 mb-1">Priority</label>
                        {isEditing ? (
                            <select
                                name="priority"
                                value={editedTask.priority || ''}
                                onChange={handleChange}
                                className="w-full px-2 py-1 text-[#2C2C2C] bg-[#F6F5F1] border border-[#2C2C2C] focus:outline-none"
                            >
                                <option value="">None</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        ) : (
                            task.priority && <div className="text-[#2C2C2C]">{task.priority}</div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#2C2C2C]/70 mb-1">Nudge</label>
                        {isEditing ? (
                            <select
                                name="nudge"
                                value={editedTask.nudge || ''}
                                onChange={handleChange}
                                className="w-full px-2 py-1 text-[#2C2C2C] bg-[#F6F5F1] border border-[#2C2C2C] focus:outline-none"
                            >
                                <option value="">None</option>
                                <option value="5">Every 5 minutes</option>
                                <option value="10">Every 10 minutes</option>
                                <option value="15">Every 15 minutes</option>
                                <option value="30">Every 30 minutes</option>
                            </select>
                        ) : (
                            task.nudge && <div className="text-[#2C2C2C]">{task.nudge}</div>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-2">
                    {isEditing ? (
                        <>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 text-sm font-normal text-[#2C2C2C] border border-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-[#F6F5F1] transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 text-sm font-normal text-[#F6F5F1] bg-[#2C2C2C] border border-[#2C2C2C] hover:bg-[#2C2C2C]/90 transition-colors duration-200"
                            >
                                Save
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-normal text-[#2C2C2C] border border-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-[#F6F5F1] transition-colors duration-200"
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TaskDialog;