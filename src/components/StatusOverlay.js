import React, { useState, useEffect, useRef } from 'react';

function StatusOverlay({ isActive, event }) {
    const [opacity, setOpacity] = useState(0);
    const [text, setText] = useState('');
    const [isBlinking, setIsBlinking] = useState(true);
    const fullText = 'Focus.';
    const typingIntervalRef = useRef(null);

    useEffect(() => {
        // Only show overlay if event is active, is a focus event
        const shouldShowOverlay = isActive &&
            event?.type === 'focus' &&
            event?.date === new Date().toISOString().split('T')[0];

        if (shouldShowOverlay) {
            // Start fade in
            setOpacity(0);
            setTimeout(() => setOpacity(80), 50);
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
        <div
            className="fixed inset-0 bg-black pointer-events-none z-40 flex items-center justify-center transition-opacity duration-1000"
            style={{ opacity: `${opacity}%` }}
        >
            <div className="relative">
                {/* Text with typing animation */}
                <div className="text-white text-8xl font-bold tracking-wider">
                    {text}
                    {isBlinking && (
                        <span className="inline-block w-[4px] h-[80px] bg-white ml-2 animate-blink"></span>
                    )}
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
    );
}

export default StatusOverlay;