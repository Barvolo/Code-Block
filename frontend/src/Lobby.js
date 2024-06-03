import React, { useEffect, useState } from 'react';
import { Container, Typography, List, ListItemText, Paper, Box, ListItemButton } from '@mui/material';
import { styled } from '@mui/system';

const StyledContainer = styled(Container)({
    marginTop: '50px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
});

const StyledPaper = styled(Paper)({
    padding: '20px',
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: '600px',
    borderRadius: '8px',
    boxShadow: '0 3px 5px rgba(0,0,0,0.2)',
});

const StyledList = styled(List)({
    width: '100%',
});

const StyledListItemButton = styled(ListItemButton)({
    marginBottom: '10px',
    borderRadius: '4px',
    '&:hover': {
        backgroundColor: '#f0f0f0',
    },
});

function Lobby() {
    const [codeBlocks, setCodeBlocks] = useState([]);
    //https://code-block-3-331h.onrender.com/code_blocks

    useEffect(() => {
        console.log('Lobby component mounted');
        // `${process.env.REACT_APP_API_URL}/code_blocks`
        fetch(`${process.env.REACT_APP_API_URL}/code_blocks`)
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
        <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', padding: '20px' }}>
            <StyledContainer maxWidth="sm">
                <Typography variant="h4" gutterBottom>
                    Choose a Code Block
                </Typography>
                <StyledPaper>
                    <StyledList>
                        {codeBlocks.map(block => (
                            <StyledListItemButton key={block.id} onClick={() => handleClick(block.id)}>
                                <ListItemText primary={block.title} />
                            </StyledListItemButton>
                        ))}
                    </StyledList>
                </StyledPaper>
            </StyledContainer>
        </Box>
    );
}

export default Lobby;
