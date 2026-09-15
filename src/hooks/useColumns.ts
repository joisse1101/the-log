
import { useLiveQuery } from 'dexie-react-hooks';
import {
    logDb,
    TicketSchema,
    ColumnTicketSchema,
    type Ticket,
    type ColumnTicket,
} from '@/db/theLogsDb';
import { getInsertPosition, isGapTooTight, rebalancePositions } from '@/utils/positioning';

export type PositionedTicket = Ticket & { position: number };
export type ReorderPlacement = 'before' | 'after';
export interface ReorderTarget {
    ticketId: string;
    placement: ReorderPlacement;
}

async function getSortedColumnTickets(columnId: string): Promise<ColumnTicket[]> {
    return logDb.columnTickets
        .where('columnId')
        .equals(columnId)
        .sortBy('position');
}

export function useColumns(columnId: string) {
    const column = useLiveQuery(
        async () => {
            return await logDb.columns.get(columnId);
        },
        [columnId],
        undefined
    );
    const tickets = useLiveQuery(
        async (): Promise<PositionedTicket[]> => {
            const columnTickets = await getSortedColumnTickets(columnId);
            const ticketRecords = await logDb.tickets.bulkGet(columnTickets.map((ct) => ct.ticketId));
            return columnTickets.flatMap((ct, index) => {
                const ticket = ticketRecords[index];
                return ticket ? [{ ...ticket, position: ct.position }] : [];
            });
        },
        [columnId],
        []
    );

    const addTicket = async () => {
        const ticketId = await logDb.tickets.add(TicketSchema.parse({ title: "New Ticket" }))
        const siblings = await getSortedColumnTickets(columnId);
        const position = getInsertPosition(siblings.at(-1)?.position, undefined);
        await logDb.columnTickets.add(ColumnTicketSchema.parse({
            columnId,
            ticketId,
            position,
        }));
    };

    // Moves `ticketId` into this hook's column, before/after `target` (or
    // appended to the end if omitted), rebalancing the column if the
    // fractional positions around the insertion point get too tight.
    const moveTicket = async (ticketId: string, fromColumnId: string, target?: ReorderTarget) => {
        if (target?.ticketId === ticketId) return;

        const columnTicket = await logDb.columnTickets
            .where('ticketId')
            .equals(ticketId)
            .and((ct) => ct.columnId === fromColumnId)
            .first();
        if (!columnTicket) return;

        const siblings = (await getSortedColumnTickets(columnId))
            .filter((ct) => ct.id !== columnTicket.id);

        let insertAt = siblings.length;
        if (target) {
            const targetIndex = siblings.findIndex((ct) => ct.ticketId === target.ticketId);
            if (targetIndex !== -1) {
                insertAt = target.placement === 'before' ? targetIndex : targetIndex + 1;
            }
        }

        const prev = siblings[insertAt - 1];
        const next = siblings[insertAt];

        if (isGapTooTight(prev?.position, next?.position)) {
            const finalOrder = [...siblings];
            finalOrder.splice(insertAt, 0, columnTicket);
            const rebalanced = rebalancePositions(finalOrder);
            await logDb.columnTickets.bulkPut(
                rebalanced.map((ct) => ({ ...ct, columnId }))
            );
            return;
        }

        const position = getInsertPosition(prev?.position, next?.position);
        await logDb.columnTickets.update(columnTicket.id, {
            columnId,
            position,
        });
    };

    return { addTicket, tickets, column, moveTicket };
}
