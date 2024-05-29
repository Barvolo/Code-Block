import React, { useEffect, useState } from 'react';

function Lobby() {
    const [codeBlocks, setCodeBlocks] = useState([]);

    useEffect(() => {
        console.log('Lobby component mounted');
        fetch('http://localhost:5001/code_blocks')
            .then(response => response.json())
            .then(data => {
                console.log('Fetched code blocks:', data);
                setCodeBlocks(data);
            })
            .catch(error => console.error('Error fetching code blocks:', error));
    }, []);

    const handleClick = (blockId) => {
        console.log(`Code block ${blockId} clicked`);
        window.location.href = `/code-editor/${blockId}`;
    };

    return (
        <div>
            <h1>Choose a Code Block</h1>
            <ul>
                {codeBlocks.map(block => (
                    <li key={block.id} onClick={() => handleClick(block.id)}>
                        {block.title}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Lobby;
