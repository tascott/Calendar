import React, { useState, useEffect } from 'react';

function StatusOverlay({ isActive, event }) {
    const [opacity, setOpacity] = useState(0);
    const [showAnimation, setShowAnimation] = useState(true);
    const [text, setText] = useState('');
    const fullText = 'Focus';

    useEffect(() => {
        // Only show overlay if event is active, is a focus event, and was just dropped
        const shouldShowOverlay = isActive && event?.type === 'focus' && event?.justDropped;

        if (shouldShowOverlay) {
            // Start fade in
            setOpacity(0);
            setTimeout(() => setOpacity(80), 50);

            // Reset text and start typing animation
            setText('');
            let currentIndex = 0;
            const typingInterval = setInterval(() => {
                if (currentIndex < fullText.length) {
                    setText(prev => prev + fullText[currentIndex]);
                    currentIndex++;
                } else {
                    clearInterval(typingInterval);
                }
            }, 150); // Adjust typing speed here

            return () => {
                clearInterval(typingInterval);
            };
        } else {
            setOpacity(0);
            setText('');
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
                    <span className="animate-blink">|</span>
                </div>
            </div>

            <style jsx>{`
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                .animate-blink {
                    animation: blink 1s step-end infinite;
                }
            `}</style>
        </div>
    );
}

export default StatusOverlay;