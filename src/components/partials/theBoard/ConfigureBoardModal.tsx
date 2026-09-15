import { Modal, DateInput, Button } from "@joisse1101/ui-library";
import { useState } from "react";
import type { Board, BoardState } from "../../../db/theLogsDb";
import { useBoards } from "@/hooks/useBoards";

const DEFAULT_COLUMNS = ['TODO', 'In Progress', 'Done'];

function toDateInputValue(isoDatetime?: string): string {
    return isoDatetime ? isoDatetime.slice(0, 10) : '';
}

function toIsoDatetime(dateInputValue: string): string {
    return `${dateInputValue}T00:00:00.000Z`;
}

interface ConfigureBoardModalProps {
    isOpen: boolean;
    onClose: () => void;
    board?: Board;
    onSaved?: (board: Board) => void;
}
export const ConfigureBoardModal: React.FC<ConfigureBoardModalProps> = ({
    isOpen,
    onClose,
    board,
    onSaved,
}) => {
    const [boardName, setBoardName] = useState<string>(board?.name ?? '');
    const [columns, setColumns] = useState<string[]>(board?.columns ?? DEFAULT_COLUMNS);
    const [startDate, setStartDate] = useState<string>(toDateInputValue(board?.startDate));
    const [endDate, setEndDate] = useState<string>(toDateInputValue(board?.endDate));
    const [errors, setErrors] = useState<string[]>([]);

    const { addBoard, updateBoard } = useBoards();

    const updateColumn = (index: number, value: string) => {
        setColumns((prev) => prev.map((c, i) => (i === index ? value : c)));
    };
    const addColumn = () => setColumns((prev) => [...prev, '']);
    const removeColumn = (index: number) => setColumns((prev) => prev.filter((_, i) => i !== index));

    const handleValidateAndSubmit = async () => {
        const newErrors: string[] = [];
        if (!boardName) newErrors.push('Board name is required.');
        if (newErrors.length > 0) {
            setErrors(newErrors);
            return;
        }
        const trimmedColumns = columns.map((c) => c.trim()).filter(Boolean);
        const updates: Partial<BoardState> = {
            name: boardName,
            columns: trimmedColumns.length > 0 ? trimmedColumns : DEFAULT_COLUMNS,
            ...(startDate ? { startDate: toIsoDatetime(startDate) } : {}),
            ...(endDate ? { endDate: toIsoDatetime(endDate) } : {}),
        };
        const savedBoard = board
            ? await updateBoard(board.id, updates)
            : await addBoard(updates);
        if (savedBoard) {
            onSaved?.(savedBoard);
        }
        onClose();
    };
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${board ? 'Configure' : 'Create'} Board`}
            onSubmit={handleValidateAndSubmit}

        >
            <div className='form-container'>
                <div className="form-group">
                    <label htmlFor="board-name">Board Name:</label>
                    <input type="text" id="board-name" name="board-name" placeholder="Board Name" value={boardName} onChange={(e) => setBoardName(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Columns:</label>
                    <div className="column-list">
                        {columns.map((column, index) => (
                            <div className="column-list-item" key={index}>
                                <input
                                    type="text"
                                    aria-label={`Column ${index + 1}`}
                                    placeholder={`Column ${index + 1}`}
                                    value={column}
                                    onChange={(e) => updateColumn(index, e.target.value)}
                                />
                                <Button type="button" onClick={() => removeColumn(index)} variant="danger" icon={true}>✕</Button>
                            </div>
                        ))}
                        <Button type="button" onClick={addColumn} variant="secondary">+ Add Column</Button>
                    </div>
                </div>
                <div className='form-row'>
                    <DateInput label="Start Date:" id="start-date" name="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    <DateInput label="End Date:" id="end-date" name="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                {errors.length > 0 &&
                    <div className='error-messages'>
                        {errors.map((error, index) => (
                            <div key={index} className="error-message">{error}</div>
                        ))}
                    </div>
                }
            </div>
        </Modal>
    )
}