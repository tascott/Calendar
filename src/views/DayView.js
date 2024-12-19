import React, { useRef, useCallback } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import TimeColumn from '../components/TimeColumn';
import GridOverlay from '../components/GridOverlay';
import CurrentTimeLine from '../components/CurrentTimeLine';
import { Toaster } from 'react-hot-toast';

const DRAG_TYPE = 'event';
const SNAP_INCREMENTS = Array.from({ length: 21 }, (_, i) => i * 5); // 0, 5, 10, ..., 100

function EventBlock({ event, onClick, onUpdate }) {
    const elementRef = useRef(null);

    // Convert time string to minutes since start of day
    const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    // Convert minutes to time string
    const minutesToTime = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    const startMinutes = timeToMinutes(event.startTime);
    const endMinutes = timeToMinutes(event.endTime);
    const duration = endMinutes - startMinutes;

    // Calculate position and height
    const topPercentage = (startMinutes / (24 * 60)) * 100;
    const heightPercentage = (duration / (24 * 60)) * 100;
    const leftPosition = event.xPosition || 0;

    const isStatus = event.type === 'status';

    const handleClick = (e) => {
        e.stopPropagation(); // Prevent grid's double-click from firing
        onClick?.(event);
    };

    // Memoize the drag item creator to ensure it uses the latest event data
    const createDragItem = useCallback((monitor) => {
        const rect = elementRef.current?.getBoundingClientRect();
        const clientOffset = monitor.getClientOffset();

        // Recalculate duration from current event times
        const currentStartMinutes = timeToMinutes(event.startTime);
        const currentEndMinutes = timeToMinutes(event.endTime);
        const currentDuration = currentEndMinutes - currentStartMinutes;

        return {
            id: event.id,
            startMinutes: currentStartMinutes,
            duration: currentDuration,
            xPosition: event.xPosition || 0,
            width: event.width || 50,
            type: event.type,
            grabOffset: rect && clientOffset ? {
                y: clientOffset.y - rect.top,
                x: clientOffset.x - rect.left
            } : { x: 0, y: 0 }
        };
    }, [event]); // Depend on the entire event object to update when any part changes

    const [{ isDragging }, drag] = useDrag(() => ({
        type: DRAG_TYPE,
        item: createDragItem,
        collect: (monitor) => ({
            isDragging: monitor.isDragging()
        })
    }), [createDragItem]); // Update when createDragItem changes

    // Combine refs
    const dragRef = (el) => {
        elementRef.current = el;
        drag(el);
    };

    return (
        <div
            ref={dragRef}
            onDoubleClick={handleClick}
            className={`absolute rounded-lg p-2 cursor-move hover:opacity-90 ${
                isStatus ? 'bg-yellow-100' : 'bg-blue-100'
            } ${isDragging ? 'opacity-50' : ''}`}
            style={{
                top: `${topPercentage}%`,
                height: `${heightPercentage}%`,
                minHeight: '1.5rem',
                left: `${leftPosition}%`,
                width: `${event.width || 50}%`
            }}
        >
            <div className={`text-sm font-medium ${
                isStatus ? 'text-yellow-800' : 'text-blue-800'
            }`}>
                {event.name}
            </div>
            <div className={`text-xs ${
                isStatus ? 'text-yellow-600' : 'text-blue-600'
            }`}>
                {event.startTime} - {event.endTime}
            </div>
        </div>
    );
}

function DayView({ onDoubleClick, onEventUpdate, events = [] }) {
    const gridRef = useRef(null);

    const snapToNearestFifteen = (minutes) => {
        return Math.round(minutes / 15) * 15;
    };

    const snapToNearestFive = (percentage) => {
        return Math.round(percentage / 5) * 5;
    };

    const calculateMinutesFromMousePosition = (y, rect, grabOffset) => {
        // Subtract the grab offset to maintain relative position
        const adjustedY = y - grabOffset.y;
        const totalMinutes = (adjustedY / rect.height) * (24 * 60);
        return snapToNearestFifteen(Math.max(0, Math.min(totalMinutes, 24 * 60 - 15)));
    };

    const calculateXPosition = (x, rect, grabOffset, eventWidth, isStatus) => {
        const adjustedX = x - grabOffset.x;
        const percentage = (adjustedX / rect.width) * 100;
        const snappedPercentage = snapToNearestFive(percentage);

        if (isStatus) {
            // For status events, ensure they don't go beyond the left edge
            // Maximum position is 100 - width
            return Math.max(0, Math.min(snappedPercentage, 100 - eventWidth));
        } else {
            // For regular events, keep them in the left half
            return Math.max(0, Math.min(snappedPercentage, 50));
        }
    };

    const [, drop] = useDrop(() => ({
        accept: DRAG_TYPE,
        hover: (item, monitor) => {
            if (!gridRef.current) return;

            const rect = gridRef.current.getBoundingClientRect();
            const clientOffset = monitor.getClientOffset();
            const y = clientOffset.y - rect.top;
            const x = clientOffset.x - rect.left;

            // Calculate new start time and x position
            const newStartMinutes = calculateMinutesFromMousePosition(y, rect, item.grabOffset);
            const newXPosition = calculateXPosition(x, rect, item.grabOffset, item.width, item.type === 'status');

            // Update event times and position
            const startTime = `${Math.floor(newStartMinutes / 60).toString().padStart(2, '0')}:${(newStartMinutes % 60).toString().padStart(2, '0')}`;
            const endMinutes = newStartMinutes + item.duration;
            const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

            onEventUpdate(item.id, {
                startTime,
                endTime,
                xPosition: newXPosition,
                width: item.width
            });
        }
    }), [onEventUpdate]);

    const handleDoubleClick = (e) => {
        if (!onDoubleClick) return;

        // Get click position relative to grid
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const x = e.clientX - rect.left;

        // Calculate x position as percentage
        const xPosition = snapToNearestFive((x / rect.width) * 100);
        // Ensure we don't start an event beyond the 50% mark
        const adjustedXPosition = Math.min(xPosition, 50);

        // Calculate minutes since start of day
        const totalMinutes = (y / rect.height) * (24 * 60);
        const snappedMinutes = snapToNearestFifteen(totalMinutes);

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

    return (
        <div className="flex w-full">
            <TimeColumn />
            <div
                ref={drop}
                className="relative flex-1 grid grid-rows-[repeat(24,3rem)]"
                onDoubleClick={handleDoubleClick}
            >
                {/* Snap guides */}
                {SNAP_INCREMENTS.map(position => (
                    <div
                        key={position}
                        className={`absolute top-0 bottom-0 w-px ${
                            position === 50 ? 'bg-gray-300' : 'bg-gray-100'
                        }`}
                        style={{ left: `${position}%` }}
                    />
                ))}

                {/* Horizontal hour lines */}
                {Array.from({ length: 24 }, (_, i) => (
                    <div
                        key={i}
                        className="border-t border-gray-200 relative"
                    >
                        {/* 30-minute marker */}
                        <div className="absolute top-1/2 w-full border-t border-gray-100" />
                    </div>
                ))}

                {/* Events */}
                <div ref={gridRef} className="absolute inset-0">
                    {events.map(event => (
                        <EventBlock
                            key={event.id}
                            event={event}
                            onClick={handleEventClick}
                            onUpdate={onEventUpdate}
                        />
                    ))}
                </div>

                {/* Current time line */}
                <CurrentTimeLine events={events} />

                {/* Toast container */}
                <Toaster />
            </div>
        </div>
    );
}

export default DayView;