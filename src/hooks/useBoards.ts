// hooks/useBoards.ts
import { useLiveQuery } from 'dexie-react-hooks';
import {
    logDb,
    BoardSchema,
    ColumnSchema,
    type Ticket,
    type Board,
    type BoardState,
} from '@/db/theLogsDb';
import { toast } from 'sonner';
import type { Option } from '@/types/general';

const DEFAULT_COLUMN_NAMES = ['TODO', 'In Progress', 'Done'];
const DEFAULT_COLUMN_OPTIONS: Option[] = DEFAULT_COLUMN_NAMES.map((label) => ({ value: '', label }));

// A blank `value` means "new column"; everything else matches an existing column by id,
// so renames/reorders keep tickets attached to the right column instead of matching by position.
async function syncColumns(existingColumnIds: string[], columnOptions: Option[]): Promise<string[]> {
    const columnIds: string[] = [];
    const keptIds = new Set<string>();

    for (const { value, label } of columnOptions) {
        if (value) {
            await logDb.columns.update(value, { name: label, updatedAt: new Date().toISOString() });
            columnIds.push(value);
            keptIds.add(value);
        } else {
            const column = ColumnSchema.parse({ name: label });
            await logDb.columns.add(column);
            columnIds.push(column.id);
            keptIds.add(column.id);
        }
    }

    for (const id of existingColumnIds) {
        if (!keptIds.has(id)) {
            await logDb.columnTickets.where('columnId').equals(id).delete();
            await logDb.columns.delete(id);
        }
    }

    return columnIds;
}

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
        await logDb.columnTickets.where('ticketId').equals(ticketId).delete();
        await logDb.tickets.delete(ticketId);
    };

    return {
        ticket: ticket ?? null,
        isLoading: ticket === undefined,
        updateTicket,
        deleteTicket,
    };
}

export function useBoards() {
    const boards = useLiveQuery(() => logDb.boards.orderBy('position').toArray());

    const addBoard = async (newBoard: Partial<Omit<BoardState, 'columnIds'>>, columns: Option[] = DEFAULT_COLUMN_OPTIONS) => {
        let customName = newBoard.name ?? 'New Board';
        if (await logDb.boards.where('name').equals(customName).first() !== undefined) {
            customName += `-${crypto.randomUUID().slice(0, 4)}`;
        };
        const count = await logDb.boards.count();
        const columnIds = await syncColumns([], columns);

        const boardToAdd: Board = BoardSchema.parse({
            name: customName,
            columnIds,
            position: count,
            startDate: newBoard.startDate,
            endDate: newBoard.endDate,
        });

        await logDb.boards.add(boardToAdd);
        return boardToAdd;
    };

    const updateBoard = async (boardId: string, updates: Partial<Omit<BoardState, 'columnIds'>>, columns?: Option[]) => {
        const board = await logDb.boards.get(boardId);
        if (!board) return null;
        const columnIds = columns ? await syncColumns(board.columnIds ?? [], columns) : board.columnIds;
        const updatedBoard = { ...board, ...updates, columnIds };
        await logDb.boards.put(updatedBoard);
        return updatedBoard;
    };

    const removeBoard = async (boardId: string) => {
        const boardCount = await logDb.boards.count()
        if (boardCount === 1) {
            toast.error('Last board cannot be deleted');
            return;
        }
        const board = await logDb.boards.get(boardId);
        if (!board) return;
        for (const columnId of board.columnIds ?? []) {
            await logDb.columnTickets.where('columnId').equals(columnId).delete();
            await logDb.columns.delete(columnId);
        }
        await logDb.boards.delete(boardId);
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
    const columnOptions = useLiveQuery(
        async (): Promise<Option[]> => {
            if (!board) return [];
            const columns = await logDb.columns.bulkGet(board.columnIds ?? []);
            return columns.flatMap((c) => (c ? [{ value: c.id, label: c.name }] : []));
        },
        [board],
        [] as Option[]
    );

    return {
        board: board ?? null, columnOptions,
        isLoading: board === undefined,
    };
}
