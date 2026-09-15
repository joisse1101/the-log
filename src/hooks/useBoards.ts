// hooks/useBoards.ts
import { useLiveQuery } from 'dexie-react-hooks';
import { logDb, BoardSchema, type Ticket, type Board, type BoardState, TicketSchema, BoardTicketSchema } from '@/db/theLogsDb';

export function useTicket(ticketId: string) {
    const ticket = useLiveQuery(() => logDb.tickets.get(ticketId), [ticketId]);

    const updateTicket = async (updates: Partial<Omit<Ticket, 'id' | 'createdAt'>>) => {
        const existing = await logDb.tickets.get(ticketId);
        if (!existing) return null;
        const updatedTicket: Ticket = {
            ...existing,
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        await logDb.tickets.put(updatedTicket);
        return updatedTicket;
    };

    const deleteTicket = async () => {
        await logDb.boardTickets.where('ticketId').equals(ticketId).delete();
        await logDb.tickets.delete(ticketId);
    };

    return {
        ticket: ticket ?? null,
        isLoading: ticket === undefined,
        updateTicket,
        deleteTicket,
    };
}

export function useColumns(boardId: string, columnId: string) {
    const tickets = useLiveQuery(
        async () => {
            const boardTickets = await logDb.boardTickets
                .where('boardId')
                .equals(boardId)
                .and(bt => bt.columnName === columnId)
                .toArray();

            const tickets = await logDb.tickets.bulkGet(boardTickets.map((bt) => bt.ticketId));
            return tickets.flatMap((t) => (t ? [t] : []));
        },
        [boardId, columnId],
        []
    );

    const addTicket = async () => {
        const ticketId = await logDb.tickets.add(TicketSchema.parse({ title: "New Ticket" }))
        const count = await logDb.boardTickets
            .where('boardId')
            .equals(boardId)
            .and(bt => bt.columnName === columnId)
            .count();
        await logDb.boardTickets.add(BoardTicketSchema.parse({
            boardId,
            columnName: columnId,
            ticketId,
            position: count + 1,
        }));
    };



    return { addTicket, tickets };
}

export function useBoards() {
    const boards = useLiveQuery(() => logDb.boards.orderBy('position').toArray());

    const addBoard = async (newBoard: Partial<BoardState>) => {
        let customName = newBoard.name ?? 'New Board';
        if (await logDb.boards.where('name').equals(customName).first() !== undefined) {
            customName += `-${crypto.randomUUID().slice(0, 4)}`;
        };
        const count = await logDb.boards.count();

        const boardToAdd: Board = BoardSchema.parse({
            name: customName,
            columns: newBoard.columns ?? ['TODO', 'In Progress', 'Done'],
            position: count,
            startDate: newBoard.startDate,
            endDate: newBoard.endDate,
        });

        await logDb.boards.add(boardToAdd);
        return boardToAdd;
    };

    const updateBoard = async (boardId: string, updates: Partial<BoardState>) => {
        const board = await logDb.boards.get(boardId);
        if (!board) return null;
        const updatedBoard = { ...board, ...updates };
        await logDb.boards.put(updatedBoard);
        return updatedBoard;
    };

    const removeBoard = async (boardId: string) => {
        await logDb.boardTickets.where('boardId').equals(boardId).delete();
        await logDb.boards.delete(boardId);

        const boardCount = await logDb.boards.count()

        if (boardCount === 0) {
            await addBoard({ name: 'Default Board' });
        }
    };

    return {
        boards: boards ?? [],
        isLoading: boards === undefined,
        addBoard,
        updateBoard,
        removeBoard,
    };
}
export function useBoardData(boardId: string) {
    const board = useLiveQuery(() => logDb.boards.get(boardId), [boardId]);


    return {
        board: board ?? null,
        isLoading: board === undefined,
    };
}