import React,{useState} from 'react';
import Modal from './Modal';
import Button from './Button';

const EventModal = ({isOpen,onClose,onAddEvent}) => {
    const [formData,setFormData] = useState({title: '',start: '',end: ''});

    const handleChange = (e) => {
        const {name,value} = e.target;
        setFormData({...formData,[name]: value});
    };

    const handleSubmit = () => {
        const {title,start,end} = formData;
        if(title && start && end) {
            onAddEvent({title,start: new Date(start),end: new Date(end)});
            setFormData({title: '',start: '',end: ''});
            onClose();
        } else {
            alert('Please fill in all fields.');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="space-y-4">
                <h2 className="text-lg font-bold">Add Event</h2>
                <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Event Title"
                    className="w-full border rounded p-2"
                />
                <input
                    type="date"
                    name="start"
                    value={formData.start}
                    onChange={handleChange}
                    className="w-full border rounded p-2"
                />
                <input
                    type="date"
                    name="end"
                    value={formData.end}
                    onChange={handleChange}
                    className="w-full border rounded p-2"
                />
                <Button onClick={handleSubmit} label="Add Event" />
            </div>
        </Modal>
    );
};

export default EventModal;
