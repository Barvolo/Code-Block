import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useSocket from './hooks/useSocket';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { Container, Typography, Button, Box, Paper } from '@mui/material';
import './CodeEditor.css';

const testCases = {
    '1': [
        { input: 'mergeArray([1, 2], [3, 4])', expected: [1, 2, 3, 4] },
        { input: 'mergeArray([], [1])', expected: [1] }
    ],
    '2': [
        { input: 'findMax([1, 2, 3])', expected: 3 },
        { input: 'findMax([-1, -2, -3])', expected: -1 }
    ],
    '3': [
        { input: 'palindrome("racecar")', expected: true },
        { input: 'palindrome("hello")', expected: false }
    ],
    '4': [
        { input: 'addToNum(1, 2)', expected: 3 },
        { input: 'addToNum(-1, -2)', expected: -3 }
    ]
};

function CodeEditor() {
    const { id } = useParams();
    const { code, sendCode, role, allCodes } = useSocket(id);
    const [isEditable, setIsEditable] = useState(false);
    const [userCode, setUserCode] = useState('');
    const [output, setOutput] = useState('');
    const [testResult, setTestResult] = useState('');
    const [showSmiley, setShowSmiley] = useState(false);

    useEffect(() => {
        setIsEditable(role === 'Student');
    }, [role]);

    useEffect(() => {
        setUserCode(code);
    }, [code]);

    const handleCodeChange = (value) => {
        if (isEditable) {
            setUserCode(value);
            sendCode(value);
        }
    };

    const runCode = () => {
        try {
            let logs = [];
            const log = console.log;
            console.log = (...args) => {
                logs.push(args.join(' '));
            };

            eval(userCode);

            console.log = log;
            setOutput(logs.join('\n'));
        } catch (error) {
            setOutput(`Error: ${error.message}`);
        }
    };

    const runTests = () => {
        const tests = testCases[id];
        const wrappedCode = userCode;

        const testResults = tests.map((test, index) => {
            try {
                const func = new Function(`${wrappedCode}; return ${test.input};`);
                const result = func();
                console.log('wrappedCode:', wrappedCode);
                console.log('test.input:', test.input);
                console.log('func:', func);
                console.log(result);
                console.log(test.expected);
                console.log(JSON.stringify(result));
                console.log(JSON.stringify(test.expected));

                const isPassed = JSON.stringify(result) === JSON.stringify(test.expected);
                return isPassed ? `Test ${index + 1} passed` : `Test ${index + 1} failed: expected ${JSON.stringify(test.expected)} but got ${JSON.stringify(result)}`;
            } catch (error) {
                return `Test ${index + 1} failed with error: ${error.message}`;
            }
        });

        setTestResult(testResults.join('\n'));
        // Check if all tests passed
        if (testResults.every(result => result.includes('passed'))) {
            setShowSmiley(true);
            setTimeout(() => {
                setShowSmiley(false);
            }, 5000); // Hide after 5 seconds
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Code Editor - {role || 'Loading...'}
                </Typography>
                {role === 'Mentor' ? (
                    Object.entries(allCodes).map(([studentName, studentCode], index) => (
                        <Box key={studentName} sx={{ mb: 2 }}>
                            <Typography variant="h6">{studentName} Code:</Typography>
                            <CodeMirror
                                value={studentCode}
                                height="200px"
                                extensions={[javascript()]}
                                theme={vscodeDark}
                                readOnly={true}
                            />
                        </Box>
                    ))
                ) : (
                    <Box>
                        <CodeMirror
                            value={userCode}
                            height="200px"
                            extensions={[javascript()]}
                            theme={vscodeDark}
                            onChange={handleCodeChange}
                            readOnly={!isEditable}
                        />
                        <Box sx={{ mt: 2 }}>
                            <Button onClick={runCode} variant="contained" color="primary" sx={{ mr: 1 }}>
                                Run
                            </Button>
                            <Button onClick={runTests} variant="contained" color="secondary">
                                Run Tests
                            </Button>
                        </Box>
                        <Typography variant="h6" sx={{ mt: 2 }}>Output:</Typography>
                        <pre className="output">{output}</pre>
                        <Typography variant="h6" sx={{ mt: 2 }}>Test Results:</Typography>
                        <pre className="output">{testResult}</pre>
                        {showSmiley && (
                            <div className="congrats">
                                <span className="smiley">😊</span>
                                <Typography variant="h5">You got it!</Typography>
                            </div>
                        )}
                    </Box>
                )}
            </Paper>
        </Container>
    );
}

export default CodeEditor;