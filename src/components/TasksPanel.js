import React from 'react';
import { format } from 'date-fns';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

function TasksPanel({ tasks = [], onTaskClick, onTaskDelete, isOpen, onToggle }) {
    return (
        <>
            {/* Tab - positioned independently */}
            <button
                onClick={onToggle}
                className="fixed right-0 top-[40%] bg-[#2C2C2C] text-white px-2 py-4 h-32 flex items-center border-2 border-r-0 border-[#2C2C2C] cursor-pointer z-50 rounded-r-md"
                style={{
                    writingMode: 'vertical-lr',
                    transform: 'rotate(180deg)',
                    borderTopRightRadius: '0.375rem',
                    borderBottomRightRadius: '0.375rem',
                }}
            >
                <span className="flex items-center gap-2">
                    {isOpen ? <FaChevronRight className="rotate-180" /> : <FaChevronLeft className="rotate-180" />}
                    Tasks
                </span>
            </button>

            {/* Panel - slides out independently */}
            <div className={`fixed right-0 top-1/2 -translate-y-1/2 h-[600px] transition-transform duration-300 z-40 ${
                isOpen ? 'translate-x-0' : 'translate-x-full'
            }`}>
                <div className="bg-[#F6F5F1] border-2 border-[#2C2C2C] shadow-lg h-full w-96 flex flex-col rounded-l-md">
                    <div className="p-4 border-b-2 border-[#2C2C2C] flex justify-between items-center">
                        <h2 className="text-lg font-normal text-[#2C2C2C]">Tasks</h2>
                        <button
                            onClick={onToggle}
                            className="text-[#2C2C2C] hover:text-[#4A4A4A] cursor-pointer"
                        >
                            <FaTimes />
                        </button>
                    </div>

                    {/* Tasks list */}
                    <div className="flex-1 overflow-y-auto p-4 pr-12">
                        {tasks.length === 0 ? (
                            <p className="text-gray-500 text-center">No tasks yet</p>
                        ) : (
                            <div className="space-y-4">
                                {tasks.map(task => (
                                    <div
                                        key={task.id}
                                        className="bg-white border-2 border-[#2C2C2C] p-4 space-y-2 rounded"
                                    >
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-lg font-medium text-[#2C2C2C]">
                                                {task.title}
                                            </h3>
                                            <span className={`text-sm px-2 py-1 rounded ${
                                                task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                                {task.priority}
                                            </span>
                                        </div>
                                        <div className="text-sm text-[#2C2C2C]/70">
                                            <div>Date: {format(new Date(task.date), 'MMM d, yyyy')}</div>
                                            <div>Time: {task.time}</div>
                                            {task.nudge && (
                                                <div>Nudge: {task.nudge}</div>
                                            )}
                                            {task.estimated_time !== undefined && (
                                                <div>Estimated: {task.estimated_time} minutes</div>
                                            )}
                                        </div>
                                        <div className="flex justify-end space-x-2 pt-2">
                                            <button
                                                onClick={() => onTaskClick(task)}
                                                className="text-sm text-[#2C2C2C] hover:underline cursor-pointer"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => onTaskDelete(task)}
                                                className="text-sm text-red-600 hover:underline cursor-pointer"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default TasksPanel;