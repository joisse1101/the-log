import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button, TextArea } from '@joisse1101/ui-library';
import { useTicket } from '@/hooks/useBoards';
import { getDisplayDate } from '@/utils/dates';

export default function TicketDetails() {
    const { ticketId } = useParams<{ ticketId: string }>();
    const navigate = useNavigate();
    const { ticket, isLoading, updateTicket, deleteTicket } = useTicket(ticketId ?? '');

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState<string[]>([]);

    useEffect(() => {
        if (ticket) {
            setTitle(ticket.title);
            setDescription(ticket.description);
            setTags(ticket.tags);
        }
    }, [ticket]);

    const updateTag = (index: number, value: string) => {
        setTags((prev) => prev.map((t, i) => (i === index ? value : t)));
    };
    const addTag = () => setTags((prev) => [...(prev ?? []), '']);
    const removeTag = (index: number) => setTags((prev) => prev.filter((_, i) => i !== index));

    const handleSave = async () => {
        await updateTicket({
            title,
            description,
            tags: tags.map((t) => t.trim()).filter(Boolean),
        });
    };

    const handleDelete = async () => {
        await deleteTicket();
        navigate('/the-log/the-board');
    };

    if (isLoading) return null;

    if (!ticket) {
        return (
            <div className="app-wrapper ticket-details">
                <p>Ticket not found.</p>
                <Link to="/the-log/the-board">&larr; Back to Board</Link>
            </div>
        );
    }

    return (
        <div className="app-wrapper ticket-details">
            <div className="ticket-details-header">
                <Link to="/the-log/the-board">&larr; Back to Board</Link>
                <span className="date">Created {getDisplayDate(new Date(ticket.createdAt))}</span>
            </div>
            <div className="form-container">
                <div className="form-group">
                    <label htmlFor="ticket-title">Title:</label>
                    <input
                        type="text"
                        id="ticket-title"
                        name="ticket-title"
                        placeholder="Ticket Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="ticket-description">Description:</label>
                    <TextArea
                        id="ticket-description"
                        name="ticket-description"
                        placeholder="Add a description..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onSubmit={handleSave}
                    />
                </div>
                <div className="form-group">
                    <label>Tags:</label>
                    <div className="tag-list-editor">
                        {tags && tags.map((tag, index) => (
                            <div className="tag-list-item" key={index}>
                                <input
                                    type="text"
                                    aria-label={`Tag ${index + 1}`}
                                    placeholder={`Tag ${index + 1}`}
                                    value={tag}
                                    onChange={(e) => updateTag(index, e.target.value)}
                                />
                                <Button type="button" onClick={() => removeTag(index)} variant="danger" icon={true}>✕</Button>
                            </div>
                        ))}
                        <Button type="button" onClick={addTag} variant="secondary">+ Add Tag</Button>
                    </div>
                </div>
                <div className="form-row ticket-details-actions">
                    <Button onClick={handleSave} variant="primary">Save</Button>
                    <Button onClick={handleDelete} variant="danger">Delete Ticket</Button>
                </div>
            </div>
        </div>
    );
}
