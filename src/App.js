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
import TaskForm from './components/TaskForm';
import { toast } from 'react-hot-toast';
import NotesPanel from './components/NotesPanel';
import TasksPanel from './components/TasksPanel';
import TemplatesModal from './components/TemplatesModal';
import { VERSION } from './version';
import { RiFullscreenFill, RiFullscreenExitFill } from 'react-icons/ri';

console.log('Current environment:', process.env.NODE_ENV);
console.log('All env vars:', process.env);

// API URL Configuration
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
const API_URL = `${BASE_URL}/api`;

console.log('Base URL:', BASE_URL);
console.log('API URL:', API_URL);

// Configure axios defaults
axios.defaults.baseURL = API_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Single combined interceptor for all response handling
axios.interceptors.response.use(
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

        // Handle token expiration
        if (error.response?.status === 401 ||
            (error.response?.status === 403 && error.response?.data?.error === 'Invalid or expired token')) {
            if (localStorage.getItem('token')) {  // Only handle if we actually have a token
                localStorage.removeItem('token');
                window.dispatchEvent(new CustomEvent('tokenExpired'));
            }
        }
        return Promise.reject(error);
    }
);

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
    const [activeFocusEvent, setActiveFocusEvent] = useState(null);
    const [settings, setSettings] = useState({
        primaryColor: '#2C2C2C',
        defaultEventWidth: 80,
        defaultStatusWidth: 20,
        dayStartTime: '06:00',
        dayEndTime: '22:00',
        font: 'system-ui',
        taskNotifications: false,
        taskAvoidFocus: false
    });
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [editingTask, setEditingTask] = useState(null);
    const [activePanel, setActivePanel] = useState(null);
    const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
    const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Update axios auth header when token changes
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

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
                const response = await axios.get('/settings');
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
            console.log('[Auth] Found stored token');
            setToken(storedToken);
            setIsLoginModalOpen(false);
        } else {
            console.log('[Auth] No stored token found');
            setIsLoginModalOpen(true);
        }
    }, []); // Only run on mount

    // Effect to load all data when token changes
    useEffect(() => {
        if (token) {
            console.log('[Auth] Token present, loading data');
            loadSettings();
            fetchEvents();
            fetchTasks();
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

    // Check for active focus events
    useEffect(() => {
        const checkActiveFocusEvent = () => {
            const now = new Date();
            const currentTime = now.toLocaleTimeString('en-US', { hour12: false });
            const today = now.toISOString().split('T')[0];

            const focusEvent = events.find(event =>
                event.type === 'focus' &&
                event.date === today &&
                event.startTime <= currentTime &&
                event.endTime >= currentTime
            );

            setActiveFocusEvent(focusEvent);
        };

        // Check immediately and then every minute
        checkActiveFocusEvent();
        const interval = setInterval(checkActiveFocusEvent, 60000);

        return () => clearInterval(interval);
    }, [events]);

    // Create axios instance with default config
    const axiosInstance = axios.create({
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    // Add axios interceptor to automatically add token to all requests
    axiosInstance.interceptors.request.use(
        (config) => {
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            } else {
                console.log('[Request] No token available for:', config.url);
            }
            return config;
        },
        (error) => {
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
            const response = await axios.get('/events');
            console.log('[Events] Fetch successful, count:', response.data.length);

            // Normalize field names from database format to frontend format
            const normalizedEvents = response.data.map(event => ({
                ...event,
                startTime: event.starttime,
                endTime: event.endtime,
                xPosition: event.xposition,
                backgroundColor: event.backgroundcolor,
                overlayText: event.overlaytext,
                recurringDays: event.recurringdays,
                recurringEventId: event.recurringeventid
            }));

            setEvents(normalizedEvents);
        } catch (error) {
            console.error('[Events] Fetch failed:', error.response?.status, error.response?.data);
            if (error.response?.status === 401) {
                setIsLoginModalOpen(true);
            }
        }
    };

    const saveEvents = async (newEvents) => {
        try {
            // Only log for delete operations
            if (Array.isArray(newEvents) && newEvents.some(e => e.deleted)) {
                console.log('[DELETE] Sending to backend:', newEvents);
            }

            // Convert to array if single event
            const eventsToSave = Array.isArray(newEvents) ? newEvents : [newEvents];

            // Convert frontend camelCase to backend lowercase for all events
            const normalizedEvents = eventsToSave.map(event => ({
                ...event,
                starttime: event.startTime,
                endtime: event.endTime,
                xposition: event.xPosition,
                width: event.width,
                backgroundcolor: event.backgroundColor,
                overlaytext: event.overlayText,
                recurringdays: event.recurringDays,
                recurringeventid: event.recurringEventId
            }));

            // Send all events in a single request
            const response = await axios.post('/events', normalizedEvents);
            console.log('[Events] Save successful:', response.data);

            // For delete operations, just update the state
            if (eventsToSave.some(e => e.deleted)) {
                const deletedIds = eventsToSave.filter(e => e.deleted).map(e => e.id);
                setEvents(prev => prev.filter(e => !deletedIds.includes(e.id)));
                return;
            }

            // For non-delete operations, update state with normalized response data
            const updatedEvents = response.data.map(event => ({
                ...event,
                startTime: event.starttime,
                endTime: event.endtime,
                xPosition: event.xposition,
                width: event.width,
                backgroundColor: event.backgroundcolor,
                overlayText: event.overlaytext,
                recurringDays: event.recurringdays,
                recurringEventId: event.recurringeventid
            }));
            setEvents(updatedEvents);
        } catch (error) {
            console.error('[Events] Save error:', error);
            toast.error('Failed to save events');
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
            const response = await axios.post('/login', {
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
                const eventsResponse = await fetch(`${API_URL}/events`, {
                    headers: { Authorization: `Bearer ${newToken}` }
                });
                const data = await eventsResponse.json();
                console.log('[Login] Events fetched successfully');

                // Normalize field names from database format to frontend format
                const normalizedEvents = data.map(event => ({
                    ...event,
                    startTime: event.starttime,
                    endTime: event.endtime,
                    xPosition: event.xposition,
                    backgroundColor: event.backgroundcolor,
                    overlayText: event.overlaytext,
                    recurringDays: event.recurringdays,
                    recurringEventId: event.recurringeventid
                }));

                setEvents(normalizedEvents);
                setIsLoginModalOpen(false);
            } catch (error) {
                console.error('[Login] Failed to fetch initial events:', error);
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
        setToken(null);
        localStorage.removeItem('token');
        setEvents([]);
        setTasks([]);
        setIsLoginModalOpen(true);
        toast.success('Logged out successfully');
    };

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

        const eventToUpdate = events.find(e => e.id === eventId);
        if (!eventToUpdate) return;

        let eventsToUpdate;

        // Handle recurring events
        if (eventToUpdate.recurring !== 'none' && eventToUpdate.recurringEventId && !updates.isVisualOnly) {
            // Calculate time difference
            const oldDate = new Date(eventToUpdate.date);
            const newDate = new Date(updates.date);
            const daysDiff = Math.round((newDate - oldDate) / (1000 * 60 * 60 * 24));

            // Update all events in the series
            eventsToUpdate = events.map(event => {
                if (event.recurringEventId === eventToUpdate.recurringEventId) {
                    const eventDate = new Date(event.date);
                    eventDate.setDate(eventDate.getDate() + daysDiff);
                    return {
                        ...event,
                        date: eventDate.toISOString().split('T')[0],
                        startTime: updates.startTime || event.startTime,
                        endTime: updates.endTime || event.endTime,
                        xPosition: updates.xPosition,
                        isDragging: updates.isDragging
                    };
                }
                return event;
            });
        } else {
            // Handle non-recurring events or visual updates during drag
            eventsToUpdate = events.map(event =>
                event.id === eventId
                    ? { ...event, ...updates }
                    : event
            );
        }

        // Only save to database if this is a final update (not during drag)
        if (!updates.isDragging && !updates.isVisualOnly) {
            const updatedEvent = eventsToUpdate.find(e => e.id === eventId);
            if (updatedEvent) {
                if (updatedEvent.recurring !== 'none' && updatedEvent.recurringEventId) {
                    // Save all events in the series
                    const seriesEvents = eventsToUpdate.filter(
                        e => e.recurringEventId === updatedEvent.recurringEventId
                    );
                    saveEvents(seriesEvents);
                } else {
                    saveEvents(updatedEvent);
                }
            }
        }

        // Update local state
        setEvents(eventsToUpdate);
    };

    const handleGridDoubleClick = (time, event = null, options = {}) => {
        console.log('[GridDoubleClick] Called with:', { time, event, options });
        // If we have an event object, use its start time
        const initialTime = event ? event.startTime : (time || '09:00');

        // If we have x position from options (for day view), use it
        const xPosition = options?.xPosition;

        console.log('[GridDoubleClick] Setting state:', {
            initialTime,
            xPosition,
            currentDate: currentDate.toISOString().split('T')[0]
        });

        setSelectedTime(initialTime);
        setEditingEvent(event);  // Don't wrap in an object, just pass the event directly
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

    const handleEventDrop = (eventId, newDate, newTime) => {
        console.log('[DROP] Event dropped:', { eventId, newDate, newTime });

        const droppedEvent = events.find(e => e.id === eventId);
        if (!droppedEvent) {
            console.error('[DROP] Event not found:', eventId);
            return;
        }

        // If this is a recurring event, update all instances
        if (droppedEvent.recurring !== 'none' && droppedEvent.recurringEventId) {
            // Calculate the time difference to apply to all events
            const oldDate = new Date(droppedEvent.date);
            const newDateObj = new Date(newDate);
            const daysDiff = Math.round((newDateObj - oldDate) / (1000 * 60 * 60 * 24));

            // Update all events in the series
            const updatedEvents = events.map(event => {
                if (event.recurringEventId === droppedEvent.recurringEventId) {
                    const eventDate = new Date(event.date);
                    eventDate.setDate(eventDate.getDate() + daysDiff);
                    return {
                        ...event,
                        date: eventDate.toISOString().split('T')[0],
                        startTime: newTime || event.startTime
                    };
                }
                return event;
            });

            setEvents(updatedEvents);
            // Save all updated events
            const eventsToSave = updatedEvents.filter(
                e => e.recurringEventId === droppedEvent.recurringEventId
            );
            saveEvents(eventsToSave);
            return;
        }

        // Handle single event move
        const updatedEvents = events.map(event => {
            if (event.id === eventId) {
                return {
                    ...event,
                    date: newDate,
                    startTime: newTime || event.startTime
                };
            }
            return event;
        });

        setEvents(updatedEvents);
        const eventToSave = updatedEvents.find(e => e.id === eventId);
        if (eventToSave) {
            saveEvents(eventToSave);
        }
    };

    const fetchTasks = async () => {
        console.log('[Tasks] Fetching tasks');
        try {
            const response = await axios.get('/tasks');
            console.log('[Tasks] Fetch successful:', response.data);
            setTasks(response.data);
        } catch (error) {
            console.error('[Tasks] Fetch failed:', error.response?.status, error.response?.data);
            if (error.response?.status === 401) {
                setIsLoginModalOpen(true);
            }
        }
    };

    const handleNewTask = async (taskData) => {
        try {
            console.log('[Tasks] Creating new task:', taskData);
            const response = await fetch(`${API_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...taskData,
                    // Convert frontend camelCase to database lowercase
                    startTime: taskData.time,
                    endTime: taskData.time, // For now, end time is same as start
                    id: Date.now().toString(), // Ensure we have an ID
                    xposition: taskData.xposition || 50 // Set default xposition to 50
                })
            });
            const data = await response.json();
            console.log('[Tasks] Server response:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create task');
            }

            // After successful creation, fetch all tasks to ensure we're in sync
            await fetchTasks();
            setIsTaskModalOpen(false);
        } catch (error) {
            console.error('[Tasks] Error creating task:', error);
            toast.error(error.message || 'Failed to create task');
        }
    };

    const handleTaskUpdate = async (updatedTask) => {
        try {

            // Only do optimistic update for non-deletion updates
            if (!updatedTask.deleted) {
                setTasks(prevTasks => prevTasks.map(task =>
                    task.id === updatedTask.id ? { ...task, ...updatedTask } : task
                ));
            }

            // Get the existing task to ensure we have all fields
            const existingTask = tasks.find(t => t.id === updatedTask.id);
            if (!existingTask) {
                throw new Error('Task not found');
            }

            // Merge existing task with updates, ensuring all required fields are present
            const taskToUpdate = {
                ...existingTask,
                ...updatedTask,
                time: updatedTask.time || existingTask.time,
                date: updatedTask.date || existingTask.date,
                priority: updatedTask.priority || existingTask.priority,
                xposition: updatedTask.xposition !== undefined ? updatedTask.xposition : existingTask.xposition,
                estimated_time: updatedTask.estimated_time !== undefined ? updatedTask.estimated_time : existingTask.estimated_time,
                title: updatedTask.title || existingTask.title // Ensure title is preserved
            };


            const response = await fetch(`${API_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(taskToUpdate)
            });

            const responseText = await response.text();
            console.log('[Tasks] Raw server response:', responseText);

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${await response.text()}`);
            }

            const data = JSON.parse(responseText);
            console.log('[Tasks] Update successful, parsed response:', data);

            if (updatedTask.deleted) {
                // If task was deleted, filter it out from the local state
                setTasks(prevTasks => prevTasks.filter(task => task.id !== updatedTask.id));
            } else {
                // Update just the modified task in the state with server response
                const normalizedTask = {
                    ...data,
                    startTime: data.starttime,
                    endTime: data.endtime,
                    createdAt: data.created_at
                };
                setTasks(prevTasks => prevTasks.map(task =>
                    task.id === normalizedTask.id ? normalizedTask : task
                ));
            }
        } catch (error) {
            console.error('[Tasks] Error updating task:', error);
            toast.error('Failed to update task');
            // Revert any optimistic updates on error
            fetchTasks();
        }
    };

    const handleTaskClick = (task) => {
        setEditingTask(task);
        setIsTaskModalOpen(true);
    };

    const handleTaskDelete = async (task) => {
        try {
            await handleTaskUpdate({ ...task, deleted: true });
            toast.success('Task deleted');
        } catch (error) {
            console.error('[Tasks] Error deleting task:', error);
            toast.error('Failed to delete task');
        }
    };

    const handleTaskModalClose = () => {
        setEditingTask(null);
        setIsTaskModalOpen(false);
    };

    const handleTaskSubmit = async (taskData) => {
        try {
            if (editingTask) {
                // If editing, preserve the ID
                await handleTaskUpdate({ ...taskData, id: editingTask.id });
            } else {
                // If creating new task
                await handleNewTask(taskData);
            }
            handleTaskModalClose();
        } catch (error) {
            console.error('[Tasks] Error saving task:', error);
            toast.error('Failed to save task');
        }
    };

    const handlePanelToggle = (panelName) => {
        setActivePanel(activePanel === panelName ? null : panelName);
    };

    const handleLoadTemplate = async (template) => {
        try {
            setIsLoadingTemplate(true);
            // Use the currently selected date instead of today
            const selectedDate = currentDate.toISOString().split('T')[0];

            // Delete all events from the selected date
            const dateEvents = events.filter(e => e.date === selectedDate);
            for (const event of dateEvents) {
                await handleEventUpdate(event.id, { deleted: true });
            }

            // Create new events from template
            const templateEvents = template.events.map(event => ({
                ...event,
                id: `${Date.now()}-${Math.random()}`, // Generate new ID
                date: selectedDate, // Set to selected date
                recurring: 'none', // Remove any recurring settings
                recurringDays: '{}',
                recurringEventId: null
            }));

            // Save all new events at once
            await saveEvents(templateEvents);

            toast.success('Template applied successfully');
        } catch (error) {
            console.error('Failed to load template:', error);
            toast.error('Failed to apply template');
        } finally {
            setIsLoadingTemplate(false);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    // Update fullscreen state when it changes externally (e.g., Esc key)
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Add event listener for token expiration
    useEffect(() => {
        let isHandlingExpiration = false;  // Flag to prevent duplicate handling

        const handleTokenExpired = () => {
            if (isHandlingExpiration) return;  // Prevent duplicate handling
            isHandlingExpiration = true;

            setToken(null);
            setIsLoginModalOpen(true);
            toast.error('Your session has expired. Please log in again.');

            // Reset flag after a short delay
            setTimeout(() => {
                isHandlingExpiration = false;
            }, 1000);
        };

        window.addEventListener('tokenExpired', handleTokenExpired);
        return () => window.removeEventListener('tokenExpired', handleTokenExpired);
    }, []);

    const renderView = () => {
        const props = {
            onDoubleClick: handleGridDoubleClick,
            onEventClick: handleGridDoubleClick,
            onEventUpdate: handleEventUpdate,
            onEventDrop: handleEventDrop,
            currentDate,
            onNavigate: handleNavigate,
            settings: {
                dayStartTime: settings.dayStartTime,
                dayEndTime: settings.dayEndTime,
                taskNotifications: settings.taskNotifications,
                taskAvoidFocus: settings.taskAvoidFocus,
                primaryColor: settings.primaryColor,
                defaultEventWidth: settings.defaultEventWidth,
                defaultStatusWidth: settings.defaultStatusWidth,
                font: settings.font
            },
            tasks,
            onTaskClick: handleTaskClick,
            onTaskUpdate: handleTaskUpdate,
            isLoading: isLoadingTemplate
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

    const handleNewEvent = (eventData) => {
        console.log('[NewEvent] Starting with data:', eventData);
        console.log('[NewEvent] Current editing state:', { editingEvent, currentDate: currentDate.toISOString().split('T')[0] });

        // If this is a deletion
        if (eventData.deleted) {
            console.log('[DELETE] Processing delete in App:', {
                id: eventData.id,
                recurring: eventData.recurring,
                recurringEventId: eventData.recurringEventId
            });

            // Remove from local state first
            let eventsToDelete;
            if (eventData.recurringEventId) {
                const recurringEvents = events.filter(e => e.recurringEventId === eventData.recurringEventId);
                eventsToDelete = recurringEvents.map(e => ({ ...e, deleted: true }));
                setEvents(prev => prev.filter(e => e.recurringEventId !== eventData.recurringEventId));
            } else {
                eventsToDelete = [eventData];
                setEvents(prev => prev.filter(e => e.id !== eventData.id));
            }

            // Then delete from database
            saveEvents(eventsToDelete);
            setIsModalOpen(false);
            return;
        }

        // Ensure recurringDays is properly stringified and handle recurring property
        const processedEventData = {
            ...eventData,
            id: eventData.id || Date.now().toString(),  // Ensure we have an ID
            date: eventData.date || currentDate.toISOString().split('T')[0], // Ensure we have a date
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

        console.log('[NewEvent] Processed event data:', processedEventData);

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
                    const updatedEvent = {
                        ...processedEventData,
                        id: event.id,
                        xPosition: newXPosition
                    };
                    // Save only the updated event
                    saveEvents(updatedEvent);
                    return updatedEvent;
                }
                return event;
            });
            setEvents(updatedEvents);
        } else {
            // Create new event
            const isStatus = processedEventData.type === 'status';
            const baseEvent = {
                ...processedEventData,
                width: processedEventData.width || (isStatus ? settings.defaultStatusWidth : settings.defaultEventWidth),
                xPosition: isStatus ? (100 - (processedEventData.width || settings.defaultStatusWidth)) : 0
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

            // Save only the new events
            saveEvents(newEvents);
            setEvents([...events, ...newEvents]);
        }
        setIsModalOpen(false);
        setEditingEvent(null);
    };

    return (
        <>
            <NotesPanel
                isOpen={activePanel === 'notes'}
                onToggle={() => handlePanelToggle('notes')}
            />
            <TasksPanel
                tasks={tasks}
                onTaskClick={handleTaskClick}
                onTaskDelete={handleTaskDelete}
                isOpen={activePanel === 'tasks'}
                onToggle={() => handlePanelToggle('tasks')}
            />
            <DndProvider backend={dndBackend} options={dndOptions}>
                <StatusOverlay isActive={!!activeFocusEvent} event={activeFocusEvent} />
                <div
                    className="min-h-screen w-full flex flex-col bg-[#F6F5F1]"
                    style={{ fontFamily: settings.font }}
                >
                    {/* Header */}
                    <header className="flex-none w-full bg-[#F6F5F1] border-b border-[#D1C7]">
                        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-8 py-4 sm:py-6">
                            <div className="flex flex-col space-y-4">
                                {/* First row: Calendar title and buttons */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <h1 className="text-2xl sm:text-3xl font-normal text-[#2C2C2C] tracking-wide">Calendar</h1>
                                    <div className="flex items-center gap-2 sm:gap-4">
                                        <span className="hidden sm:hidden md:inline-block text-xs text-gray-500 font-mono">{VERSION}</span>
                                        <div className="flex flex-wrap gap-2 sm:gap-4">
                                            <button
                                                onClick={() => setActivePanel('notes')}
                                                className="px-3 sm:px-4 py-2 text-sm font-medium border-2 border-[#2C2C2C] rounded hover:bg-[#2C2C2C] hover:text-[#F6F5F1] transition-colors duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                                            >
                                                Notes
                                            </button>
                                            <button
                                                onClick={() => setActivePanel('tasks')}
                                                className="px-3 sm:px-4 py-2 text-sm font-medium border-2 border-[#2C2C2C] rounded hover:bg-[#2C2C2C] hover:text-[#F6F5F1] transition-colors duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                                            >
                                                Tasks
                                            </button>
                                            <button
                                                onClick={() => setIsSettingsOpen(true)}
                                                className="px-3 sm:px-4 py-2 text-sm font-medium border-2 border-[#2C2C2C] rounded hover:bg-[#2C2C2C] hover:text-[#F6F5F1] transition-colors duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                                            >
                                                Settings
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="px-3 sm:px-4 py-2 text-sm font-medium text-red-600 border-2 border-red-600 rounded hover:bg-red-50 transition-colors duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                                            >
                                                Logout
                                            </button>
                                            <button
                                                onClick={toggleFullscreen}
                                                className="hidden sm:flex p-2 sm:p-3 bg-[#f0f0f0] border border-[#ccc] rounded items-center justify-center hover:bg-[#e0e0e0] transition-colors duration-200"
                                                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                                            >
                                                {isFullscreen ?
                                                    <RiFullscreenExitFill size={20} /> :
                                                    <RiFullscreenFill size={20} />
                                                }
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* View controls */}
                                <div className="flex justify-between items-center">
                                    <ViewSelector
                                        currentView={currentView}
                                        onViewChange={setCurrentView}
                                        primaryColor={settings.primaryColor}
                                        onTemplatesClick={() => setIsTemplatesModalOpen(true)}
                                    />
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}
                    <main className="flex-1 overflow-hidden pb-8">
                        <div className="h-full max-w-[1600px] mx-auto px-2 sm:px-8">
                            {renderView()}
                        </div>
                    </main>

                    {/* Modals with improved mobile styling */}
                    {isModalOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-2 sm:p-4 z-50">
                            <div className="bg-[#F6F5F1] rounded-none border border-[#2C2C2C] p-4 sm:p-8 w-full max-w-md vintage-shadow max-h-[90vh] overflow-y-auto">
                                <h2 className="text-xl font-normal text-[#2C2C2C] mb-6">
                                    {editingEvent ? 'Edit Event' : 'New Event'}
                                </h2>
                                <EventForm
                                    onSubmit={handleNewEvent}
                                    onCancel={handleModalClose}
                                    initialTime={selectedTime}
                                    initialDate={currentDate.toISOString().split('T')[0]}
                                    initialData={editingEvent}
                                    settings={settings}
                                />
                            </div>
                        </div>
                    )}

                    {/* Settings Modal */}
                    {isSettingsOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-2 sm:p-4 z-50">
                            <div className="bg-[#F6F5F1] rounded-none border border-[#2C2C2C] p-4 sm:p-8 w-full max-w-md vintage-shadow max-h-[90vh] overflow-y-auto">
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

                    {/* Login/Register Modal */}
                    {isLoginModalOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-2 sm:p-4 z-50">
                            <div className="bg-[#F6F5F1] rounded-none border border-[#2C2C2C] p-4 sm:p-8 w-full max-w-md vintage-shadow">
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

                    {isTaskModalOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
                            <div className="bg-[#F6F5F1] rounded-none border border-[#2C2C2C] p-8 max-w-md w-full vintage-shadow">
                                <h2 className="text-xl font-normal text-[#2C2C2C] mb-6">
                                    {editingTask ? 'Edit Task' : 'New Task'}
                                </h2>
                                <TaskForm
                                    onSubmit={handleTaskSubmit}
                                    onCancel={handleTaskModalClose}
                                    initialData={editingTask}
                                />
                            </div>
                        </div>
                    )}

                    {/* Templates Modal */}
                    {isTemplatesModalOpen && (
                        <TemplatesModal
                            onClose={() => setIsTemplatesModalOpen(false)}
                            events={events}
                            onLoadTemplate={handleLoadTemplate}
                            currentDate={currentDate}
                        />
                    )}
                </div>
            </DndProvider>
        </>
    );
}

export default App;
