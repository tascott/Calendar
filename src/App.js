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
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(true);
    const [loginError, setLoginError] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [hasActiveStatus, setHasActiveStatus] = useState(false);
    const [settings, setSettings] = useState({
        primaryColor: '#2C2C2C',
        defaultEventWidth: 80,
        defaultStatusWidth: 20,
        dayStartTime: '06:00',
        dayEndTime: '22:00',
        font: 'system-ui'
    });

    // Choose the appropriate backend based on device type
    const dndBackend = isTouchDevice() ? TouchBackend : HTML5Backend;
    const dndOptions = isTouchDevice() ? {
        enableMouseEvents: true, // Allow both touch and mouse events
        delayTouchStart: 200,    // Hold duration before drag starts (ms)
    } : {};

    // Load settings from backend
    const loadSettings = async () => {
        try {
            if (token) {
                console.log('[Settings] Attempting to fetch settings');
                const response = await axiosInstance.get('/settings');
                console.log('[Settings] Fetch successful:', response.data);
                setSettings(response.data);
            }
        } catch (error) {
            console.error('[Settings] Fetch failed:', error.response?.status, error.response?.data);
        }
    };

    // Effect to initialize app with authentication and settings
    useEffect(() => {
        // Check for token on mount
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            setIsLoginModalOpen(false);
        }
    }, []); // Only run on mount

    // Effect to load settings when token changes
    useEffect(() => {
        if (token) {
            loadSettings();
        }
    }, [token]);

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

    // Create axios instance with default config
    const axiosInstance = axios.create({
        baseURL: API_URL,
        headers: {
            'Content-Type': 'application/json'
        }
    });

    // Add axios interceptor to automatically add token to all requests
    axiosInstance.interceptors.request.use(
        (config) => {
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
                console.log('[Request] Endpoint:', config.url, 'Headers:', config.headers);
            } else {
                console.log('[Request] No token available for:', config.url);
            }
            return config;
        },
        (error) => {
            console.error('[Request Error]', error);
            return Promise.reject(error);
        }
    );

    // Add axios interceptor to handle 401/403 responses
    axiosInstance.interceptors.response.use(
        (response) => {
            console.log('[Response] Success:', response.config.url, response.status);
            return response;
        },
        (error) => {
            console.error(
                '[Response Error]',
                'URL:', error.config?.url,
                'Status:', error.response?.status,
                'Message:', error.response?.data?.error
            );
            if (error.response?.status === 401 || error.response?.status === 403) {
                if (token) {
                    console.log('[Auth] Token invalid - logging out');
                    handleLogout();
                }
            }
            return Promise.reject(error);
        }
    );

    // Using Axios with interceptors
    const fetchEvents = async () => {
        console.log('[Events] Attempting to fetch events');
        try {
            const response = await axiosInstance.get('/events');
            console.log('[Events] Fetch successful, count:', response.data.length);
            setEvents(response.data);
        } catch (error) {
            console.error('[Events] Fetch failed:', error.response?.status, error.response?.data);
            if (error.response?.status === 401) {
                console.log('[Events] Unauthorized - showing login modal');
                setIsLoginModalOpen(true);
            }
        }
    };

    const saveEvents = async (newEvents) => {
        try {
            await axiosInstance.post('/events', newEvents);
            setEvents(newEvents);
        } catch (error) {
            console.error('Error saving events:', error);
            // No need to check for 401 here as it's handled by interceptor
        }
    };

    // Authentication handlers
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        const username = e.target.username.value;
        const password = e.target.password.value;

        try {
            console.log('[Login] Attempting login for:', username);
            const response = await axios.post(`${API_URL}/login`, {
                username,
                password
            });
            const { token: newToken } = response.data;
            console.log('[Login] Success - token received');

            // Update auth state
            localStorage.setItem('token', newToken);
            setToken(newToken);

            // Fetch initial data
            try {
                console.log('[Login] Fetching initial events');
                const eventsResponse = await axios.get(`${API_URL}/events`, {
                    headers: { Authorization: `Bearer ${newToken}` }
                });
                console.log('[Login] Events fetched successfully');
                setEvents(eventsResponse.data);
                setIsLoginModalOpen(false);
            } catch (error) {
                console.error('[Login] Failed to fetch initial events:', error.response?.status);
                throw error; // Re-throw to be caught by outer catch
            }
        } catch (error) {
            console.error('[Login] Failed:', error.response?.data?.error);
            setLoginError(error.response?.data?.error || 'Failed to login');
            setToken(null);
            localStorage.removeItem('token');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoginError('');
        const username = e.target.username.value;
        const password = e.target.password.value;

        try {
            // Use regular axios for auth endpoints
            await axios.post(`${API_URL}/register`, {
                username,
                password
            });
            // After successful registration, switch back to login
            setIsRegistering(false);
            setLoginError('Registration successful! Please login.');
        } catch (error) {
            console.error('Registration error:', error);
            setLoginError(error.response?.data?.error || 'Failed to register');
        }
    };

    const handleLogout = () => {
        console.log('Logging out - clearing token and state');
        // Clear auth state
        setToken(null);
        localStorage.removeItem('token');

        // Clear application state
        setEvents([]);
        setIsLoginModalOpen(true);

        // Reset any other necessary state
        setIsModalOpen(false);
        setIsSettingsOpen(false);
        setEditingEvent(null);
        setSelectedTime(null);
    };

    // Effect to fetch events when authenticated
    useEffect(() => {
        if (token) {
            console.log('[Auth] Token present, fetching events');
            fetchEvents();
        } else {
            console.log('[Auth] No token available');
        }
    }, [token]);

    const handleEventUpdate = (eventId, updates) => {
        // If this is a deletion (updates.deleted is true), handle recurring events
        if (updates.deleted) {
            const eventToDelete = events.find(e => e.id === eventId);
            if (eventToDelete?.recurringEventId) {
                // Delete all events in the recurring series
                const updatedEvents = events.filter(e => e.recurringEventId !== eventToDelete.recurringEventId);
                saveEvents(updatedEvents);
                setEvents(updatedEvents);
                return;
            }
        }

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
        // Ensure recurringDays is properly stringified and handle recurring property
        const processedEventData = {
            ...eventData,
            // Only include recurring properties if the event is actually recurring
            ...(eventData.recurring === 'none' ? {
                recurring: 'none',
                recurringDays: '{}',
                recurringEventId: null
            } : {
                recurring: eventData.recurring,
                recurringDays: typeof eventData.recurringDays === 'string'
                    ? eventData.recurringDays
                    : JSON.stringify(eventData.recurringDays || {}),
                recurringEventId: eventData.recurringEventId || `recurring-${Date.now()}`
            })
        };

        if (editingEvent) {
            // Update existing event
            const updatedEvents = events.map(event => {
                // If this is a recurring event, update all events in the series
                if (editingEvent.recurringEventId && event.recurringEventId === editingEvent.recurringEventId) {
                    let newXPosition = event.xPosition;
                    if (newXPosition + processedEventData.width > 100) {
                        newXPosition = Math.max(0, 100 - processedEventData.width);
                    }
                    return {
                        ...processedEventData,
                        id: event.id,
                        date: event.date, // Keep original date for each instance
                        xPosition: newXPosition
                    };
                } else if (event.id === editingEvent.id) {
                    let newXPosition = event.xPosition;
                    if (newXPosition + processedEventData.width > 100) {
                        newXPosition = Math.max(0, 100 - processedEventData.width);
                    }
                    return {
                        ...processedEventData,
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
            const isStatus = processedEventData.type === 'status';
            const baseEvent = {
                ...processedEventData,
                width: isStatus ? settings.defaultStatusWidth : settings.defaultEventWidth,
                xPosition: isStatus ? (100 - settings.defaultStatusWidth) : 0
            };

            // For daily recurring events, create an event for each selected day
            let newEvents = [];
            if (processedEventData.recurring === 'daily') {
                const recurringDays = JSON.parse(processedEventData.recurringDays);
                const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const startDate = new Date(processedEventData.date);

                // Create events for the next 3 months
                for (let i = 0; i < 90; i++) {
                    const currentDate = new Date(startDate);
                    currentDate.setDate(startDate.getDate() + i);
                    const dayName = daysOfWeek[currentDate.getDay()];

                    if (recurringDays[dayName]) {
                        newEvents.push({
                            ...baseEvent,
                            id: Date.now() + i,
                            date: currentDate.toISOString().split('T')[0]
                        });
                    }
                }
            } else {
                newEvents = [{
                    ...baseEvent,
                    id: Date.now(),
                    recurring: 'none',
                    recurringDays: '{}',
                    recurringEventId: null
                }];
            }

            const updatedEvents = [...events, ...newEvents];
            setEvents(updatedEvents);
            saveEvents(updatedEvents);
        }
        setIsModalOpen(false);
        setEditingEvent(null);
    };

    const handleGridDoubleClick = (time, event = null, options = {}) => {
        // If we have an event object, use its start time
        const initialTime = event ? event.startTime : (time || '09:00');

        // If we have x position from options (for day view), use it
        const xPosition = options?.xPosition;

        setSelectedTime(initialTime);
        setEditingEvent(event);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingEvent(null);
        setSelectedTime(null);
    };

    const handleSettingsSave = async (newSettings) => {
        try {
            console.log('[Settings] Attempting to save settings:', newSettings);
            const response = await axiosInstance.post('/settings', newSettings);
            console.log('[Settings] Save successful:', response.data);
            setSettings(response.data);
            setIsSettingsOpen(false);
        } catch (error) {
            console.error('[Settings] Save failed:', error.response?.status, error.response?.data);
        }
    };

    const handleNavigate = (newDate) => {
        setCurrentDate(newDate);
    };

    const renderView = () => {
        const props = {
            onDoubleClick: handleGridDoubleClick,
            onEventClick: handleGridDoubleClick,
            onEventUpdate: handleEventUpdate,
            currentDate,
            onNavigate: handleNavigate,
            settings: {
                dayStartTime: settings.dayStartTime,
                dayEndTime: settings.dayEndTime
            }
        };

        switch (currentView) {
            case 'week':
                return <WeekView {...props} events={events} />;
            case 'month':
                return <MonthView {...props} events={events} />;
            default:
                return <DayView {...props} events={events} />;
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
                style={{ fontFamily: settings.font }}
            >
                {/* Header */}
                <header className="flex-none w-full bg-[#F6F5F1] border-b border-[#D3D1C7]">
                    <div className="max-w-[1600px] w-full mx-auto px-8 py-6">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-3xl font-normal text-[#2C2C2C] tracking-wide">Calendar</h1>
                            <div className="flex space-x-4">
                                <button
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="px-4 py-2 text-sm font-normal border transition-colors duration-200"
                                    style={{
                                        color: settings.primaryColor,
                                        borderColor: settings.primaryColor,
                                        ':hover': {
                                            backgroundColor: settings.primaryColor,
                                            color: '#F6F5F1'
                                        }
                                    }}
                                >
                                    Settings
                                </button>
                                <button
                                    onClick={() => handleGridDoubleClick(null)}
                                    className="px-4 py-2 text-sm font-normal border transition-colors duration-200"
                                    style={{
                                        color: settings.primaryColor,
                                        borderColor: settings.primaryColor,
                                        ':hover': {
                                            backgroundColor: settings.primaryColor,
                                            color: '#F6F5F1'
                                        }
                                    }}
                                >
                                    New Event
                                </button>
                                {token && (
                                    <button
                                        onClick={handleLogout}
                                        className="px-4 py-2 text-sm font-normal border transition-colors duration-200"
                                        style={{
                                            color: settings.primaryColor,
                                            borderColor: settings.primaryColor,
                                            ':hover': {
                                                backgroundColor: settings.primaryColor,
                                                color: '#F6F5F1'
                                            }
                                        }}
                                    >
                                        Logout
                                    </button>
                                )}
                            </div>
                        </div>
                        <ViewSelector
                            currentView={currentView}
                            onViewChange={setCurrentView}
                            primaryColor={settings.primaryColor}
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
                                initialSettings={settings}
                            />
                        </div>
                    </div>
                )}

                {/* Login/Register Modal with improved validation */}
                {isLoginModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
                        <div className="bg-[#F6F5F1] rounded-none border border-[#2C2C2C] p-8 max-w-md w-full vintage-shadow">
                            <h2 className="text-xl font-normal text-[#2C2C2C] mb-6">
                                {isRegistering ? 'Register' : 'Login'}
                            </h2>
                            <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
                                {loginError && (
                                    <div className="text-red-600 text-sm mb-4">{loginError}</div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        required
                                        minLength={3}
                                        maxLength={50}
                                        pattern="[A-Za-z0-9]*"
                                        title="Username can only contain letters and numbers"
                                        className="w-full px-3 py-2 border border-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#2C2C2C] bg-[#F6F5F1]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        minLength={6}
                                        className="w-full px-3 py-2 border border-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#2C2C2C] bg-[#F6F5F1]"
                                    />
                                </div>
                                <div className="flex justify-between items-center pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsRegistering(!isRegistering);
                                            setLoginError(''); // Clear any previous errors
                                        }}
                                        className="text-sm text-[#2C2C2C] hover:underline"
                                    >
                                        {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-normal text-[#2C2C2C] border border-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-[#F6F5F1] transition-colors duration-200"
                                    >
                                        {isRegistering ? 'Register' : 'Login'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DndProvider>
    );
}

export default App;
