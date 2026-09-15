
import { useLiveQuery } from 'dexie-react-hooks';
import {
    logDb,
    TicketSchema,
    ColumnTicketSchema,
} from '@/db/theLogsDb';

export function useColumns(columnId: string) {
    const column = useLiveQuery(
        async () => {
            return await logDb.columns.get(columnId);
        },
        [columnId],
        undefined
    );
    const tickets = useLiveQuery(
        async () => {
            const columnTickets = await logDb.columnTickets
                .where('columnId')
                .equals(columnId)
                .toArray();

            const tickets = await logDb.tickets.bulkGet(columnTickets.map((ct) => ct.ticketId));
            return tickets.flatMap((t) => (t ? [t] : []));
        },
        [columnId],
        []
    );

    const addTicket = async () => {
        const ticketId = await logDb.tickets.add(TicketSchema.parse({ title: "New Ticket" }))
        const count = await logDb.columnTickets
            .where('columnId')
            .equals(columnId)
            .count();
        await logDb.columnTickets.add(ColumnTicketSchema.parse({
            columnId,
            ticketId,
            position: count + 1,
        }));
    };



    return { addTicket, tickets, column };
}
