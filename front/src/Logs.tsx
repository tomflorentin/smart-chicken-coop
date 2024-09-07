import React from 'react';

export interface Log {
    date: Date;
    topic: string;
    message: string;
    direction: 'in' | 'out';
}

interface LogListProps {
    logs: Log[];
}

const LogListMobile: React.FC<LogListProps> = ({ logs }) => {
    // Fonction pour formater la date en affichant uniquement l'heure
    const formatTime = (date: Date) => {
        return new Date(date).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Fonction pour formater la date du jour
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    // Grouper les logs par jour
    const groupLogsByDate = (logs: Log[]) => {
        return logs.reduce((acc: Record<string, Log[]>, log: Log) => {
            const date = formatDate(log.date);
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(log);
            return acc;
        }, {});
    };

    // Récupérer les logs groupés
    const groupedLogs = groupLogsByDate(logs);

    return (
        <div className="log-list-mobile">
            {Object.keys(groupedLogs).map((date, index) => (
                <div key={index} className="log-day-section">
                    <h3 className="log-day-header">{date}</h3>
                    {groupedLogs[date].map((log, logIndex) => (
                        <div key={logIndex} className="log-item">
                            <div className="log-header">
                                <span className="log-time">{formatTime(log.date)}</span>
                                <span className="log-direction">
                  {log.direction === 'in' ? '⬇️' : '⬆️'}
                </span>
                            </div>
                            <div className="log-content">
                                <strong>{log.topic}:</strong> {log.message}
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default LogListMobile;
