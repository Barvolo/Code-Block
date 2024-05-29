import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import useSocket from './hooks/useSocket';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import 'highlight.js/styles/default.css';

hljs.registerLanguage('javascript', javascript);

function CodeEditor() {
    const { id } = useParams();
    const { code, sendCode, role, allCodes } = useSocket(id);
    const [isEditable, setIsEditable] = useState(false);
    const [userCode, setUserCode] = useState('');
    const codeRef = useRef(null);
    const mentorRefs = useRef({});

    const applyHighlight = useCallback(() => {
        requestAnimationFrame(() => {
            if (codeRef.current) {
                hljs.highlightElement(codeRef.current);
            }
            Object.entries(mentorRefs.current).forEach(([studentName, element]) => {
                hljs.highlightElement(element);
            });
        });
    }, []);

    useEffect(() => {
        setIsEditable(role === 'Student');
    }, [role]);

    useEffect(() => {
        setUserCode(code);
    }, [code]);

    useEffect(() => {
        applyHighlight();
    }, [code, allCodes, applyHighlight]);

    const handleCodeChange = (e) => {
        if (isEditable) {
            const newCode = e.target.value;
            setUserCode(newCode);
            sendCode(newCode);
        }
    };

    return (
        <div>
            <h1>Code Editor - {role || 'Loading...'}</h1>
            {role === 'Mentor' ? (
                Object.entries(allCodes).map(([studentName, studentCode], index) => (
                    <div key={studentName}>
                        <h2>{studentName} Code:</h2>
                        <pre>
                            <code ref={el => mentorRefs.current[studentName] = el} className="javascript" dangerouslySetInnerHTML={{ __html: hljs.highlight('javascript', studentCode).value }} />
                        </pre>
                    </div>
                ))
            ) : (
                <div>
                    <textarea
                        value={userCode}
                        onChange={handleCodeChange}
                        style={{ width: '100%', minHeight: '200px' }}
                        disabled={!isEditable}
                    />
                    <pre>
                        <code ref={codeRef} className="javascript" dangerouslySetInnerHTML={{ __html: hljs.highlight('javascript', userCode).value }} />
                    </pre>
                </div>
            )}
        </div>
    );
}

export default CodeEditor;
