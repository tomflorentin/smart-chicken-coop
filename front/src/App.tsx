import { useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import useDashboardData from "./hooks/useDashboardData";
import Actions from "./Actions";
import Tasks from "./Tasks";
import Logs from "./Logs";
import State from "./State";
import './App.css'; // green: Import for external styles

enum TabIndex {
    State = 1,
    Tasks = 2,
    Logs = 3,
}

const App = () => {
    const data = useDashboardData();
    const [activeIndex, setActiveIndex] = useState(TabIndex.State); // green: Gère l'état actif de l'onglet

    return (
        <div style={{width: "100%"}}>
            <h1 style={{textAlign: "center"}}>🥚🐔🐓🥚</h1>
            <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>  {/* green: Passe en mode géré avec activeIndex et onTabChange */}
                <TabPanel header="Etat">
                    <p className="m-0">
                        <State state={data.state as any} />
                        <Actions orderSent={() => {
                            // Refresh every 1s for 60s
                            let count = 0;
                            const interval = setInterval(async() => {
                                console.log("Refreshing data");
                                if (count >= 10) {
                                    console.log("Clearing interval");
                                    clearInterval(interval);
                                }
                                await data.refreshData();
                                count++;
                            }, 1000);
                        }} />
                    </p>
                </TabPanel>
                <TabPanel header="Taches">
                    <Tasks tasks={data.tasks as any} />
                </TabPanel>
                <TabPanel header="Logs">
                    <Logs logs={data.logs as any} />
                </TabPanel>
            </TabView>
        </div>
    );
}

export default App;
