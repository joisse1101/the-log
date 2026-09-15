import { useCallback } from 'react';
import { useDrop } from 'react-dnd';
import { useColumns } from '@/hooks/useColumns';
import { Button } from '@joisse1101/ui-library';
import { TicketCard, TICKET_DRAG_TYPE, type TicketDragItem } from './TicketCard';

interface ColumnProps {
    columnId: string;
}
export const Column: React.FC<ColumnProps> = ({ columnId }) => {
    const { addTicket, tickets, column, moveTicket } = useColumns(columnId);

    const [{ isOver }, drop] = useDrop<TicketDragItem, unknown, { isOver: boolean }>(() => ({
        accept: TICKET_DRAG_TYPE,
        drop: (item) => {
            moveTicket(item.ticketId, item.columnId);
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    }), [moveTicket]);

    const dropRef = useCallback((node: HTMLDivElement | null) => {
        drop(node);
    }, [drop]);

    return (
        <div className={`column${isOver ? ' is-over' : ''}`} key={columnId} ref={dropRef}>
            <div className="header">
                <span>{column?.name}</span>
                <Button
                    onClick={() => { addTicket(); }}
                    variant="primary"
                    icon={true}
                >
                    +
                </Button>
            </div>
            <div className={`tickets-container${isOver ? ' is-over' : ''}`}>
                {tickets.map((ticket) => (
                    <TicketCard
                        key={ticket.id}
                        ticketId={ticket.id}
                        columnId={columnId}
                    />
                ))}
            </div>
        </div>
    );
};
