import React from 'react';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';

interface Task {
    topic: string;
    order: string;
    intermediateStatus: string[];
    status: string;
    timeStarted: Date;
    timeEnded: Date;
}

interface TaskListProps {
    tasks: Task[];
}

const Tasks: React.FC<TaskListProps> = ({ tasks }) => {
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderStatus = (status: string) => {
        let statusColor = 'info';
        if (status === 'completed') {
            statusColor = 'success';
        } else if (status === 'in-progress') {
            statusColor = 'warning';
        } else if (status === 'failed') {
            statusColor = 'danger';
        }

        return <Tag value={status} severity={statusColor as any} />;
    };

    return (
        <div className="task-list-mobile">
            {tasks.map((task, index) => (
                <Card key={index} className="p-mb-3">
                    <div className="task-header">
                        <h3>{task.topic}</h3>
                        {renderStatus(task.status)}
                    </div>
                    <div className="task-content">
                        <p>
                            <strong>Order:</strong> {task.order}
                        </p>
                        <p>
                            <strong>Time Started:</strong> {formatDate(task.timeStarted)}
                        </p>
                        <p>
                            <strong>Intermediate Status:</strong> {task.intermediateStatus.join(', ')}
                        </p>
                        <p>
                            <strong>Time Ended:</strong> {task.timeEnded ? formatDate(task.timeEnded) : 'In progress'}
                        </p>
                    </div>
                </Card>
            ))}
        </div>
    );
};

export default Tasks;
