import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { isTouchDevice } from './utils/device';
import DayView from './views/DayView';
import WeekView from './views/WeekView';
import MonthView from './views/MonthView';
import ViewSelector from './components/ViewSelector';
import EventForm from './components/EventForm';
import SettingsForm from './components/SettingsForm';
import StatusOverlay from './components/StatusOverlay';

// Initial events for testing
const initialEvents = [
    {
        id: 1,
        name: "Team Meeting",
        date: new Date().toISOString().split('T')[0],
        startTime: "13:00",
        endTime: "15:30",
        type: "event"
    },
    {
        id: 2,
        name: "Focus Time",
        date: new Date().toISOString().split('T')[0],
        startTime: "10:00",
        endTime: "12:00",
        type: "focus",
        xPosition: 80,
        width: 20
    }
];

function App() {
    const [currentView, setCurrentView] = useState('day');
    const [events, setEvents] = useState(initialEvents);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [selectedTime, setSelectedTime] = useState(null);
    const [editingEvent, setEditingEvent] = useState(null);
    const [primaryColor, setPrimaryColor] = useState(() => {
        return localStorage.getItem('primaryColor') || '#3B82F6';
    });
    const [defaultEventWidth, setDefaultEventWidth] = useState(() => {
        return parseInt(localStorage.getItem('defaultEventWidth') || '80', 10);
    });
    const [defaultStatusWidth, setDefaultStatusWidth] = useState(() => {
        return parseInt(localStorage.getItem('defaultStatusWidth') || '20', 10);
    });
    const [dayStartTime, setDayStartTime] = useState(() => {
        return localStorage.getItem('dayStartTime') || '06:00';
    });
    const [dayEndTime, setDayEndTime] = useState(() => {
        return localStorage.getItem('dayEndTime') || '22:00';
    });
    const [font, setFont] = useState(() => {
        return localStorage.getItem('font') || 'system-ui';
    });
    const [hasActiveStatus, setHasActiveStatus] = useState(false);

    // Choose the appropriate backend based on device type
    const dndBackend = isTouchDevice() ? TouchBackend : HTML5Backend;
    const dndOptions = isTouchDevice() ? {
        enableMouseEvents: true, // Allow both touch and mouse events
        delayTouchStart: 200,    // Hold duration before drag starts (ms)
    } : {};

    // Save settings to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('primaryColor', primaryColor);
        localStorage.setItem('defaultEventWidth', defaultEventWidth.toString());
        localStorage.setItem('defaultStatusWidth', defaultStatusWidth.toString());
        localStorage.setItem('dayStartTime', dayStartTime);
        localStorage.setItem('dayEndTime', dayEndTime);
        localStorage.setItem('font', font);
    }, [primaryColor, defaultEventWidth, defaultStatusWidth, dayStartTime, dayEndTime, font]);

    // Check for active status events
    useEffect(() => {
        const checkActiveStatus = () => {
            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const today = now.toISOString().split('T')[0];

            const hasActive = events.some(event => {
                if (event.type !== 'status' || event.date !== today) return false;
                const startMinutes = event.startTime.split(':').map(Number).reduce((h, m) => h * 60 + m);
                const endMinutes = event.endTime.split(':').map(Number).reduce((h, m) => h * 60 + m);
                return currentTime >= startMinutes && currentTime < endMinutes;
            });

            setHasActiveStatus(hasActive);
        };

        // Check immediately and set up interval
        checkActiveStatus();
        const interval = setInterval(checkActiveStatus, 10000); // Check every 10 seconds

        return () => clearInterval(interval);
    }, [events]);

    const handleNewEvent = (eventData) => {
        if (editingEvent) {
            // Update existing event while preserving xPosition and width
            setEvents(prevEvents => prevEvents.map(event =>
                event.id === editingEvent.id
                    ? {
                        ...eventData,
                        id: event.id,
                        xPosition: event.xPosition,
                        width: event.width
                    }
                    : event
            ));
        } else {
            // Create new event with appropriate width and position based on type
            const isStatus = eventData.type === 'status';
            setEvents(prevEvents => [...prevEvents, {
                id: Date.now(),
                ...eventData,
                width: isStatus ? defaultStatusWidth : defaultEventWidth,
                xPosition: isStatus ? (100 - defaultStatusWidth) : 0 // Right-align status events
            }]);
        }
        setIsModalOpen(false);
        setEditingEvent(null);
    };

    const handleEventUpdate = (eventId, updates) => {
        setEvents(prevEvents => prevEvents.map(event =>
            event.id === eventId
                ? { ...event, ...updates }
                : event
        ));
    };

    const handleGridDoubleClick = (time, event = null) => {
        setSelectedTime(time);
        setEditingEvent(event);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingEvent(null);
        setSelectedTime(null);
    };

    const handleSettingsSave = (newSettings) => {
        setPrimaryColor(newSettings.primaryColor);
        setDefaultEventWidth(newSettings.defaultEventWidth);
        setDefaultStatusWidth(newSettings.defaultStatusWidth);
        setDayStartTime(newSettings.dayStartTime);
        setDayEndTime(newSettings.dayEndTime);
        setFont(newSettings.font);
        setIsSettingsOpen(false);
    };

    const renderView = () => {
        const props = {
            onDoubleClick: handleGridDoubleClick,
            onEventUpdate: handleEventUpdate,
            events: events.filter(event => event.date === new Date().toISOString().split('T')[0]), // Only show today's events for now
            settings: {
                dayStartTime,
                dayEndTime
            }
        };

        switch (currentView) {
            case 'week':
                return <WeekView {...props} />;
            case 'month':
                return <MonthView {...props} />;
            default:
                return <DayView {...props} />;
        }
    };

    return (
        <DndProvider backend={dndBackend} options={dndOptions}>
            <div
                className="h-screen w-full flex flex-col bg-gray-100"
                style={{ fontFamily: font }}
            >
                {/* Header */}
                <header className="flex-none w-full bg-white shadow-sm">
                    <div className="max-w-[1600px] w-full mx-auto px-4 py-4">
                        <div className="flex justify-between items-center mb-4">
                            <h1 className="text-2xl font-semibold text-gray-800">My Calendar</h1>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Settings
                                </button>
                                <button
                                    onClick={() => handleGridDoubleClick(null)}
                                    style={{ backgroundColor: primaryColor }}
                                    className="px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    New Event
                                </button>
                            </div>
                        </div>
                        <ViewSelector
                            currentView={currentView}
                            onViewChange={setCurrentView}
                            primaryColor={primaryColor}
                        />
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-hidden">
                    {renderView()}
                    <StatusOverlay
                        isActive={events.some(event => {
                            if (event.type !== 'focus') return false;
                            const now = new Date();
                            const [hours, minutes] = event.startTime.split(':').map(Number);
                            const [endHours, endMinutes] = event.endTime.split(':').map(Number);
                            const eventStart = hours * 60 + minutes;
                            const eventEnd = endHours * 60 + endMinutes;
                            const currentTime = now.getHours() * 60 + now.getMinutes();
                            return currentTime >= eventStart && currentTime < eventEnd;
                        })}
                        event={events.find(event => {
                            if (event.type !== 'focus') return false;
                            const now = new Date();
                            const [hours, minutes] = event.startTime.split(':').map(Number);
                            const [endHours, endMinutes] = event.endTime.split(':').map(Number);
                            const eventStart = hours * 60 + minutes;
                            const eventEnd = endHours * 60 + endMinutes;
                            const currentTime = now.getHours() * 60 + now.getMinutes();
                            return currentTime >= eventStart && currentTime < eventEnd;
                        })}
                    />
                </main>

                {/* Event Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                {editingEvent ? 'Edit Event' : 'New Event'}
                            </h2>
                            <EventForm
                                onSubmit={handleNewEvent}
                                onCancel={handleModalClose}
                                initialTime={selectedTime}
                                initialDate={new Date().toISOString().split('T')[0]}
                                initialData={editingEvent}
                            />
                        </div>
                    </div>
                )}

                {/* Settings Modal */}
                {isSettingsOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Settings
                            </h2>
                            <SettingsForm
                                onSubmit={handleSettingsSave}
                                onCancel={() => setIsSettingsOpen(false)}
                                initialSettings={{
                                    primaryColor,
                                    defaultEventWidth,
                                    defaultStatusWidth,
                                    dayStartTime,
                                    dayEndTime,
                                    font
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </DndProvider>
    );
}

export default App;
