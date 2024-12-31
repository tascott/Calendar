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
            className={`rounded-full w-3 h-3 cursor-move transition-all duration-150 ${
                isDragging ? 'opacity-50 scale-105' : ''
            }`}
            style={{
                backgroundColor: task.priority === 'high' ? '#EF4444' :
                               task.priority === 'medium' ? '#F59E0B' : '#10B981',
                transform: isDragging ? 'scale(1.2)' : 'scale(1)'
            }}
            title={task.title}
        />
    );
};

export default Task;
