import React from 'react';
import MyCalendar from './components/Calendar';

function App() {
    return (
        <div className="h-screen p-4 bg-gray-100">
            <h1 className="text-3xl font-bold mb-4 text-center">
                My Calendar App
            </h1>
            <MyCalendar />
        </div>
    );
}

export default App;
