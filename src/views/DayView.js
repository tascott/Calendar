import React, { useRef, useCallback, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import TimeColumn from '../components/TimeColumn';
import GridOverlay from '../components/GridOverlay';
import CurrentTimeLine from '../components/CurrentTimeLine';
import { Toaster } from 'react-hot-toast';

const DRAG_TYPE = 'event';
const SNAP_INCREMENTS = Array.from({ length: 21 }, (_, i) => i * 5); // 0, 5, 10, ..., 100

function EventBlock({ event, onClick, onUpdate, settings }) {
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

    // Get visible time range
    const visibleStartMinutes = timeToMinutes(settings?.dayStartTime || '00:00');
    const visibleEndMinutes = timeToMinutes(settings?.dayEndTime || '24:00');
    const visibleDuration = visibleEndMinutes - visibleStartMinutes || 24 * 60; // Fallback to 24 hours if same time

    // Calculate position and height relative to visible range
    const topPercentage = ((startMinutes - visibleStartMinutes) / visibleDuration) * 100;
    const heightPercentage = (duration / visibleDuration) * 100;
    const leftPosition = event.xPosition || 0;

    const isStatus = event.type === 'status';
    const isOutOfRange = endMinutes <= visibleStartMinutes || startMinutes >= visibleEndMinutes;
    const isPartiallyVisible = (startMinutes < visibleStartMinutes && endMinutes > visibleStartMinutes) ||
                              (startMinutes < visibleEndMinutes && endMinutes > visibleEndMinutes);

    // Calculate clipped position and height for partially visible events
    let adjustedTop = topPercentage;
    let adjustedHeight = heightPercentage;

    if (isPartiallyVisible) {
        if (startMinutes < visibleStartMinutes) {
            adjustedTop = 0;
            adjustedHeight = ((endMinutes - visibleStartMinutes) / visibleDuration) * 100;
        }
        if (endMinutes > visibleEndMinutes) {
            adjustedHeight = ((visibleEndMinutes - Math.max(startMinutes, visibleStartMinutes)) / visibleDuration) * 100;
        }
    }

    const handleClick = (e) => {
        e.stopPropagation(); // Prevent grid's double-click from firing
        onClick?.(event);
    };

    const [{ isDragging }, drag] = useDrag({
        type: DRAG_TYPE,
        item: (monitor) => {
            const rect = elementRef.current.getBoundingClientRect();
            const clientOffset = monitor.getClientOffset();

            return {
                id: event.id,
                startMinutes: timeToMinutes(event.startTime),
                duration: timeToMinutes(event.endTime) - timeToMinutes(event.startTime),
                xPosition: event.xPosition || 0,
                width: event.width || 50,
                type: event.type,
                grabOffset: {
                    y: clientOffset.y - rect.top,
                    x: clientOffset.x - rect.left
                }
            };
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging()
        }),
        end: (item, monitor) => {
            if (!monitor.didDrop()) {
                // Reset to original position if not dropped on a valid target
                onEventUpdate(item.id, {
                    startTime: event.startTime,
                    endTime: event.endTime,
                    xPosition: event.xPosition,
                    width: event.width
                });
            }
        }
    });

    // Combine refs
    const dragRef = (el) => {
        elementRef.current = el;
        drag(el);
    };

    if (isOutOfRange) {
        return null;
    }

    return (
        <div
            ref={dragRef}
            onDoubleClick={handleClick}
            className={`absolute rounded-lg p-2 cursor-move hover:opacity-90 ${
                isStatus ? 'bg-yellow-100' : 'bg-blue-100'
            } ${isDragging ? 'opacity-50' : ''}`}
            style={{
                top: `${adjustedTop}%`,
                height: `${adjustedHeight}%`,
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

function DayView({ onDoubleClick, onEventUpdate, events = [], settings }) {
    const gridRef = useRef(null);

    const snapToNearestFifteen = (minutes) => {
        return Math.round(minutes / 15) * 15;
    };

    const snapToNearestFive = (percentage) => {
        return Math.round(percentage / 5) * 5;
    };

    // Convert time string to minutes since start of day
    const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const startMinutes = timeToMinutes(settings?.dayStartTime || '00:00');
    const endMinutes = timeToMinutes(settings?.dayEndTime || '24:00');
    const visibleHours = Math.ceil((endMinutes - startMinutes || 24 * 60) / 60);
    const startHour = Math.floor(startMinutes / 60);

    // Group events into visible and out-of-range
    const { visibleEvents, beforeRange, afterRange } = events.reduce((acc, event) => {
        const eventStart = timeToMinutes(event.startTime);
        const eventEnd = timeToMinutes(event.endTime);

        if (eventEnd <= startMinutes) {
            acc.beforeRange.push(event);
        } else if (eventStart >= endMinutes) {
            acc.afterRange.push(event);
        } else {
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
            let newStartMinutes = calculateMinutesFromMousePosition(y, rect, item.grabOffset);
            const newXPosition = calculateXPosition(x, rect, item.grabOffset, item.width, item.type === 'status');

            // Cap end time at midnight (24:00)
            const potentialEndMinutes = newStartMinutes + item.duration;
            if (potentialEndMinutes > 24 * 60) {
                // Adjust start time to ensure event ends at midnight
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

            // Store the current position in the item for the drop handler
            item.currentPosition = {
                startTime,
                endTime,
                xPosition: newXPosition,
                width: item.width,
                isDragging: true
            };

            onEventUpdate(item.id, item.currentPosition);
        },
        drop: (item) => {
            // On drop, trigger a final update with the stored position
            if (item.currentPosition) {
                onEventUpdate(item.id, {
                    ...item.currentPosition,
                    isDragging: false,
                    justDropped: true // Add a flag to indicate this is a final drop
                });
            }
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

    return (
        <div className="flex w-full">
            <TimeColumn startHour={startHour} numHours={visibleHours} />
            <div
                ref={drop}
                className="relative flex-1"
                onDoubleClick={handleDoubleClick}
                style={{
                    display: 'grid',
                    gridTemplateRows: `repeat(${visibleHours}, 3rem)`
                }}
            >
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
                            position === 50 ? 'bg-gray-300' : 'bg-gray-100'
                        }`}
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
                    {visibleEvents.map(event => (
                        <EventBlock
                            key={event.id}
                            event={event}
                            onClick={handleEventClick}
                            onUpdate={onEventUpdate}
                            settings={settings}
                        />
                    ))}
                </div>

                {/* Current time line */}
                <CurrentTimeLine events={events} settings={settings} />

                {/* Toast container */}
                <Toaster />
            </div>
        </div>
    );
}

export default DayView;