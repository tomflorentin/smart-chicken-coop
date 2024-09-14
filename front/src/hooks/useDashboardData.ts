// src/hooks/useDashboardData.ts
import { useState, useEffect } from 'react';
import { getAuthentication } from "../password";

interface State {
    // Définissez ici la structure de votre état
}

interface Task {
    name: string;
    timeStarted: string;
}

interface Log {
    message: string;
    date: string;
}

//export const apiURL = 'http://tomf.myasustor.com/chicken-api';
export const apiURL = 'http://localhost:3001'

const useDashboardData = () => {
    const [state, setState] = useState<State>({});
    const [tasks, setTasks] = useState<Task[]>([]);
    const [logs, setLogs] = useState<Log[]>([]);

    const fetchData = async () => {
        try {
            const password = getAuthentication();
            const stateResponse = await fetch(apiURL + '/state', {headers: {Authorization:  password}});
            if (stateResponse.status === 403 || stateResponse.status === 401) {
                alert("Mot de passe incorrect");
                localStorage.removeItem('password');
                window.location.reload();
                return;
            }
            const stateData: State = await stateResponse.json();
            setState(stateData);

            const tasksResponse = await fetch(apiURL+'/tasks', {headers: {Authorization:  password}});
            const tasksData: Task[] = await tasksResponse.json();
            setTasks(tasksData);

            const logsResponse = await fetch(apiURL+'/logs', {headers: {Authorization:  password}});
            const logsData: Log[] = await logsResponse.json();
            setLogs(logsData);
        } catch (error) {
            console.error('Erreur lors de la récupération des données:', error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, []);

    return { state, tasks, logs, refreshData: fetchData };
};

export default useDashboardData;
