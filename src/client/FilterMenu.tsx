import * as React from 'react';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { IconButton, Popover } from '@mui/material';

interface FilterMenuProps {
    highlighted: boolean;
    children: any;
}

export function FilterMenu(props: FilterMenuProps) {

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClickOverflow = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <React.Fragment>
            <IconButton
                onClick={handleClickOverflow}
            >
                <FilterAltIcon
                    color={props.highlighted ? 'primary' : undefined}
                />
            </IconButton>
            <Popover
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                {props.children}
            </Popover>
        </React.Fragment>
    );
};