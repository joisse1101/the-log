import { Link } from 'react-router-dom';
import { useTicket } from '@/hooks/useBoards';
import { getDisplayDate } from '@/utils/dates';

interface TicketCardProps {
    ticketId: string;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticketId }) => {
    const { ticket } = useTicket(ticketId);

    if (!ticket) return null;

    return (
        <Link to={`/the-log/the-board/tickets/${ticket.id}`}>
            <div className="card ticket-card">
                <span className="ticket-card-title">{ticket.title}</span>
                {ticket.tags && ticket.tags.map((tag, index) => (
                    <span className="ticket-card-tag" key={index}>{tag}</span>
                ))}
                {getDisplayDate(new Date(ticket.createdAt))}
            </div>
        </Link>
    );
};
