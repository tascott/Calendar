import React, { useState } from 'react';
import DayView from './views/DayView';
import WeekView from './views/WeekView';
import MonthView from './views/MonthView';
import ViewSelector from './components/ViewSelector';
import EventForm from './components/EventForm';

function App() {
    const [currentView, setCurrentView] = useState('day');
    const [events, setEvents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTime, setSelectedTime] = useState(null);

    const handleNewEvent = (eventData) => {
        setEvents(prevEvents => [...prevEvents, {
            id: Date.now(), // Simple ID generation
            ...eventData
        }]);
        setIsModalOpen(false);
    };

    const handleGridDoubleClick = (time) => {
        setSelectedTime(time);
        setIsModalOpen(true);
    };

    const renderView = () => {
        const props = {
            onDoubleClick: handleGridDoubleClick,
            events: events
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
        <div className="h-screen w-full flex flex-col bg-gray-100">
            {/* Header */}
            <header className="flex-none w-full bg-white shadow-sm">
                <div className="max-w-[1600px] w-full mx-auto px-4 py-4">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-semibold text-gray-800">My Calendar</h1>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            New Event
                        </button>
                    </div>
                    <ViewSelector currentView={currentView} onViewChange={setCurrentView} />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full overflow-auto py-4">
                <div className="max-w-[1600px] w-full mx-auto px-4">
                    <div className="bg-white rounded-lg shadow p-6">
                        {renderView()}
                    </div>
                </div>
            </main>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">New Event</h2>
                        <EventForm
                            onSubmit={handleNewEvent}
                            onCancel={() => setIsModalOpen(false)}
                            initialTime={selectedTime}
                            initialDate={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
