import React, { useState, useEffect } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight, FaSpinner } from 'react-icons/fa';

const API_URL = process.env.NODE_ENV === 'production'
    ? '/api'  // In production, use relative path
    : 'http://localhost:3001/api'; // In development, use full URL

const NotesPanel = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (localStorage.getItem('token')) {
            fetchNotes();
        }
    }, []);

    const fetchNotes = async () => {
        try {
            const response = await fetch(`${API_URL}/notes`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch notes');
            const data = await response.json();
            console.log('Fetched notes:', data);
            setNotes(data);
        } catch (error) {
            console.error('Error fetching notes:', error);
        }
    };

    const handleSaveNote = async () => {
        if (!newNote.trim()) return;
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ content: newNote })
            });
            if (!response.ok) throw new Error('Failed to save note');
            const data = await response.json();
            setNotes(data);
            setNewNote('');
        } catch (error) {
            console.error('Error saving note:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSaveNote();
        }
    };

    return (
        <div className={`fixed right-0 top-1/2 -translate-y-1/2 h-[600px] flex items-start transition-transform duration-300 z-50 ${isOpen ? 'translate-x-0' : 'translate-x-[calc(100%-2.5rem)]'}`}>
            {/* Tab */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="notes-panel-tab bg-[#2C2C2C] text-white px-2 py-4 rounded-r-md h-32 flex items-center border-2 border-r-0 border-[#2C2C2C]"
                style={{
                    writingMode: 'vertical-lr',
                    transform: 'rotate(180deg)',
                    marginTop: 'calc(300px - 64px)'  // Half of container height (600px/2) minus half of tab height (128px/2)
                }}
            >
                <span className="flex items-center gap-2">
                    {isOpen ? <FaChevronRight className="rotate-180" /> : <FaChevronLeft className="rotate-180" />}
                    Notes
                </span>
            </button>

            {/* Panel */}
            <div className={`bg-[#F6F5F1] border-2 ${isOpen ? '' : 'border-r-0'} border-[#2C2C2C] shadow-lg h-full w-80 flex flex-col ${isOpen ? 'rounded-md' : 'rounded-r-md'}`}>
                <div className="p-4 border-b-2 border-[#2C2C2C] flex justify-between items-center">
                    <h2 className="text-lg font-normal text-[#2C2C2C]">Notes</h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-[#2C2C2C] hover:text-[#4A4A4A]"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Notes list */}
                <div className="flex-1 overflow-y-auto p-4">
                    {notes.length === 0 ? (
                        <p className="text-gray-500 text-center">No notes yet</p>
                    ) : (
                        notes.map((note) => (
                            <div key={note.id} className="mb-4 p-3 bg-white border-2 border-[#2C2C2C] rounded">
                                <p className="text-[#2C2C2C] whitespace-pre-wrap">{note.content}</p>
                            </div>
                        ))
                    )}
                </div>

                {/* Input area */}
                <div className="p-4 border-t-2 border-[#2C2C2C] bg-[#F6F5F1]">
                    <div className="relative">
                        <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type a note and press Enter..."
                            className="w-full p-2 border-2 border-[#2C2C2C] rounded resize-none bg-white text-[#2C2C2C] placeholder-gray-500 focus:outline-none focus:border-[#4A4A4A] focus:ring-1 focus:ring-[#4A4A4A]"
                            rows="3"
                            disabled={isLoading}
                        />
                        {isLoading && (
                            <div className="absolute right-2 top-2">
                                <FaSpinner className="animate-spin text-[#2C2C2C]" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotesPanel;