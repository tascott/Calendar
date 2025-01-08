import React from 'react';
import { useDrag } from 'react-dnd';

const TASK_TYPE = 'task';

const Task = ({ task, onClick, onPositionChange }) => {
    const [{ isDragging }, drag] = useDrag({
        type: TASK_TYPE,
        item: () => ({
            id: task.id,
            time: task.time,
            date: task.date,
            xposition: task.xposition || 0,
            title: task.title,
            priority: task.priority
        }),
        collect: (monitor) => ({
            isDragging: monitor.isDragging()
        })
    });

    return (
        <div
            ref={drag}
            className={`flex items-center bg-white px-2 py-1 rounded-md border-2 border-[#2C2C2C] shadow-sm ${
                isDragging ? 'opacity-50 scale-105' : ''
            }`}
        >
            <div
                className={`rounded-full w-3 h-3 cursor-move transition-all duration-150 ${
                    isDragging ? 'scale-105' : ''
                }`}
                style={{
                    backgroundColor: task.priority === 'high' ? '#EF4444' :
                                   task.priority === 'medium' ? '#F59E0B' : '#10B981',
                    transform: isDragging ? 'scale(1.2)' : 'scale(1)'
                }}
                title={task.title}
            />
            <span className="ml-2 text-xs text-[#2C2C2C] font-medium truncate max-w-[100px]">
                {task.title}
            </span>
        </div>
    );
};

export default Task;
