import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { debounce } from 'lodash';

const useSocket = (room) => {
    const socket = useRef(null);
    const [code, setCode] = useState('');
    const [role, setRole] = useState(null);
    const [allCodes, setAllCodes] = useState({});

    useEffect(() => {
        if (!socket.current) {
            socket.current = io(`${process.env.REACT_APP_API_URL}`, {
                withCredentials: true
            });

            let userId = localStorage.getItem('userId');
            if (!userId) {
                userId = `user_${Date.now()}`;
                localStorage.setItem('userId', userId);
            }

            socket.current.emit('join', { room, user_id: userId });
            console.log('Socket connected at room:', room);

            socket.current.on('role_assigned', (data) => {
                console.log('Role assigned:', data);
                setRole(data.role);
                setCode(data.code);
            });

            socket.current.on('all_codes', (data) => {
                console.log('All student codes:', data);
                setAllCodes(data);
            });

            socket.current.on('code_updated', (data) => {
                console.log('Code updated:', data);
                if (data.user_id === localStorage.getItem('userId')) {
                    setCode((prevCode) => (prevCode !== data.code ? data.code : prevCode));
                } else {
                    setAllCodes((prev) => ({ ...prev, [data.student_name]: data.code }));
                }
            });
        }

        return () => {
            socket.current.emit('leave', { room, user_id: localStorage.getItem('userId') });
            socket.current.disconnect();
        };
    }, [room]);

    const sendCode = useCallback(debounce((updatedCode) => {
        if (role === 'Student') {
            const message = new TextEncoder().encode(updatedCode);
            const sizeBuffer = new ArrayBuffer(2);
            const sizeView = new DataView(sizeBuffer);
            sizeView.setUint16(0, message.length, false); // Big Endian

            const packet = new Uint8Array(sizeBuffer.byteLength + message.byteLength);
            packet.set(new Uint8Array(sizeBuffer), 0);
            packet.set(message, sizeBuffer.byteLength);

            socket.current.emit('update_code', { room, user_id: localStorage.getItem('userId'), packet: packet.buffer });
        }
    }, 300), [role, room]);

    return { code, sendCode, role, allCodes };
};

export default useSocket;
