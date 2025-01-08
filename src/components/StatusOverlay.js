import React, { useState, useEffect, useRef } from 'react';
import PomodoroDialog from './PomodoroDialog';

function StatusOverlay({ isActive, event }) {
    const [opacity, setOpacity] = useState(0);
    const [text, setText] = useState('');
    const [isBlinking, setIsBlinking] = useState(true);
    const [showPomodoro, setShowPomodoro] = useState(false);
    const fullText = event?.overlayText || 'Focus.';
    const typingIntervalRef = useRef(null);

    const handlePomodoroClick = () => {
        console.log('Pomodoro clicked from overlay');
    };

    useEffect(() => {
        // Only show overlay if event is active, is a focus event
        const shouldShowOverlay = isActive &&
            event?.type === 'focus' &&
            event?.date === new Date().toISOString().split('T')[0];

        if (shouldShowOverlay) {
            // Start fade in
            setOpacity(0);
            setTimeout(() => setOpacity(95), 50);
            setIsBlinking(true);

            // Reset text and start typing animation
            setText('');
            let index = 0;

            // Clear any existing interval
            if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
            }

            typingIntervalRef.current = setInterval(() => {
                if (index < fullText.length) {
                    setText(fullText.slice(0, index + 1));
                    index++;
                } else {
                    if (typingIntervalRef.current) {
                        clearInterval(typingIntervalRef.current);
                    }
                    // Stop blinking after 5 seconds (5 blinks at 1s per blink)
                    setTimeout(() => setIsBlinking(false), 5000);
                }
            }, 150);

            return () => {
                if (typingIntervalRef.current) {
                    clearInterval(typingIntervalRef.current);
                }
            };
        } else {
            setOpacity(0);
            setText('');
            setIsBlinking(true);
            if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
            }
        }
    }, [isActive, event]);

    if (!isActive || event?.type !== 'focus') return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black pointer-events-none z-40 flex flex-col items-center justify-center transition-opacity duration-1000"
                style={{ opacity: `${opacity * 0.9}%` }}
            >
                <div className="relative text-center w-full px-4">
                    {/* Text with typing animation */}
                    <div className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-wider">
                        {text}
                        {isBlinking && (
                            <span className="inline-block w-[3px] sm:w-[4px] h-[40px] sm:h-[60px] md:h-[70px] bg-white ml-2 animate-blink"></span>
                        )}
                    </div>
                    <div className="mt-8 pointer-events-auto">
                        <button
                            onClick={() => setShowPomodoro(true)}
                            className="px-6 py-3 text-lg font-medium text-white border-2 border-white rounded hover:bg-white hover:text-black transition-colors duration-200"
                        >
                            Pomodoro
                        </button>
                    </div>
                </div>

                <style>{`
                    @keyframes blink {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0; }
                    }
                    .animate-blink {
                        animation: blink 1s step-end 5;
                    }
                `}</style>
            </div>

            {showPomodoro && (
                <PomodoroDialog onClose={() => setShowPomodoro(false)} />
            )}
        </>
    );
}

export default StatusOverlay;