import React from 'react';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Badge } from 'primereact/badge';
import { Tooltip } from 'primereact/tooltip';

export enum FenceOrder {
    ENABLE = 'enable',
    DISABLE = 'disable',
    STATUS = 'status',
}

export enum AlertOrder {
    ENABLE = 'alert_enable',
    DISABLE = 'alert_disable',
    STATUS = 'status',
}

export enum DoorOrder {
    SAFE_CLOSE = 'door_safe_close',
    FORCE_CLOSE = 'door_force_close',
    OPEN = 'door_open',
    STATUS = 'status',
}

export enum DoorStatus {
    OPENED = 'opened',
    CLOSED = 'closed',
    OPENING = 'opening',
    FORCE_CLOSING = 'force_closing',
    SAFE_CLOSING = 'safe_closing',
}

export enum FenceStatus {
    ENABLED = 'enabled',
    DISABLED = 'disabled',
}

export enum AlertStatus {
    ENABLED = 'enabled',
    DISABLED = 'disabled',
    ALERT = 'alert',
}

export interface ChickenCoopStateType {
    enclos: {
        lastSeen: Date;
        electricFence: {
            lastOrder: FenceOrder;
            lastOrderDate: Date;
            status: FenceStatus;
        };
        alertSystem: {
            lastDetectionDetector: number;
            lastDetectionDate: Date;
            status: AlertStatus;
            lastOrder: AlertOrder;
            lastOrderDate: Date;
        };
    };
    poulailler: {
        lastSeen: Date;
        door: {
            lastOrder: DoorOrder;
            lastOrderDate: Date;
            status: DoorStatus;
        };
    };
}

const ChickenCoop: React.FC<{ state: ChickenCoopStateType | null }> = ({ state }) => {
    const isDoorMoving = (status: DoorStatus | null) => {
        return status?.startsWith('opening') || status?.startsWith('closing');
    };

    const getDoorBadge = (status: DoorStatus | null) => {
        if (!status) return <Badge value="?" severity="warning" />;
        switch (true) {
            case status.startsWith('opened'):
                return <Badge value="Ouverte" severity="success" />;
            case status.startsWith('closed'):
                return <Badge value="Fermée" severity="info" />;
            case status.startsWith('opening'):
                return <Badge value="Ouverture" severity="info" />;
            case status.startsWith('closing'):
                return <Badge value="Fermeture" severity="info" />;
            default:
                return <Badge value="Inconnu" severity="warning" />;
        }
    };

    const getAlertBadge = (status: AlertStatus | null) => {
        if (!status) return <Badge value="?" severity="warning" />;
        switch (true) {
            case status.startsWith('enabled'):
                return <Badge value="Actif" severity="success" />;
            case status.startsWith('alert'):
                return <Badge value="Alerte!" severity="danger" />;
            case status.startsWith('disabled'):
                return <Badge value="Désactivé" severity="warning" />;
            default:
                return <Badge value="Inconnu" severity="warning" />;
        }
    };

    const getFenceBadge = (status: FenceStatus | null) => {
        if (!status) return <Badge value="?" severity="warning" />;
        switch (true) {
            case status.startsWith('enabled'):
                return <Badge value="Activée" severity="success" />;
            case status.startsWith('disabled'):
                return <Badge value="Désactivée" severity="danger" />;
            default:
                return <Badge value="Inconnu" severity="warning" />;
        }
    };

    const getConnectionStatus = (lastSeen: Date | null) => {
        if (!lastSeen) return { status: 'Hors ligne', severity: 'danger' };
        const now = new Date();
        const diff = (now.getTime() - new Date(lastSeen).getTime()) / 1000 / 60; // in minutes
        return diff > 2 ? { status: 'Hors ligne', severity: 'danger' } : { status: 'En ligne', severity: 'success' };
    };

    const formatLastSeen = (date: Date | null) => {
        return date ? new Date(date).toLocaleTimeString() : 'Inconnu';
    };

    if (!state?.enclos || !state?.poulailler) {
        return <p>"Chargement..."</p>;
    }

    const doorConnection = getConnectionStatus(state.poulailler.lastSeen);
    const fenceConnection = getConnectionStatus(state.enclos.lastSeen);

    return (
        <div className="p-d-flex p-flex-column p-jc-center p-ai-center" style={{ padding: '1rem', overflowX: 'hidden', width: '100%' }}>
            {/* Section Poulailler */}
            <Card title="Poulailler" className="p-mb-3" style={{ width: '100%', maxWidth: '100%' }}>
                <p>
                    <i className={`pi ${doorConnection.severity === 'danger' ? 'pi-times-circle' : 'pi-check-circle'} p-mr-2`} style={{ color: doorConnection.severity === 'danger' ? 'red' : 'green' }} />
                    {doorConnection.status}
                </p>
                <p>
                    <i className="pi pi-door p-mr-2" />
                    Porte: {getDoorBadge(state.poulailler.door.status)}
                </p>
                {isDoorMoving(state.poulailler.door.status) && (
                    <div className="p-d-flex p-ai-center p-mt-2">
                        <ProgressSpinner style={{ width: '2rem', height: '2rem' }} />
                        <span className="p-ml-2">Porte en cours de mouvement...</span>
                    </div>
                )}
                <Tooltip target=".door-icon" content={`Dernière connexion : ${formatLastSeen(state.poulailler.lastSeen)}`} />
            </Card>

            {/* Section Enclos */}
            <Card title="Enclos" className="p-mb-3" style={{ width: '100%', maxWidth: '100%' }}>
                <p>
                    <i className={`pi ${fenceConnection.severity === 'danger' ? 'pi-times-circle' : 'pi-check-circle'} p-mr-2`} style={{ color: fenceConnection.severity === 'danger' ? 'red' : 'green' }} />
                    {fenceConnection.status}
                </p>
                <p>
                    <i className="pi pi-bolt p-mr-2" />
                    Clôture électrique: {getFenceBadge(state.enclos.electricFence.status)}
                </p>
                <Tooltip target=".fence-icon" content={`Dernière connexion : ${formatLastSeen(state.enclos.lastSeen)}`} />

                <p>
                    <i className="pi pi-exclamation-circle p-mr-2" />
                    Système d'alerte: {getAlertBadge(state.enclos.alertSystem.status)}
                </p>
            </Card>
        </div>
    );
};

export default ChickenCoop;
