// src/components/Actions.tsx
import React from 'react';
import { Panel } from "primereact/panel";
import { Button } from "primereact/button";
import { getAuthentication } from "./password";
import { apiURL } from "./hooks/useDashboardData";

interface ActionProps {
    orderSent: () => void;
}

const Actions: React.FC<ActionProps> = ({ orderSent }) => {
    const actions = [
        { name: 'Ouvrir la porte', endpoint: 'door/open', icon: "pi-lock-open" },
        { name: 'Fermeture sécurisée', endpoint: 'door/safe-close', icon: "pi-lock" },
        { name: 'Fermeture forcée', endpoint: 'door/force-close', icon: "pi-lock" },
        { name: 'Activer la clôture', endpoint: 'fence/enable', icon: "pi-bolt" },
        { name: 'Désactiver la clôture', endpoint: 'fence/disable', icon: "pi-bolt" },
        { name: 'Activer l\'alerte', endpoint: 'alert/enable', icon: "pi-bell" },
        { name: 'Désactiver l\'alerte', endpoint: 'alert/disable', icon: "pi-bell" },
    ];

    const handleAction = async (endpoint: string) => {
        try {
            await fetch(`${apiURL}/${endpoint}`, { method: 'POST', headers: {Authorization: getAuthentication()} });
            orderSent();
        } catch (error) {
            console.error('Erreur lors de l\'exécution de l\'action:', error);
        }
    };

    return (
        <Panel header={"Actions"}>
                {actions.map((action) => (
                    <Button
                        key={action.endpoint}
                        onClick={() => handleAction(action.endpoint)}
                        className="w-full justify-start"
                        style={{ marginBottom: '4px' }}
                    >
                        <i className={`mr-2 pi ${action.icon}`}></i>
                        {action.name}
                    </Button>
                ))}
        </Panel>
    );
};

export default Actions;
