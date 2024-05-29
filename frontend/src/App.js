import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Lobby from './Lobby';
import CodeEditor from './CodeEditor';

function App() {
    const location = useLocation();
    console.log('App rendered. Current route:', location.pathname);

    return (
        <Routes>
            <Route path="/" element={<Lobby />} />
            <Route path="/code-editor/:id" element={<CodeEditor />} />
        </Routes>
    );
}

export default function AppWrapper() {
    return (
        <Router>
            <App />
        </Router>
    );
}
