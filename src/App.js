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
import axios from 'axios';

const API_URL = 'http://localhost:3001';

function App() {
    const [currentView, setCurrentView] = useState('day');
    const [events, setEvents] = useState([]);
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

    // Using Axios
    const fetchEvents = async () => {
        try {
            const response = await axios.get(`${API_URL}/events`);
            setEvents(response.data);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const saveEvents = async (newEvents) => {
        try {
            await axios.post(`${API_URL}/events`, newEvents);
            setEvents(newEvents);
        } catch (error) {
            console.error('Error saving events:', error);
        }
    };

    /* Using Fetch API (Alternative Implementation)
    const fetchEvents = async () => {
        try {
            const response = await fetch(`${API_URL}/events`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            setEvents(data);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const saveEvents = async (newEvents) => {
        try {
            const response = await fetch(`${API_URL}/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newEvents)
            });
            if (!response.ok) throw new Error('Network response was not ok');
            setEvents(newEvents);
        } catch (error) {
            console.error('Error saving events:', error);
        }
    };
    */

    // Fetch events on component mount
    useEffect(() => {
        fetchEvents();
    }, []);

    const handleEventUpdate = (eventId, updates) => {
        // Create a new array with the updated event
        const updatedEvents = events.map(event =>
            event.id === eventId
                ? { ...event, ...updates }
                : event
        );

        // Only save to database if this is a final update (not during drag)
        if (updates.justDropped || !updates.isDragging) {
            saveEvents(updatedEvents);
        }

        // Update local state
        setEvents(updatedEvents);
    };

    const handleNewEvent = (eventData) => {
        if (editingEvent) {
            // Update existing event
            const updatedEvents = events.map(event => {
                if (event.id === editingEvent.id) {
                    // Calculate new position if needed
                    let newXPosition = event.xPosition;

                    // If the new width would cause overflow, adjust the position
                    if (newXPosition + eventData.width > 100) {
                        // Move the event left enough to fit within container
                        newXPosition = Math.max(0, 100 - eventData.width);
                    }

                    return {
                        ...eventData,
                        id: event.id,
                        xPosition: newXPosition
                    };
                }
                return event;
            });
            setEvents(updatedEvents);
            saveEvents(updatedEvents);
        } else {
            // Create new event
            const isStatus = eventData.type === 'status';
            const newEvent = {
                id: Date.now(),
                ...eventData,
                width: isStatus ? defaultStatusWidth : defaultEventWidth,
                xPosition: isStatus ? (100 - defaultStatusWidth) : 0
            };
            const newEvents = [...events, newEvent];
            setEvents(newEvents);
            saveEvents(newEvents);
        }
        setIsModalOpen(false);
        setEditingEvent(null);
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
            settings: {
                dayStartTime,
                dayEndTime
            }
        };

        switch (currentView) {
            case 'week':
                return <WeekView {...props} events={events} />;
            case 'month':
                return <MonthView {...props} events={events} />;
            default:
                return <DayView {...props} events={events.filter(event =>
                    event.date === new Date().toISOString().split('T')[0]
                )} />;
        }
    };

    const handleTerminalCommand = async () => {
        try {
            await run_terminal_command({
                command: "npm install axios",
                explanation: "Installing axios package for making HTTP requests",
                requireUserApproval: true
            });
        } catch (error) {
            console.error('Error installing axios:', error);
        }
    };

    return (
        <DndProvider backend={dndBackend} options={dndOptions}>
            <div
                className="min-h-screen w-full flex flex-col bg-[#F6F5F1]"
                style={{ fontFamily: font }}
            >
                {/* Header */}
                <header className="flex-none w-full bg-[#F6F5F1] border-b border-[#D3D1C7]">
                    <div className="max-w-[1600px] w-full mx-auto px-8 py-6">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-3xl font-normal text-[#2C2C2C] tracking-wide">Calendar</h1>
                            <div className="flex space-x-4">
                                <button
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="px-4 py-2 text-sm font-normal text-[#2C2C2C] border border-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-[#F6F5F1] transition-colors duration-200"
                                >
                                    Settings
                                </button>
                                <button
                                    onClick={() => handleGridDoubleClick(null)}
                                    className="px-4 py-2 text-sm font-normal text-[#2C2C2C] border border-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-[#F6F5F1] transition-colors duration-200"
                                >
                                    New Event
                                </button>
                            </div>
                        </div>
                        <ViewSelector
                            currentView={currentView}
                            onViewChange={setCurrentView}
                            primaryColor="#2C2C2C"
                        />
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-hidden">
                    {renderView()}
                </main>

                {/* Modals with vintage styling */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
                        <div className="bg-[#F6F5F1] rounded-none border border-[#2C2C2C] p-8 max-w-md w-full vintage-shadow">
                            <h2 className="text-xl font-normal text-[#2C2C2C] mb-6">
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
                    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
                        <div className="bg-[#F6F5F1] rounded-none border border-[#2C2C2C] p-8 max-w-md w-full vintage-shadow">
                            <h2 className="text-xl font-normal text-[#2C2C2C] mb-6">
                                Settings
                            </h2>
                            <SettingsForm
                                onSubmit={handleSettingsSave}
                                onCancel={() => setIsSettingsOpen(false)}
                                initialSettings={{
                                    primaryColor: '#2C2C2C',
                                    defaultEventWidth,
                                    defaultStatusWidth,
                                    dayStartTime,
                                    dayEndTime,
                                    font: 'Georgia'
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
