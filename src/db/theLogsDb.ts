import Dexie, { type Table } from 'dexie';
import { z } from 'zod';

export const LogEntrySchema = z.object({
    id: z.uuid().default(() => crypto.randomUUID()),
    content: z.string(),
    createdAt: z.iso.datetime().default(() => new Date().toISOString()),
    updatedAt: z.iso.datetime().default(() => new Date().toISOString()),
    ticketId: z.optional(z.string()),
});

export const TicketSchema = z.object({
    id: z.uuid().default(() => crypto.randomUUID()),
    title: z.string(),
    description: z.string().default(''),
    tags: z.array(z.string()).default([]),
    createdAt: z.iso.datetime().default(() => new Date().toISOString()),
    updatedAt: z.iso.datetime().default(() => new Date().toISOString()),
});

export const ColumnSchema = z.object({
    id: z.uuid().default(() => crypto.randomUUID()),
    name: z.string(),
    createdAt: z.iso.datetime().default(() => new Date().toISOString()),
    updatedAt: z.iso.datetime().default(() => new Date().toISOString()),
});

export type Column = z.infer<typeof ColumnSchema>;
export type CreateColumn = z.input<typeof ColumnSchema>;

export const ColumnTicketSchema = z.object({
    id: z.uuid().default(() => crypto.randomUUID()),
    columnId: z.string(),
    ticketId: z.string(),
    position: z.number(),
    assignedAt: z.iso.datetime().default(() => new Date().toISOString()),
});

export const BoardSchema = z.object({
    id: z.uuid().default(() => crypto.randomUUID()),
    name: z.string(),
    columnIds: z.array(z.string()).default([]),
    position: z.number().default(0),
    startDate: z.iso.datetime().default(() => new Date().toISOString()),
    endDate: z.optional(z.iso.datetime()),
    createdAt: z.iso.datetime().default(() => new Date().toISOString()),
    updatedAt: z.iso.datetime().default(() => new Date().toISOString()),
});

export type Board = z.infer<typeof BoardSchema>;
export type CreateBoard = z.input<typeof BoardSchema>;
export type BoardState = Omit<Board, 'id' | 'createdAt' | 'updatedAt'>;

export type ColumnTicket = z.infer<typeof ColumnTicketSchema>;
export type CreateColumnTicket = z.input<typeof ColumnTicketSchema>;

export type Ticket = z.infer<typeof TicketSchema>;
export type CreateTicket = z.input<typeof TicketSchema>;

export type LogEntry = z.infer<typeof LogEntrySchema>;
export type CreateLogEntry = z.input<typeof LogEntrySchema>;

export class LogDatabase extends Dexie {
    logEntries!: Table<LogEntry, string>;
    boards!: Table<Board, string>;
    columns!: Table<Column, string>;
    columnTickets!: Table<ColumnTicket, string>;
    tickets!: Table<Ticket, string>;

    constructor() {
        super('LogDatabase');
        this.version(1).stores({
            logEntries: 'id, createdAt, updatedAt, ticketId',
            boards: 'id, name, position, startDate, endDate, createdAt, updatedAt',
            tickets: 'id, title, createdAt, updatedAt',
            columns: 'id, name, createdAt, updatedAt',
            columnTickets: 'id, columnId, ticketId, position, assignedAt',
        });
    }
}

export const logDb = new LogDatabase();

const DEFAULT_COLUMN_NAMES = ['TODO', 'In Progress', 'Done'];

logDb.on('ready', async () => {
    const count = await logDb.boards.count();
    if (count === 0) {
        const columnIds = await Promise.all(
            DEFAULT_COLUMN_NAMES.map(async (name) => {
                const column = ColumnSchema.parse({ name });
                await logDb.columns.add(column);
                return column.id;
            })
        );
        const defaultBoard = BoardSchema.parse({
            name: 'Backlog',
            columnIds,
            position: 0,
        });
        await logDb.boards.add(defaultBoard);
    }
})