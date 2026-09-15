import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDrag } from 'react-dnd';
import { useTicket } from '@/hooks/useBoards';
import { getShortDisplayDateTime } from '@/utils/dates';
import { Card } from '@joisse1101/ui-library';

export const TICKET_DRAG_TYPE = 'TICKET';

export interface TicketDragItem {
    ticketId: string;
    columnId: string;
}

interface TicketCardProps {
    ticketId: string;
    columnId: string;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticketId, columnId }) => {
    const { ticket } = useTicket(ticketId);

    const [{ isDragging }, drag] = useDrag<TicketDragItem, unknown, { isDragging: boolean }>(() => ({
        type: TICKET_DRAG_TYPE,
        item: { ticketId, columnId },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }), [ticketId, columnId]);

    const dragRef = useCallback((node: HTMLDivElement | null) => {
        drag(node);
    }, [drag]);

    if (!ticket) return null;

    return (
        <div
            ref={dragRef}
            data-ticket-id={ticketId}
            className="ticket-card-drag-handle"
            style={{ opacity: isDragging ? 0.5 : 1 }}
        >
            <Link className="ticket-card-link" to={`/the-log/the-board/tickets/${ticket.id}`}>
                <Card className="ticket-card" padding='sm'>

                    <span className="ticket-card-title">{ticket.title}</span>
                    {ticket.tags && ticket.tags.map((tag, index) => (
                        <span className="ticket-card-tag" key={index}>{tag}</span>
                    ))}
                    {getShortDisplayDateTime(new Date(ticket.createdAt))}
                </Card>
            </Link>
        </div>
    );
};
