import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay, setHours, addHours } from 'date-fns';
import enUS from 'date-fns/locale/en-US';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const initialEvents = [
  {
    id: 1,
    title: 'Morning Meeting',
    start: new Date(new Date().setHours(9, 0, 0, 0)),
    end: new Date(new Date().setHours(10, 0, 0, 0)),
  },
  {
    id: 2,
    title: 'Afternoon Review',
    start: new Date(new Date().setHours(14, 0, 0, 0)),
    end: new Date(new Date().setHours(15, 0, 0, 0)),
  }
];

const MyCalendar = () => {
  const [events, setEvents] = useState(initialEvents);
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [dayStartHour, setDayStartHour] = useState(6);
  const [selectedStartHour, setSelectedStartHour] = useState(6);
  const [currentView, setCurrentView] = useState('week');
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);

  const getDayStartTime = () => {
    const date = new Date();
    date.setHours(dayStartHour, 0, 0, 0);
    return date;
  };

  const handleSettingsOpen = () => {
    setSelectedStartHour(dayStartHour);
    setIsSettingsModalOpen(true);
  };

  const handleSettingsSave = () => {
    setDayStartHour(selectedStartHour);
    setIsSettingsModalOpen(false);
  };

  const getVisibleEvents = () => {
    if (currentView !== 'day') return events;

    const dayStart = getDayStartTime();
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return eventEnd > dayStart;
    });
  };

  const getHiddenEventsCount = () => {
    if (currentView !== 'day') return 0;

    const dayStart = getDayStartTime();
    return events.filter(event => new Date(event.start) < dayStart).length;
  };

  const resetNewEvent = () => {
    setNewEvent({
      title: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '10:00'
    });
    setIsEditing(false);
    setSelectedEventId(null);
  };

  const handleEventSelect = (event) => {
    setSelectedEventId(event.id);
    setIsEditing(true);
    setNewEvent({
      title: event.title,
      date: format(event.start, 'yyyy-MM-dd'),
      startTime: format(event.start, 'HH:mm'),
      endTime: format(event.end, 'HH:mm')
    });
    setIsNewEventModalOpen(true);
  };

  const handleModalClose = () => {
    setIsNewEventModalOpen(false);
    resetNewEvent();
  };

  const handleEventSubmit = (e) => {
    e.preventDefault();
    const [startHours, startMinutes] = newEvent.startTime.split(':');
    const [endHours, endMinutes] = newEvent.endTime.split(':');

    const startDate = new Date(newEvent.date);
    startDate.setHours(parseInt(startHours), parseInt(startMinutes), 0);

    const endDate = new Date(newEvent.date);
    endDate.setHours(parseInt(endHours), parseInt(endMinutes), 0);

    if (isEditing) {
      // Update existing event
      setEvents(events.map(event =>
        event.id === selectedEventId
          ? {
              ...event,
              title: newEvent.title,
              start: startDate,
              end: endDate
            }
          : event
      ));
    } else {
      // Create new event
      const newEventObj = {
        id: events.length + 1,
        title: newEvent.title,
        start: startDate,
        end: endDate,
      };
      setEvents([...events, newEventObj]);
    }

    handleModalClose();
  };

  const validateAndUpdateEndTime = (newEndTime) => {
    const [startHours, startMinutes] = newEvent.startTime.split(':');
    const [endHours, endMinutes] = newEndTime.split(':');
    const startInMinutes = parseInt(startHours) * 60 + parseInt(startMinutes);
    const endInMinutes = parseInt(endHours) * 60 + parseInt(endMinutes);

    if (endInMinutes <= startInMinutes) {
      // If end time is before or equal to start time, set it to start time + 1 hour
      const newEndInMinutes = startInMinutes + 60;
      const hours = Math.floor(newEndInMinutes / 60);
      const minutes = newEndInMinutes % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    return newEndTime;
  };

  const handleStartTimeChange = (e) => {
    const newStartTime = e.target.value;
    setNewEvent(prev => ({
      ...prev,
      startTime: newStartTime,
      // Adjust end time if needed when start time changes
      endTime: validateAndUpdateEndTime(prev.endTime)
    }));
  };

  const handleEndTimeChange = (e) => {
    const validatedEndTime = validateAndUpdateEndTime(e.target.value);
    setNewEvent(prev => ({
      ...prev,
      endTime: validatedEndTime
    }));
  };

  return (
    <div className="h-[80vh] flex flex-col">
      {/* Header with buttons */}
      <div className="mb-4 flex justify-end gap-2">
        <button
          onClick={() => setIsNewEventModalOpen(true)}
          className="px-3 py-1 bg-blue-500 text-white hover:bg-blue-600 rounded-md shadow-sm"
        >
          + Add Event
        </button>
        <button
          onClick={handleSettingsOpen}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md shadow-sm"
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Hidden Events Banner - only show in day view */}
      {getHiddenEventsCount() > 0 && (
        <div className="mb-4 p-2 bg-yellow-100 border border-yellow-400 rounded-md text-yellow-800">
          {getHiddenEventsCount()} earlier event{getHiddenEventsCount() !== 1 ? 's' : ''} not shown
        </div>
      )}

      {/* Calendar */}
      <div className="flex-1">
        <Calendar
          localizer={localizer}
          events={getVisibleEvents()}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          min={getDayStartTime()}
          onView={setCurrentView}
          view={currentView}
          showMultiDayTimes={true}
          onDoubleClickEvent={handleEventSelect}
        />
      </div>

      {/* New Event Modal */}
      {isNewEventModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? 'Edit Event' : 'Add New Event'}
            </h2>
            <form onSubmit={handleEventSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter event title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      required
                      value={newEvent.startTime}
                      onChange={handleStartTimeChange}
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      required
                      value={newEvent.endTime}
                      onChange={handleEndTimeChange}
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  {isEditing ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Settings</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Day Start Time
              </label>
              <select
                value={selectedStartHour}
                onChange={(e) => setSelectedStartHour(Number(e.target.value))}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[...Array(24)].map((_, i) => (
                  <option key={i} value={i}>
                    {i === 0 ? '12:00 AM' :
                     i < 12 ? `${i}:00 AM` :
                     i === 12 ? '12:00 PM' :
                     `${i-12}:00 PM`}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSettingsSave}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCalendar;
