// src/components/Layout/SidebarItem.js
import React from 'react';
import { ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const SidebarItem = ({ text, icon, path, selected }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(path);
  };

  return (
    <ListItem disablePadding>
      <ListItemButton
        selected={selected}
        onClick={handleClick}
        sx={{
          '&.Mui-selected': {
            backgroundColor: 'primary.main',
            color: 'white',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
            '& .MuiListItemIcon-root': {
              color: 'white',
            },
          },
        }}
      >
        <ListItemIcon>
          {icon}
        </ListItemIcon>
        <ListItemText primary={text} />
      </ListItemButton>
    </ListItem>
  );
};

export default SidebarItem;