import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useDrop } from 'react-dnd';
import TimeColumn from '../components/TimeColumn';
import CurrentTimeLine from '../components/CurrentTimeLine';
import CalendarNavigation from '../components/CalendarNavigation';
import { Toaster } from 'react-hot-toast';
import TaskForm from '../components/TaskForm';
import Task from '../components/Task';
import EventBlock from '../components/EventBlock';

const DRAG_TYPE = 'event';
const SNAP_INCREMENTS = Array.from({ length: 21 }, (_, i) => i * 5); // 0, 5, 10, ..., 100

// Out of range indicator component
function OutOfRangeIndicator({ position, count }) {
    return (
        <div
            className={`absolute ${position === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 flex justify-center`}
            style={{ transform: position === 'top' ? 'translateY(-100%)' : 'translateY(100%)' }}
        >
            <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                {count} event{count !== 1 ? 's' : ''} not shown
            </div>
        </div>
    );
}

function DayView({ onDoubleClick, onEventUpdate, events = [], settings, currentDate = new Date(), onNavigate, tasks = [], onTaskUpdate, isLoading }) {
    const [selectedTask, setSelectedTask] = useState(null);
    const gridRef = useRef(null);

    // Filter events for the current day and include recurring events
    const currentDateStr = currentDate.toISOString().split('T')[0];
    const filteredEvents = events.filter(event => {
        // Check if it's the original event date
        if (event.date === currentDateStr) return true;

        // Handle recurring events
        if (!event.recurring || event.recurring === 'none') return false;

        const eventDate = new Date(event.date);
        let recurringDays;
        try {
            recurringDays = typeof event.recurringDays === 'string'
                ? JSON.parse(event.recurringDays)
                : event.recurringDays || {};
        } catch (error) {
            console.error('Error parsing recurringDays:', error);
            return false;
        }

        if (event.recurring === 'daily') {
            const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            return recurringDays[dayName];
        }

        if (event.recurring === 'weekly') {
            return currentDate.getDay() === eventDate.getDay();
        }

        if (event.recurring === 'monthly') {
            return currentDate.getDate() === eventDate.getDate();
        }

        return false;
    });

    const snapToNearestFifteen = (minutes) => {
        return Math.round(minutes / 15) * 15;
    };

    const snapToNearestFive = (percentage) => {
        return Math.round(percentage / 5) * 5;
    };

    // Convert time string to minutes since start of day
    const timeToMinutes = (timeStr) => {
        if (!timeStr) return 0; // Return 0 for undefined or empty time strings
        try {
            const [hours, minutes] = timeStr.split(':').map(Number);
            if (isNaN(hours) || isNaN(minutes)) return 0;
            return hours * 60 + minutes;
        } catch (error) {
            console.error('Error converting time to minutes:', error);
            return 0;
        }
    };

    const startMinutes = timeToMinutes(settings?.dayStartTime || '00:00');
    const endMinutes = timeToMinutes(settings?.dayEndTime || '24:00');
    const visibleHours = Math.ceil((endMinutes - startMinutes || 24 * 60) / 60);
    const startHour = Math.floor(startMinutes / 60);

    // Group events into visible and out-of-range
    const { visibleEvents, beforeRange, afterRange } = filteredEvents.reduce((acc, event) => {
        const eventStart = timeToMinutes(event.startTime);
        const eventEnd = timeToMinutes(event.endTime);

        // Event is completely before visible range
        if (eventEnd < startMinutes) {
            acc.beforeRange.push(event);
        }
        // Event is completely after visible range
        else if (eventStart > endMinutes) {
            acc.afterRange.push(event);
        }
        // Event overlaps with visible range
        else {
            acc.visibleEvents.push(event);
        }
        return acc;
    }, { visibleEvents: [], beforeRange: [], afterRange: [] });

    const calculateMinutesFromMousePosition = (y, rect, grabOffset) => {
        const adjustedY = y - grabOffset.y;
        const visibleMinutes = endMinutes - startMinutes;
        const totalMinutes = (adjustedY / rect.height) * visibleMinutes + startMinutes;
        return snapToNearestFifteen(Math.max(startMinutes, Math.min(totalMinutes, endMinutes - 15)));
    };

    const calculateXPosition = (x, rect, grabOffset, eventWidth, eventType) => {
        const adjustedX = x - grabOffset.x;
        const percentage = (adjustedX / rect.width) * 100;
        const snappedPercentage = snapToNearestFive(percentage);

        if (eventType === 'status' || eventType === 'focus') {
            // For status and focus events, ensure they don't go beyond the left edge
            // Maximum position is 100 - width
            return Math.max(0, Math.min(snappedPercentage, 100 - eventWidth));
        } else {
            // For regular events, keep them within bounds based on their width
            // Maximum position is 100 - width (instead of fixed 50)
            return Math.max(0, Math.min(snappedPercentage, 100 - eventWidth));
        }
    };

    const [, drop] = useDrop(() => ({
        accept: [DRAG_TYPE, 'task'],
        hover: (item, monitor) => {
            if (!gridRef.current) return;

            const rect = gridRef.current.getBoundingClientRect();
            const clientOffset = monitor.getClientOffset();
            const y = clientOffset.y - rect.top;
            const x = clientOffset.x - rect.left;

            if (item.type === DRAG_TYPE || item.type === 'status' || item.type === 'focus') {
                let newStartMinutes = calculateMinutesFromMousePosition(y, rect, item.grabOffset);
                const newXPosition = calculateXPosition(x, rect, item.grabOffset, item.width, item.type);

                // Cap end time at midnight (24:00)
                const potentialEndMinutes = newStartMinutes + item.duration;
                if (potentialEndMinutes > 24 * 60) {
                    newStartMinutes = (24 * 60) - item.duration;
                }

                // Format times
                const startHours = Math.floor(newStartMinutes / 60);
                const startMinutes = newStartMinutes % 60;
                const endMinutes = Math.min(newStartMinutes + item.duration, 24 * 60);
                const endHours = Math.floor(endMinutes / 60);
                const endMins = endMinutes % 60;

                const startTime = `${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;
                const endTime = endMinutes === 24 * 60
                    ? '24:00'
                    : `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

                item.currentPosition = {
                    id: item.id,
                    name: item.name,
                    startTime,
                    endTime,
                    xPosition: newXPosition,
                    width: item.width,
                    type: item.type,
                    backgroundColor: item.backgroundColor,
                    color: item.color,
                    isDragging: true,
                    isVisualOnly: true,
                    date: currentDateStr
                };

                onEventUpdate(item.id, item.currentPosition);
            }
        },
        drop: (item, monitor) => {
            if (item.type === DRAG_TYPE || item.type === 'status' || item.type === 'focus') {
                if (item.currentPosition) {
                    const { isVisualOnly, ...finalPosition } = item.currentPosition;
                    onEventUpdate(item.id, {
                        ...item,
                        ...finalPosition,
                        name: item.name,
                        isDragging: false,
                        date: currentDateStr,
                        width: item.width,
                        type: item.type,
                        backgroundColor: item.backgroundColor,
                        color: item.color
                    });
                }
            } else {
                const rect = gridRef.current.getBoundingClientRect();
                const clientOffset = monitor.getClientOffset();
                const x = clientOffset.x - rect.left;
                const y = clientOffset.y - rect.top;

                // Calculate new horizontal position
                const xPosition = snapToNearestFive((x / rect.width) * 100);

                // Calculate new time based on vertical position
                const visibleMinutes = endMinutes - startMinutes;
                const totalMinutes = (y / rect.height) * visibleMinutes + startMinutes;
                const snappedMinutes = snapToNearestFifteen(Math.max(startMinutes, Math.min(totalMinutes, endMinutes - 15)));

                // Convert to hours and minutes
                const hours = Math.floor(snappedMinutes / 60);
                const minutes = snappedMinutes % 60;
                const newTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

                // Only update if position or time has changed
                if (item.xposition !== xPosition || item.time !== newTime) {
                    onTaskUpdate({
                        ...item,
                        xposition: xPosition,
                        time: newTime,
                        isDragging: false,
                        date: item.date || currentDateStr
                    });
                }
            }
        }
    }), [onEventUpdate, onTaskUpdate, currentDateStr]);

    const handleGridDoubleClick = (e) => {
        if (!onDoubleClick) return;

        // Get click position relative to grid
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const x = e.clientX - rect.left;

        // Calculate x position as percentage
        const xPosition = snapToNearestFive((x / rect.width) * 100);
        // Ensure we don't start an event beyond the 50% mark
        const adjustedXPosition = Math.min(xPosition, 50);

        // Calculate minutes within visible range
        const visibleMinutes = endMinutes - startMinutes;
        const totalMinutes = (y / rect.height) * visibleMinutes + startMinutes;
        const snappedMinutes = snapToNearestFifteen(Math.max(startMinutes, Math.min(totalMinutes, endMinutes - 15)));

        // Convert to hours and minutes
        const hours = Math.floor(snappedMinutes / 60);
        const minutes = snappedMinutes % 60;

        // Format time string (HH:MM)
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        onDoubleClick(timeString, null, { xPosition: adjustedXPosition });
    };

    const handleEventClick = (event) => {
        onDoubleClick(event.startTime, event); // Pass the entire event object for editing
    };

    const handleTaskClick = (task) => {
        setSelectedTask(task);
    };

    const handleTaskSave = async (updatedTask) => {
        await onTaskUpdate(updatedTask);
        setSelectedTask(null);
    };

    const handleTaskDelete = async (taskId) => {
        await onTaskUpdate({ ...selectedTask, deleted: true });
        setSelectedTask(null);
    };

    return (
        <div className="flex flex-col w-full">
            <CalendarNavigation
                viewType="day"
                currentDate={currentDate}
                onNavigate={onNavigate}
            />
            <div className="flex w-full pt-4">
                <TimeColumn startHour={startHour} numHours={visibleHours} />
                <div
                    ref={drop}
                    className="relative flex-1"
                    onDoubleClick={handleGridDoubleClick}
                    style={{
                        display: 'grid',
                        gridTemplateRows: `repeat(${visibleHours}, 3rem)`
                    }}
                >
                    {/* Loading Overlay */}
                    {isLoading && (
                        <div className="fixed inset-0 bg-[#F6F5F1] bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-[1300]">
                            <div className="flex flex-col items-center space-y-4 bg-white p-6 rounded-lg shadow-lg">
                                <div className="w-12 h-12 border-4 border-[#2C2C2C] border-t-transparent rounded-full animate-spin"></div>
                                <div className="text-[#2C2C2C] font-medium text-lg">Loading template...</div>
                            </div>
                        </div>
                    )}

                    {/* Task indicators */}
                    {tasks.filter(task => task.date === currentDate.toISOString().split('T')[0]).map(task => {
                        const minutes = timeToMinutes(task.time);
                        const top = ((minutes - startMinutes) / (endMinutes - startMinutes)) * 100;

                        return (
                            <div
                                key={task.id}
                                className="absolute flex items-center cursor-pointer hover:opacity-75"
                                style={{
                                    top: `${top}%`,
                                    left: `${task.xposition || 50}%`,
                                    zIndex: 20,
                                    transform: 'translateY(-50%)'
                                }}
                                onClick={() => handleTaskClick(task)}
                            >
                                <Task
                                    task={task}
                                    onClick={() => handleTaskClick(task)}
                                    onPositionChange={(updatedTask) => onTaskUpdate(updatedTask)}
                                />
                            </div>
                        );
                    })}

                    {/* Task Edit Modal */}
                    {selectedTask && (
                        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-[1200]">
                            <div className="bg-[#F6F5F1] rounded-md border-2 border-[#2C2C2C] p-6 max-w-md w-full">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-normal text-[#2C2C2C]">Edit Task</h2>
                                    <button
                                        onClick={() => handleTaskDelete(selectedTask.id)}
                                        className="px-4 py-2 text-red-600 text-sm font-medium border-2 border-red-600 rounded hover:bg-red-50"
                                    >
                                        Delete Task
                                    </button>
                                </div>
                                <TaskForm
                                    onSubmit={handleTaskSave}
                                    onCancel={() => setSelectedTask(null)}
                                    initialData={selectedTask}
                                />
                            </div>
                        </div>
                    )}

                    {/* Out of range indicators */}
                    {beforeRange.length > 0 && (
                        <OutOfRangeIndicator position="top" count={beforeRange.length} />
                    )}
                    {afterRange.length > 0 && (
                        <OutOfRangeIndicator position="bottom" count={afterRange.length} />
                    )}

                    {/* Snap guides */}
                    {SNAP_INCREMENTS.map(position => (
                        <div
                            key={position}
                            className={`absolute top-0 bottom-0 w-px ${
                                position === 50 ? 'bg-gray-300' : 'bg-gray-200'
                            } pointer-events-none`}
                            style={{ left: `${position}%` }}
                        />
                    ))}

                    {/* Horizontal hour lines */}
                    {Array.from({ length: visibleHours + 1 }, (_, i) => (
                        <div
                            key={i}
                            className={`border-t border-gray-200 relative ${i === visibleHours ? 'border-b border-gray-200' : ''}`}
                        >
                            {i < visibleHours && (
                                <div className="absolute top-1/2 w-full border-t border-gray-100" />
                            )}
                        </div>
                    ))}

                    {/* Events */}
                    <div ref={gridRef} className="absolute inset-0">
                        {visibleEvents.map((event, index) => (
                            <EventBlock
                                key={`${event.originalEventId || event.id}-${event.date}-${index}`}
                                event={event}
                                onClick={handleEventClick}
                                onUpdate={onEventUpdate}
                                settings={settings}
                            />
                        ))}
                    </div>

                    {/* Current time line */}
                    <CurrentTimeLine events={events} settings={settings} tasks={tasks} onTaskUpdate={onTaskUpdate} />

                    {/* Toast container */}
                    <Toaster />
                </div>
            </div>
            <Toaster />
        </div>
    );
}

export default DayView;