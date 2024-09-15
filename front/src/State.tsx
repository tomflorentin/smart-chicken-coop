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

export interface Detections {
    dates: Date[];
    timeInAlert: number;
    lastDetection: Date;
}

export interface StateType {
    enclos: {
        bootTime: Date;
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
            detections: Detections;
        };
    };
    poulailler: {
        bootTime: Date;
        lastSeen: Date;
        door: {
            lastOrder: DoorOrder;
            lastOrderDate: Date;
            status: DoorStatus;
        };
    };
}


const ChickenCoop: React.FC<{ state: StateType | null }> = ({ state }) => {
    const isDoorMoving = (status: DoorStatus | null) => {
        return status?.startsWith('opening') ||
            status?.startsWith('force_closing') ||
            status?.startsWith('safe_closing');
    };

    const getDoorBadge = (status: DoorStatus | null) => {
        if (!status) return <Badge value="?" severity="warning" />;
        switch (true) {
            case status.startsWith('opened'):
                return <Badge value="Ouverte" severity="success" />;
            case status.startsWith('closed'):
                return <Badge value="Fermée" severity="danger" />;
            case status.startsWith('opening'):
                return <Badge value="Ouverture" severity="info" />;
            case status.startsWith('safe_closing'):
                return <Badge value="Fermeture avec laser" severity="info" />;
            case status.startsWith('force_closing'):
                return <Badge value="Fermeture forcée" severity="info" />;
            case status.startsWith("blocked"):
                return <Badge value={"Bloquée"} severity={"danger"}/>
            default:
                return <Badge value="Inconnu" severity="warning" />;
        }
    };

    const getAlertBadge = (status: AlertStatus | null, detections: Detections) => {
        const detectionsStr = detections.dates?.length ? `${detections.dates.length} detections` : "";
        const totalDetectionTime = detections.timeInAlert ? `lampe ON ${detections.timeInAlert}min` : "";
        const additionalStr = `${detectionsStr} ${totalDetectionTime}`;
        const getAdditionalBadge = (text: string) => (text.length > 1) && <Badge value={text} severity="info" />;

        if (!status) return <Badge value="?" severity="warning" />;

        let badgeValue = '';
        let severity: "success" | "warning" | "danger" = "warning";

        if (status.startsWith('enabled')) {
            badgeValue = "Actif";
            severity = "success";
        } else if (status.startsWith('alert')) {
            badgeValue = "Alerte!";
            severity = "warning";
        } else if (status.startsWith('disabled')) {
            badgeValue = "Désactivé";
            severity = "danger";
        } else {
            badgeValue = "Inconnu";
        }

        return (
            <div>
                <Badge value={badgeValue} severity={severity} />
                {getAdditionalBadge(additionalStr)}
            </div>
        );
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

    const getConnectionStatus = (lastSeen: Date | null, bootTime: Date | null) => {
        if (!lastSeen) return { status: 'Hors ligne', severity: 'danger', duration: null };
        const now = new Date();
        const diffInMs = now.getTime() - new Date(lastSeen).getTime();
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const hours = Math.floor(diffInMinutes / 60);
        const minutes = diffInMinutes % 60;
        const duration = `${hours}h ${minutes}m`;

        if (diffInMinutes > 2) {
            return { status: 'Hors ligne', severity: 'danger', duration: `depuis ${duration}` };
        } else {
            const onlineDuration = bootTime ? formatBootTime(bootTime) : 'Inconnu';
            return { status: 'En ligne', severity: 'success', duration: `depuis ${onlineDuration}` };
        }
    };

    const formatLastSeen = (date: Date | null) => {
        return date ? new Date(date).toLocaleTimeString() : 'Inconnu';
    };

    const formatBootTime = (bootTime: Date) => {
        const now = new Date();
        const diffInMs = now.getTime() - new Date(bootTime).getTime();
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const hours = Math.floor(diffInMinutes / 60);
        const minutes = diffInMinutes % 60;
        return `${hours}h ${minutes}m`;
    };

    if (!state?.enclos || !state?.poulailler) {
        return <p>"Chargement..."</p>;
    }

    const doorConnection = getConnectionStatus(state.poulailler.lastSeen, state.poulailler.bootTime);
    const fenceConnection = getConnectionStatus(state.enclos.lastSeen, state.enclos.bootTime);

    return (
        <div className="p-d-flex p-flex-column p-jc-center p-ai-center" style={{ padding: '1rem', overflowX: 'hidden', width: '100%' }}>
            {/* Section Poulailler */}
            <Card header="Poulailler" className="p-mb-3" style={{marginBottom: 16}}>
                <p>
                    <i className={`pi ${doorConnection.severity === 'danger' ? 'pi-times-circle' : 'pi-check-circle'} p-mr-2`} style={{ color: doorConnection.severity === 'danger' ? 'red' : 'green' }} />
                    {doorConnection.status} {doorConnection.duration}
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
            <Card header="Enclos" className="p-mb-3">
                <div>
                    <i className={`pi ${fenceConnection.severity === 'danger' ? 'pi-times-circle' : 'pi-check-circle'} p-mr-2`} style={{ color: fenceConnection.severity === 'danger' ? 'red' : 'green' }} />
                    {fenceConnection.status} {fenceConnection.duration}
                </div>
                <div>
                    <i className="pi pi-bolt p-mr-2" />
                    Clôture électrique: {getFenceBadge(state.enclos.electricFence.status)}
                </div>
                <Tooltip target=".fence-icon" content={`Dernière connexion : ${formatLastSeen(state.enclos.lastSeen)}`} />

                <div>
                    <i className="pi pi-exclamation-circle p-mr-2" />
                    Système d'alerte: {getAlertBadge(state.enclos.alertSystem.status, state.enclos.alertSystem.detections)}
                </div>
            </Card>
        </div>
    );
};

export default ChickenCoop;
