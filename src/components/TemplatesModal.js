import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

function TemplatesModal({ onClose, events, onLoadTemplate, currentDate }) {
    const [activeTab, setActiveTab] = useState('new');
    const [templates, setTemplates] = useState([]);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [loading, setLoading] = useState(false);

    // Fetch templates on mount
    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await fetch(`${process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api'}/templates`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setTemplates(data);
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        }
    };

    const handleCreateTemplate = async (e) => {
        e.preventDefault();
        if (!newTemplateName.trim()) return;

        setLoading(true);
        try {
            // Get events from the selected date
            const selectedDate = currentDate.toISOString().split('T')[0];
            const selectedDayEvents = events.filter(event => event.date === selectedDate);

            if (selectedDayEvents.length === 0) {
                toast.error('No events found for the selected date');
                return;
            }

            await fetch(`${process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api'}/templates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    name: newTemplateName,
                    events: selectedDayEvents
                })
            });

            setNewTemplateName('');
            fetchTemplates();
            toast.success('Template created successfully');
        } catch (error) {
            console.error('Failed to create template:', error);
            toast.error('Failed to create template');
        } finally {
            setLoading(false);
        }
    };

    const handleLoadTemplate = async (template) => {
        const selectedDate = currentDate.toISOString().split('T')[0];
        if (window.confirm(`This will clear all events for ${selectedDate}. Continue?`)) {
            await onLoadTemplate(template);
            onClose();
        }
    };

    const handleDeleteTemplate = async (templateId, e) => {
        e.stopPropagation(); // Prevent triggering the load template action
        if (!window.confirm('Are you sure you want to delete this template?')) {
            return;
        }

        try {
            const response = await fetch(`${process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api'}/templates/${templateId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete template');
            }

            // Remove the template from the local state
            setTemplates(templates.filter(t => t.id !== templateId));
            toast.success('Template deleted successfully');
        } catch (error) {
            console.error('Failed to delete template:', error);
            toast.error('Failed to delete template');
        }
    };

    const renderNewTemplate = () => (
        <form onSubmit={handleCreateTemplate} className="space-y-4">
            <p className="text-sm text-[#2C2C2C]/70">
                Create a new template from the selected date's events.
            </p>
            <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
                    Template Name
                </label>
                <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="w-full px-3 py-2 border border-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#2C2C2C] bg-[#F6F5F1]"
                    placeholder="e.g., Work Day, Study Schedule"
                    required
                />
            </div>
            <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 text-sm font-medium text-[#2C2C2C] border-2 border-[#2C2C2C] rounded hover:bg-[#2C2C2C] hover:text-[#F6F5F1] transition-colors duration-200"
            >
                {loading ? 'Creating...' : 'Create Template'}
            </button>
        </form>
    );

    const renderTemplateList = () => (
        <div className="space-y-4">
            {templates.length === 0 ? (
                <p className="text-sm text-[#2C2C2C]/70">
                    No templates yet.
                </p>
            ) : (
                <div className="space-y-2">
                    {templates.map(template => (
                        <div
                            key={template.id}
                            className="p-4 border border-[#2C2C2C] hover:bg-[#2C2C2C]/5 transition-colors"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-medium text-[#2C2C2C]">{template.name}</h3>
                                    <p className="text-sm text-[#2C2C2C]/70">
                                        {template.events.length} events
                                    </p>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleLoadTemplate(template)}
                                        className="px-3 py-1 text-sm text-[#2C2C2C] border border-[#2C2C2C] rounded hover:bg-[#2C2C2C] hover:text-[#F6F5F1] transition-colors"
                                    >
                                        Load
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteTemplate(template.id, e)}
                                        className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-600 hover:text-[#F6F5F1] transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
            <div className="bg-[#F6F5F1] rounded-none border border-[#2C2C2C] p-8 max-w-md w-full vintage-shadow">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-normal text-[#2C2C2C]">
                        Templates
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-[#2C2C2C] hover:text-[#2C2C2C]/70"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex border-b border-[#2C2C2C] mb-6">
                    <button
                        onClick={() => setActiveTab('new')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-[1px] ${
                            activeTab === 'new'
                                ? 'border-[#2C2C2C] text-[#2C2C2C]'
                                : 'border-transparent text-[#2C2C2C]/60 hover:text-[#2C2C2C]/80'
                        }`}
                    >
                        New Template
                    </button>
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-[1px] ${
                            activeTab === 'list'
                                ? 'border-[#2C2C2C] text-[#2C2C2C]'
                                : 'border-transparent text-[#2C2C2C]/60 hover:text-[#2C2C2C]/80'
                        }`}
                    >
                        Template List
                    </button>
                </div>

                <div className="pt-4">
                    {activeTab === 'new' ? renderNewTemplate() : renderTemplateList()}
                </div>
            </div>
        </div>
    );
}

export default TemplatesModal;