import { useColumns } from '@/hooks/useBoards';
import { Button } from '@joisse1101/ui-library';
import { TicketCard } from './TicketCard';

interface ColumnProps {
    boardId: string;
    columnName: string;
}
export const Column: React.FC<ColumnProps> = ({ boardId, columnName }) => {
    const {addTicket, tickets} = useColumns(boardId, columnName); 
    return (
        <div className="column" key={columnName}>
            <div className="header">
                <span>{columnName}</span>
                <Button
                    onClick={() => { addTicket(); }}
                    variant="primary"
                    icon={true}
                >
                    +
                </Button>
            </div>
            <ul>
                {tickets.map((ticket) => (
                    <TicketCard
                        key={ticket.id}
                        ticketId={ticket.id}
                    />
                ))}
            </ul>
        </div>
    );
};