import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import TimeColumn from '../components/TimeColumn';
import GridOverlay from '../components/GridOverlay';
import CurrentTimeLine from '../components/CurrentTimeLine';
import { Toaster } from 'react-hot-toast';

const DRAG_TYPE = 'event';

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

    const isStatus = event.type === 'status';

    const handleClick = (e) => {
        e.stopPropagation(); // Prevent grid's double-click from firing
        onClick?.(event);
    };

    const [{ isDragging }, drag] = useDrag(() => ({
        type: DRAG_TYPE,
        item: (monitor) => {
            const rect = elementRef.current?.getBoundingClientRect();
            const clientOffset = monitor.getClientOffset();

            return {
                id: event.id,
                startMinutes,
                duration,
                grabOffset: rect && clientOffset ? clientOffset.y - rect.top : 0
            };
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging()
        })
    }));

    // Combine refs
    const dragRef = (el) => {
        elementRef.current = el;
        drag(el);
    };

    return (
        <div
            ref={dragRef}
            onDoubleClick={handleClick}
            className={`absolute left-1 right-1 rounded-lg p-2 cursor-move hover:opacity-90 ${
                isStatus ? 'bg-yellow-100' : 'bg-blue-100'
            } ${isDragging ? 'opacity-50' : ''}`}
            style={{
                top: `${topPercentage}%`,
                height: `${heightPercentage}%`,
                minHeight: '1.5rem'
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

    const calculateMinutesFromMousePosition = (y, rect, grabOffset) => {
        // Subtract the grab offset to maintain relative position
        const adjustedY = y - grabOffset;
        const totalMinutes = (adjustedY / rect.height) * (24 * 60);
        return snapToNearestFifteen(Math.max(0, Math.min(totalMinutes, 24 * 60 - 15)));
    };

    const [, drop] = useDrop(() => ({
        accept: DRAG_TYPE,
        hover: (item, monitor) => {
            if (!gridRef.current) return;

            const rect = gridRef.current.getBoundingClientRect();
            const y = monitor.getClientOffset().y - rect.top;

            // Calculate new start time, accounting for grab offset
            const newStartMinutes = calculateMinutesFromMousePosition(y, rect, item.grabOffset);

            // Update event times
            const startTime = `${Math.floor(newStartMinutes / 60).toString().padStart(2, '0')}:${(newStartMinutes % 60).toString().padStart(2, '0')}`;
            const endMinutes = newStartMinutes + item.duration;
            const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

            onEventUpdate(item.id, { startTime, endTime });
        }
    }), [onEventUpdate]);

    const handleDoubleClick = (e) => {
        if (!onDoubleClick) return;

        // Get click position relative to grid
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;

        // Calculate minutes since start of day
        const totalMinutes = (y / rect.height) * (24 * 60);
        const snappedMinutes = snapToNearestFifteen(totalMinutes);

        // Convert to hours and minutes
        const hours = Math.floor(snappedMinutes / 60);
        const minutes = snappedMinutes % 60;

        // Format time string (HH:MM)
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        onDoubleClick(timeString);
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
                {/* Vertical grid overlay */}
                <GridOverlay />

                {/* Current time line */}
                <CurrentTimeLine events={events} />

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

                {/* Toast container */}
                <Toaster />
            </div>
        </div>
    );
}

export default DayView;