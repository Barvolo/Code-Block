import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const useSocket = (room) => {
    const socket = useRef(null);
    const [code, setCode] = useState('');
    const [role, setRole] = useState(null);
    const [allCodes, setAllCodes] = useState({});

    useEffect(() => {
        // Initialize socket connection
        //fetch(`${process.env.REACT_APP_API_URL}/code_blocks`)
        if (!socket.current) {
            socket.current = io('`${process.env.REACT_APP_API_URL}', {
                withCredentials: true  // Ensure cookies are sent with the connection
            });

            // Assign or retrieve a unique user ID from localStorage
            let userId = localStorage.getItem('userId');
            if (!userId) {
                userId = `user_${Date.now()}`;
                localStorage.setItem('userId', userId);
            }

            // Join the room with user ID
            socket.current.emit('join', { room, user_id: userId });
            console.log('Socket connected at room:', room);

            // Listen for role assignment and initial code setup
            socket.current.on('role_assigned', (data) => {
                console.log('Role assigned:', data);
                setRole(data.role);  // Set the user role received from the server
                setCode(data.code);  // Update code from initial payload
            });

            // Listen for updates on all codes for mentor
            socket.current.on('all_codes', (data) => {
                console.log('All student codes:', data);
                setAllCodes(data);  // Update all student codes for the mentor
            });

            // Listen for updates to code specific to this user or others
            socket.current.on('code_updated', (data) => {
                console.log('Code updated:', data);
                if (data.user_id === localStorage.getItem('userId')) {
                    setCode(data.code);  // Update the code for the current student
                } else {
                    // Update other students' codes for the mentor
                    setAllCodes(prev => ({ ...prev, [data.student_name]: data.code }));
                }
            });
        }

        // Cleanup function to handle component unmounting
        return () => {
            socket.current.emit('leave', { room, user_id: localStorage.getItem('userId') });
            socket.current.disconnect();
        };
    }, [room]);

    // Function to emit code updates
    const sendCode = (updatedCode) => {
        if (role === 'Student') {
            socket.current.emit('update_code', { room, user_id: localStorage.getItem('userId'), code: updatedCode });
        }
    };

    return { code, sendCode, role, allCodes };
};

export default useSocket;
