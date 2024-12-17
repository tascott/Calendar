import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay } from 'date-fns';
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
          onClick={() => setIsSettingsModalOpen(true)}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md shadow-sm"
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Calendar */}
      <div className="flex-1">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
        />
      </div>

      {/* New Event Modal */}
      {isNewEventModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Add New Event</h2>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsNewEventModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Settings</h2>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
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
