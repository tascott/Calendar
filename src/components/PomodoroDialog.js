import React, { useState, useEffect } from 'react';

function PomodoroDialog({ onClose }) {
    const [minutes, setMinutes] = useState(25);
    const [isRunning, setIsRunning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (!isRunning || !timeLeft) return;

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1000) {
                    setIsRunning(false);
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1000;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning, timeLeft]);

    const handleStart = (e) => {
        e.preventDefault();
        setTimeLeft(minutes * 60 * 1000);
        setIsRunning(true);
    };

    const formatTime = (ms) => {
        const minutes = Math.floor(ms / (60 * 1000));
        const seconds = Math.floor((ms % (60 * 1000)) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" onClick={onClose}>
            <div
                className="bg-[#F6F5F1] p-6 rounded-lg shadow-xl border-2 border-[#2C2C2C] w-64"
                onClick={e => e.stopPropagation()}
            >
                {!isRunning ? (
                    <form onSubmit={handleStart} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
                                Minutes
                            </label>
                            <input
                                type="number"
                                value={minutes}
                                onChange={(e) => setMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full px-3 py-2 border border-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#2C2C2C] bg-[#F6F5F1]"
                                min="1"
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-3 py-1.5 text-sm font-medium text-[#2C2C2C] border border-[#2C2C2C] rounded hover:bg-[#2C2C2C] hover:text-[#F6F5F1] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-3 py-1.5 text-sm font-medium text-[#F6F5F1] bg-[#2C2C2C] border border-[#2C2C2C] rounded hover:bg-[#2C2C2C]/90 transition-colors"
                            >
                                Start
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="text-center space-y-4">
                        <div className="text-3xl font-bold text-[#2C2C2C]">
                            {formatTime(timeLeft)}
                        </div>
                        <button
                            onClick={() => setIsRunning(false)}
                            className="px-3 py-1.5 text-sm font-medium text-[#2C2C2C] border border-[#2C2C2C] rounded hover:bg-[#2C2C2C] hover:text-[#F6F5F1] transition-colors"
                        >
                            Stop
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PomodoroDialog;