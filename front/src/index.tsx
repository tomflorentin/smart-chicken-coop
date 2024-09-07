import React from 'react';
import ReactDOM from 'react-dom/client';
import { PrimeReactProvider } from "primereact/api";
import App from "./App";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import 'primeicons/primeicons.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <PrimeReactProvider>
        <App/>
    </PrimeReactProvider>
);
