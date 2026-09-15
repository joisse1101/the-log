import { useBoardData, useBoards } from '@/hooks/useBoards';
import { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button, InlineSelect } from '@joisse1101/ui-library';
import { ConfigureBoardModal } from '@/components/partials/theBoard/ConfigureBoardModal';
import { getDisplayDate, isValidDateString } from '@/utils/dates';
import { Column } from '@/components/partials/theBoard/Column';

export default function TheBoard() {
    const { boards, removeBoard } = useBoards();
    const [userSelectedBoardId, setUserSelectedBoardId] = useState(boards?.[0]?.id ?? '');
    const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false);
    const [isAddBoardModalOpen, setIsAddBoardModalOpen] = useState(false);

    const boardOptions = (boards?.map(b => ({ value: b.id, label: b.name })) ?? []);
    const selectedBoardId = userSelectedBoardId && boardOptions.some(b => b.value === userSelectedBoardId) ? userSelectedBoardId : boards?.[0]?.id || '';
    const { board, columnOptions } = useBoardData(selectedBoardId);

    useEffect(() => {
        if (userSelectedBoardId === 'add') {
            setIsAddBoardModalOpen(true);
        }
    }, [userSelectedBoardId]);

    return (
        <div className="board-wrapper">
            {board && <>
                <div className="board-meta">
                    <div className="board-meta-name">
                        <h3>{board?.name}</h3>
                        <div>
                            {isValidDateString(board.startDate) && (
                                <span className="date">
                                    {getDisplayDate(new Date(board.startDate))}
                                    {isValidDateString(board.endDate) ? ` - ${getDisplayDate(new Date(board.endDate!))}` : ''}
                                </span>
                            )}
                            <Button
                                onClick={() => setIsConfigureModalOpen(true)}
                                variant="secondary"
                                icon={true}
                            >
                                🛠
                            </Button>
                            {boards.length > 1 && (
                                <Button
                                    onClick={() => removeBoard(board.id)}
                                    variant="danger"
                                    icon={true}
                                >
                                    ✕
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="board-meta-select">

                        <InlineSelect
                            label="Project Board:"
                            options={[...boardOptions, { value: 'add', label: '+ Add New Board' }]}
                            value={selectedBoardId}
                            onChange={(value) => setUserSelectedBoardId(value)}
                        />
                    </div>
                </div>
                <DndProvider backend={HTML5Backend}>
                    <div className="column-container">
                        {board.columnIds.map((id) => (
                            <Column
                                key={id}
                                columnId={id}
                            />
                        ))}
                    </div>
                </DndProvider>
            </>
            }
            <ConfigureBoardModal
                key={isAddBoardModalOpen ? 'add' : (board?.id ?? 'configure')}
                isOpen={isConfigureModalOpen || isAddBoardModalOpen}
                onClose={() => {
                    setIsConfigureModalOpen(false);
                    setIsAddBoardModalOpen(false);
                }}
                board={(isAddBoardModalOpen || !board) ? undefined : board}
                columnOptions={(isAddBoardModalOpen || !board) ? undefined : columnOptions}
                onSaved={(savedBoard) => setUserSelectedBoardId(savedBoard.id)}
            />
        </div   >
    );
}