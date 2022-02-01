import { Box, Divider, Stack } from '@mui/material';
import * as React from 'react';
import Items from './Items';

export default () => {
    return (
        <Stack
            direction={'row'}
            divider={<Divider orientation='vertical' flexItem />}
            sx={{
                boxSizing: 'border-box',
                flex: '1 1 auto',
                height: '100vh',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    flex: '1 1 auto',
                    height: '100vh',
                    minWidth: '650px',
                }}
            >
                <Items />
            </Box>
            <Box
                sx={{
                    display: 'flex',
                    flex: '1 1 auto',
                    height: '100vh',
                    minWidth: '650px',
                }}
            >
            </Box>
        </Stack>
    );
};