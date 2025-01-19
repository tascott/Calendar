import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useDrag } from 'react-dnd';

const DRAG_TYPE = 'event';

function EventBlock({ event, onClick, onUpdate, settings }) {
    const elementRef = useRef(null);
    const touchTimeout = useRef(null);
    const lastTap = useRef(0);
    const [isLongPress, setIsLongPress] = useState(false);
    const [isTouched, setIsTouched] = useState(false);

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

    // Convert minutes to time string
    const minutesToTime = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    const startMinutes = timeToMinutes(event.startTime);
    const endMinutes = timeToMinutes(event.endTime);
    const duration = endMinutes - startMinutes;
    const isShortEvent = duration <= 45; // Check if event is 45 minutes or less

    // Get visible time range
    const visibleStartMinutes = timeToMinutes(settings?.dayStartTime || '00:00');
    const visibleEndMinutes = timeToMinutes(settings?.dayEndTime || '24:00');
    const visibleDuration = visibleEndMinutes - visibleStartMinutes || 24 * 60; // Fallback to 24 hours if same time

    // Calculate position and height relative to visible range
    const topPercentage = ((startMinutes - visibleStartMinutes) / visibleDuration) * 100;
    const heightPercentage = (duration / visibleDuration) * 100;
    const leftPosition = event.xPosition || 0;

    const isStatus = event.type === 'status';
    const isOutOfRange = endMinutes < visibleStartMinutes || startMinutes > visibleEndMinutes;
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
    }, [event.id, isLongPress, isTouched]);

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
                name: event.name,
                startMinutes: timeToMinutes(event.startTime),
                duration: timeToMinutes(event.endTime) - timeToMinutes(event.startTime),
                startTime: event.startTime,
                endTime: event.endTime,
                xPosition: event.xPosition || 0,
                width: event.width || 50,
                type: event.type,
                backgroundColor: event.backgroundColor,
                color: event.color,
                recurring: event.recurring,
                recurringEventId: event.recurringEventId,
                recurringDays: event.recurringDays,
                date: event.date,
                grabOffset: {
                    y: clientOffset ? clientOffset.y - rect.top : 0,
                    x: clientOffset ? clientOffset.x - rect.left : 0
                }
            };
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging()
        }),
        canDrag: () => {
            const isTouchDevice = 'ontouchstart' in window;
            const canDrag = isTouchDevice ? isLongPress : true;
            console.log('[EventBlock] Can drag check:', {
                eventId: event.id,
                canDrag,
                isTouchDevice,
                isLongPress
            });
            return canDrag;
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
                        <span className="material-icons text-xs" style={{ fontSize: '14px' }}>autorenew</span>
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

export default EventBlock;