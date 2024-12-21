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
            console.log('Request interceptor - Current token:', token);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
                console.log('Added token to request:', config.headers.Authorization);
            }
            return config;
        },
        (error) => {
            console.error('Request interceptor error:', error);
            return Promise.reject(error);
        }
    );

    // Add axios interceptor to handle 401/403 responses
    axiosInstance.interceptors.response.use(
        (response) => {
            console.log('Response interceptor - Success:', response.status);
            return response;
        },
        (error) => {
            console.error('Response interceptor - Error:', error.response?.status);
            if (error.response?.status === 401 || error.response?.status === 403) {
                // Only logout if we're not already logged out
                if (token) {
                    console.log('Token invalid or expired - logging out');
                    handleLogout();
                }
            }
            return Promise.reject(error);
        }
    );

    // Using Axios with interceptors
    const fetchEvents = async () => {
        console.log('Fetching events - Current token:', token);
        try {
            const response = await axiosInstance.get('/events');
            console.log('Events fetched successfully:', response.data);
            setEvents(response.data);
        } catch (error) {
            console.error('Error fetching events:', error);
            if (error.response?.status === 401) {
                console.log('Unauthorized - showing login modal');
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
            console.log('Attempting login for user:', username);
            const response = await axios.post(`${API_URL}/login`, {
                username,
                password
            });
            console.log('Login response:', response.data);
            const { token: newToken } = response.data;

            // Update auth state
            console.log('Setting new token:', newToken);
            localStorage.setItem('token', newToken);

            // First fetch events with the new token directly
            const eventsResponse = await axios.get(`${API_URL}/events`, {
                headers: {
                    Authorization: `Bearer ${newToken}`
                }
            });

            // Only update state after successful events fetch
            setToken(newToken);
            setEvents(eventsResponse.data);
            setIsLoginModalOpen(false);
        } catch (error) {
            console.error('Login error:', error);
            setLoginError(error.response?.data?.error || 'Failed to login');
            // Clear any partial state if there was an error
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

    // Effect to initialize app with authentication
    useEffect(() => {
        // Check for token on mount
        const storedToken = localStorage.getItem('token');
        console.log('Initial token from localStorage:', storedToken);
        if (storedToken) {
            console.log('Setting token from localStorage');
            setToken(storedToken);
            setIsLoginModalOpen(false);
        }
    }, []); // Only run on mount

    // Effect to fetch events when authenticated
    useEffect(() => {
        console.log('Token changed:', token);
        if (token) {
            console.log('Token present, fetching events');
            fetchEvents();
        }
    }, [token]);

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
                                {token && (
                                    <button
                                        onClick={handleLogout}
                                        className="px-4 py-2 text-sm font-normal text-[#2C2C2C] border border-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-[#F6F5F1] transition-colors duration-200"
                                    >
                                        Logout
                                    </button>
                                )}
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
