import { useColumns } from '@/hooks/useColumns';
import { Button } from '@joisse1101/ui-library';
import { TicketCard } from './TicketCard';

interface ColumnProps {
    columnId: string;
}
export const Column: React.FC<ColumnProps> = ({ columnId }) => {
    const { addTicket, tickets, column } = useColumns(columnId);
    return (
        <div className="column" key={columnId}>
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
            <div className="tickets-container">
                {tickets.map((ticket) => (
                    <TicketCard
                        key={ticket.id}
                        ticketId={ticket.id}
                    />
                ))}
            </div>
        </div>
    );
};
