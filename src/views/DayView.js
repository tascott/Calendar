import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import TimeColumn from '../components/TimeColumn';
import GridOverlay from '../components/GridOverlay';
import CurrentTimeLine from '../components/CurrentTimeLine';
import CalendarNavigation from '../components/CalendarNavigation';
import { Toaster } from 'react-hot-toast';

const DRAG_TYPE = 'event';
const SNAP_INCREMENTS = Array.from({ length: 21 }, (_, i) => i * 5); // 0, 5, 10, ..., 100

function EventBlock({ event, onClick, onUpdate, settings }) {
    const elementRef = useRef(null);
    const touchTimeout = useRef(null);
    const lastTap = useRef(0);
    const [isLongPress, setIsLongPress] = useState(false);
    const [isTouched, setIsTouched] = useState(false);

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
    const isShortEvent = duration < 45; // Check if event is less than 45 minutes

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

    const handleTouchStart = useCallback((e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap.current;

        setIsTouched(true);

        if (tapLength < 300 && tapLength > 0) {
            // Double tap detected
            handleDoubleClick(e);
            lastTap.current = 0;
            setIsTouched(false);
        } else {
            // Start potential drag
            lastTap.current = currentTime;
            touchTimeout.current = setTimeout(() => {
                setIsLongPress(true);
                // Add a subtle vibration when drag is ready
                if ('vibrate' in navigator) {
                    navigator.vibrate(50);
                }
            }, 100);
        }
    }, []);

    const handleTouchMove = useCallback((e) => {
        // Clear the timeout and last tap if we're moving
        if (touchTimeout.current) {
            clearTimeout(touchTimeout.current);
        }
        lastTap.current = 0;
        if (!isLongPress) {
            setIsTouched(false);
        }
    }, [isLongPress]);

    const handleTouchEnd = useCallback((e) => {
        if (touchTimeout.current) {
            clearTimeout(touchTimeout.current);
        }
        setIsLongPress(false);
        setIsTouched(false);
    }, []);

    const handleDoubleClick = (e) => {
        e.stopPropagation();
        onClick?.(event);
    };

    // Clean up timeout on unmount
    useEffect(() => {
        return () => {
            if (touchTimeout.current) {
                clearTimeout(touchTimeout.current);
            }
        };
    }, []);

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
                backgroundColor: event.backgroundColor,
                color: event.color,
                grabOffset: {
                    y: clientOffset.y - rect.top,
                    x: clientOffset.x - rect.left
                }
            };
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging()
        }),
        options: {
            delayTouchStart: 100
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
            onDoubleClick={handleDoubleClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`absolute rounded-[1px] select-none transition-all duration-150 border border-[#D3D1C7] ${
                isDragging ? 'opacity-50 scale-105' : 'hover:opacity-90'
            } ${isLongPress ? 'cursor-move scale-105 shadow-lg' : 'cursor-pointer'} ${
                isTouched ? 'ring-2 ring-blue-400' : ''
            }`}
            style={{
                top: `${adjustedTop}%`,
                height: `${adjustedHeight}%`,
                minHeight: '1.5rem',
                left: `${leftPosition}%`,
                width: `${event.width || 50}%`,
                backgroundColor: event.backgroundColor || (event.type === 'status' ? '#FEF3C7' : '#DBEAFE'),
                color: event.color || (event.type === 'status' ? '#92400E' : '#1E40AF'),
                touchAction: 'none',
                transform: isLongPress ? 'scale(1.05)' : 'none',
                boxShadow: isLongPress ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none',
                padding: isShortEvent ? '0.25rem 0.5rem' : '0.5rem'
            }}
        >
            {isLongPress && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                    Ready to drag
                </div>
            )}
            <div className="flex items-start space-x-1">
                {event.isRecurring && (
                    <div className="recurring-icon">
                        <span className="material-icons">repeat</span>
                    </div>
                )}
                <div className="flex-1">
                    {isShortEvent ? (
                        <div className="text-sm truncate">
                            {event.name} ({event.startTime} - {event.endTime})
                        </div>
                    ) : (
                        <>
                            <div className="text-sm font-medium truncate">
                                {event.name}
                            </div>
                            <div className="text-xs truncate">
                                {event.startTime} - {event.endTime}
                            </div>
                        </>
                    )}
                </div>
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

function DayView({ onDoubleClick, onEventUpdate, events = [], settings, currentDate = new Date(), onNavigate }) {
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
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const startMinutes = timeToMinutes(settings?.dayStartTime || '00:00');
    const endMinutes = timeToMinutes(settings?.dayEndTime || '24:00');
    const visibleHours = Math.ceil((endMinutes - startMinutes || 24 * 60) / 60);
    const startHour = Math.floor(startMinutes / 60);

    // Group events into visible and out-of-range
    const { visibleEvents, beforeRange, afterRange } = filteredEvents.reduce((acc, event) => {
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
        accept: DRAG_TYPE,
        hover: (item, monitor) => {
            if (!gridRef.current) return;

            const rect = gridRef.current.getBoundingClientRect();
            const clientOffset = monitor.getClientOffset();
            const y = clientOffset.y - rect.top;
            const x = clientOffset.x - rect.left;

            // Calculate new start time and x position
            let newStartMinutes = calculateMinutesFromMousePosition(y, rect, item.grabOffset);
            const newXPosition = calculateXPosition(x, rect, item.grabOffset, item.width, item.type);

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
        </div>
    );
}

export default DayView;