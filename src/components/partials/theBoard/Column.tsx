import { useCallback, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { useColumns, type ReorderPlacement, type ReorderTarget } from '@/hooks/useColumns';
import { Button } from '@joisse1101/ui-library';
import { TicketCard, TICKET_DRAG_TYPE, type TicketDragItem } from './TicketCard';

interface ColumnProps {
    columnId: string;
}

// Placement is decided by the nearest card's original position relative to
// the dragged card (above -> before, below -> after), not by cursor half —
// half-based detection is a no-op for adjacent swaps, since e.g. "after the
// card above" and "before the card below" resolve to the same midpoint.
function resolveDropTarget(container: HTMLElement, draggedTicketId: string, cursorY: number): ReorderTarget | undefined {
    const cardEls = Array.from(container.querySelectorAll<HTMLElement>('[data-ticket-id]'));
    const draggedIndex = cardEls.findIndex((el) => el.dataset.ticketId === draggedTicketId);

    let nearestTicketId: string | undefined;
    let nearestIndex = -1;
    let nearestMidY = 0;
    let nearestDistance = Infinity;

    cardEls.forEach((card, index) => {
        if (index === draggedIndex) return;
        const ticketId = card.dataset.ticketId;
        if (!ticketId) return;
        const rect = card.getBoundingClientRect();
        const midY = (rect.top + rect.bottom) / 2;
        const distance = Math.abs(cursorY - midY);
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestTicketId = ticketId;
            nearestIndex = index;
            nearestMidY = midY;
        }
    });

    if (!nearestTicketId) return undefined;

    if (draggedIndex !== -1) {
        const placement: ReorderPlacement = nearestIndex < draggedIndex ? 'before' : 'after';
        return { ticketId: nearestTicketId, placement };
    }

    // Cross-column drop: no original position here to compare against, so
    // fall back to cursor half.
    const placement: ReorderPlacement = cursorY < nearestMidY ? 'before' : 'after';
    return { ticketId: nearestTicketId, placement };
}

export const Column: React.FC<ColumnProps> = ({ columnId }) => {
    const { addTicket, tickets, column, moveTicket } = useColumns(columnId);
    const containerRef = useRef<HTMLDivElement>(null);

    const [{ isOver }, drop] = useDrop<TicketDragItem, unknown, { isOver: boolean }>(() => ({
        accept: TICKET_DRAG_TYPE,
        drop: (item, monitor) => {
            const container = containerRef.current;
            const clientOffset = monitor.getClientOffset();
            const target = container && clientOffset
                ? resolveDropTarget(container, item.ticketId, clientOffset.y)
                : undefined;
            moveTicket(item.ticketId, item.columnId, target);
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
            <div ref={containerRef} className="tickets-container">
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
