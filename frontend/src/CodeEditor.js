import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Button, Box, Paper } from '@mui/material';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { debounce } from 'lodash';
import useSocket from './hooks/useSocket';
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
  const { code: initialCode, sendCode, role, allCodes } = useSocket(id);
  const [code, setCode] = useState(initialCode);
  const [isEditable, setIsEditable] = useState(false);
  const [output, setOutput] = useState('');
  const [testResult, setTestResult] = useState('');
  const [showSmiley, setShowSmiley] = useState(false);

  useEffect(() => {
    setCode(initialCode);
    setIsEditable(role === 'Student');
  }, [initialCode, role]);

  const handleCodeChange = useCallback(debounce((value) => {
    if (isEditable) {
      setCode(value);
      sendCode(value);
    }
  }, 300), [isEditable, sendCode]);

  const editorOptions = useMemo(() => ({
    extensions: [javascript()],
    theme: oneDark,
    lineNumbers: true,
    lineWrapping: true,
    readOnly: !isEditable  // Use isEditable state to control read-only mode
  }), [isEditable]);

  const runCode = () => {
    try {
      let logs = [];
      const log = console.log;
      console.log = (...args) => {
        logs.push(args.join(' '));
      };

      // eslint-disable-next-line no-new-func
      new Function(code)();

      console.log = log;
      setOutput(logs.join('\n'));
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  const runTests = () => {
    const tests = testCases[id];
    const wrappedCode = code;

    const testResults = tests.map((test, index) => {
      try {
        // eslint-disable-next-line no-new-func
        const func = new Function(`${wrappedCode}; return ${test.input};`);
        const result = func();

        const isPassed = JSON.stringify(result) === JSON.stringify(test.expected);
        return isPassed ? `Test ${index + 1} passed` : `Test ${index + 1} failed: expected ${JSON.stringify(test.expected)} but got ${JSON.stringify(result)}`;
      } catch (error) {
        return `Test ${index + 1} failed with error: ${error.message}`;
      }
    });

    setTestResult(testResults.join('\n'));
    // Check if all tests passed
    if (testResults.every((result) => result.includes('passed'))) {
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
                extensions={[javascript()]}
                theme={oneDark}
                readOnly={true}
                options={{ lineNumbers: true, lineWrapping: true, readOnly: true }}  // Ensure read-only for mentors
                onChange={() => {}}
              />
            </Box>
          ))
        ) : (
          <Box>
            <CodeMirror
              value={code}
              extensions={[javascript()]}
              theme={oneDark}
              options={editorOptions}
              onChange={(value) => handleCodeChange(value)}
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
                <span role="img" aria-label="smiley" className="smiley">😊</span>
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
