import React, { useState, useEffect } from 'react';

function PomodoroDialog({ onClose, focusText }) {
    const [minutes, setMinutes] = useState(25);
    const [isRunning, setIsRunning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const [isComplete, setIsComplete] = useState(false);
    const [opacity, setOpacity] = useState(0);
    const [breakMinutes, setBreakMinutes] = useState(5);
    const [isBreakTime, setIsBreakTime] = useState(false);

    // Handle opacity animation when timer starts/stops
    useEffect(() => {
        if (isRunning) {
            setOpacity(0);
            setTimeout(() => setOpacity(95), 50); // Fade in
        } else {
            setOpacity(0); // Fade out when timer stops
        }
    }, [isRunning]);

    useEffect(() => {
        if (!isRunning || !timeLeft) return;

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1000) {
                    setIsRunning(false);
                    setIsComplete(true);
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
        setIsComplete(false);
    };

    const formatTime = (ms) => {
        const minutes = Math.floor(ms / (60 * 1000));
        const seconds = Math.floor((ms % (60 * 1000)) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const getProgressPercent = () => {
        if (!isRunning || !timeLeft) return 0;
        const totalMs = minutes * 60 * 1000;
        return ((totalMs - timeLeft) / totalMs) * 100;
    };

    const handleBreakStart = () => {
        setTimeLeft(breakMinutes * 60 * 1000);
        setIsBreakTime(true);
        setIsRunning(true);
        setIsComplete(false);
    };

    const handleStop = () => {
        setIsRunning(false);
        setIsBreakTime(false);
        setTimeLeft(null);
    };

    return (
        <>
            {/* Dark overlay */}
            <div
                className="fixed inset-0 bg-black pointer-events-none z-40 transition-opacity duration-1000"
                style={{ opacity: `${opacity * 0.9}%` }}
            />

            {/* Dialog */}
            <div className="fixed inset-0 flex items-center justify-center z-[9999]" onClick={onClose}>
                <style>{`
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                    }
                    @keyframes glow {
                        0%, 100% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.3); }
                        50% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.5); }
                    }
                    @keyframes celebrate {
                        0% { transform: scale(0.5) rotate(-10deg); opacity: 0; }
                        50% { transform: scale(1.1) rotate(5deg); opacity: 1; }
                        100% { transform: scale(1) rotate(0); opacity: 1; }
                    }
                    @keyframes confetti {
                        0% { transform: translateY(0) rotate(0); opacity: 1; }
                        100% { transform: translateY(100px) rotate(360deg); opacity: 0; }
                    }
                    .progress-ring {
                        transform: rotate(-90deg);
                    }
                `}</style>
                <div
                    className={`relative bg-[#F6F5F1] p-8 rounded-2xl shadow-2xl border-4 ${
                        isComplete ? 'border-green-500 animate-[celebrate_0.5s_ease-out_forwards]' :
                        'border-[#2C2C2C]'
                    } w-96`}
                    onClick={e => e.stopPropagation()}
                >
                    {!isRunning && !isComplete ? (
                        <form onSubmit={handleStart} className="space-y-6">
                            <h2 className="text-2xl font-bold text-[#2C2C2C] text-center mb-6">Pomodoro Timer</h2>
                            <div>
                                <label className="block text-lg font-medium text-[#2C2C2C] mb-2">
                                    Minutes
                                </label>
                                <input
                                    type="number"
                                    value={minutes}
                                    onChange={(e) => setMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-full px-4 py-3 text-xl border-2 border-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#2C2C2C] bg-[#F6F5F1] rounded-lg"
                                    min="1"
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-2 text-base font-medium text-[#2C2C2C] border-2 border-[#2C2C2C] rounded-lg hover:bg-[#2C2C2C] hover:text-[#F6F5F1] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 text-base font-medium text-[#F6F5F1] bg-[#2C2C2C] border-2 border-[#2C2C2C] rounded-lg hover:bg-[#2C2C2C]/90 transition-colors"
                                >
                                    Start
                                </button>
                            </div>
                        </form>
                    ) : isComplete ? (
                        <div className="text-center space-y-6">
                            <div className="relative">
                                {/* Confetti effect */}
                                <div className="absolute inset-0 -top-8">
                                    {[...Array(20)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="absolute"
                                            style={{
                                                left: `${Math.random() * 100}%`,
                                                animation: `confetti ${0.5 + Math.random() * 1}s ease-out forwards`,
                                                animationDelay: `${Math.random() * 0.5}s`,
                                                backgroundColor: ['#FFD700', '#FF6B6B', '#4CAF50', '#64B5F6'][Math.floor(Math.random() * 4)],
                                                width: '8px',
                                                height: '8px',
                                                transform: `rotate(${Math.random() * 360}deg)`
                                            }}
                                        />
                                    ))}
                                </div>
                                <h2 className="text-3xl font-bold text-green-500 mb-4">Time's Up!</h2>
                                <p className="text-xl text-[#2C2C2C] mb-8">Great work! Take a break.</p>
                            </div>

                            {/* Break timer selection */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-[#2C2C2C]">Time break</h3>
                                <div className="flex justify-center space-x-3">
                                    {[2, 5, 10].map((mins) => (
                                        <button
                                            key={mins}
                                            onClick={() => setBreakMinutes(mins)}
                                            className={`px-4 py-2 text-base font-medium rounded-lg transition-colors ${
                                                breakMinutes === mins
                                                    ? 'bg-[#2C2C2C] text-[#F6F5F1] border-2 border-[#2C2C2C]'
                                                    : 'text-[#2C2C2C] border-2 border-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-[#F6F5F1]'
                                            }`}
                                        >
                                            {mins}m
                                        </button>
                                    ))}
                                </div>
                                <div className="flex justify-center space-x-3 mt-4">
                                    <button
                                        onClick={handleBreakStart}
                                        className="px-6 py-2 text-base font-medium text-[#F6F5F1] bg-green-500 border-2 border-green-500 rounded-lg hover:bg-green-600 transition-colors"
                                    >
                                        Start Break
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-2 text-base font-medium text-[#2C2C2C] border-2 border-[#2C2C2C] rounded-lg hover:bg-[#2C2C2C] hover:text-[#F6F5F1] transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-6">
                            {isBreakTime ? (
                                <div className="text-[#2C2C2C] text-2xl sm:text-3xl md:text-4xl font-bold tracking-wider mb-4">
                                    Break Time
                                </div>
                            ) : focusText && (
                                <div className="text-[#2C2C2C] text-2xl sm:text-3xl md:text-4xl font-bold tracking-wider mb-4">
                                    {focusText}
                                </div>
                            )}
                            <div className="relative w-48 h-48 mx-auto">
                                <svg className="progress-ring" width="100%" height="100%">
                                    <circle
                                        className="text-gray-200"
                                        strokeWidth="8"
                                        stroke="currentColor"
                                        fill="transparent"
                                        r="70"
                                        cx="96"
                                        cy="96"
                                    />
                                    <circle
                                        className={`transition-all duration-500 ${isBreakTime ? 'text-green-500' : 'text-[#2C2C2C]'}`}
                                        strokeWidth="8"
                                        stroke="currentColor"
                                        fill="transparent"
                                        r="70"
                                        cx="96"
                                        cy="96"
                                        strokeDasharray={`${2 * Math.PI * 70}`}
                                        strokeDashoffset={`${2 * Math.PI * 70 * (1 - getProgressPercent() / 100)}`}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className={`text-5xl font-bold text-[#2C2C2C] ${timeLeft <= 60000 ? 'animate-[pulse_1s_ease-in-out_infinite]' : ''}`}>
                                        {formatTime(timeLeft)}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleStop}
                                className="px-6 py-2 text-base font-medium text-[#2C2C2C] border-2 border-[#2C2C2C] rounded-lg hover:bg-[#2C2C2C] hover:text-[#F6F5F1] transition-colors"
                            >
                                Stop
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default PomodoroDialog;