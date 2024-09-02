"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, TextField, IconButton, List, ListItem, ListItemText, Avatar, Card } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MenuIcon from '@mui/icons-material/Menu';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { styled } from '@mui/system';
import Typewriter from 'typewriter-effect';


// CircularProgress===

const CustomCircularProgress = styled(CircularProgress)({
  color: '#6C4BBF', 
  position: 'relative',
  '& .MuiCircularProgress-circle': {
    strokeLinecap: 'round',
  },
});

const BackgroundCircle = styled(CircularProgress)({
  color: '#e0cffe',
  position: 'absolute',
});

// CircularProgress===


// MessagesPush====

const getMessagesWithChildren = (history) => {
  const messages = [];

  const addMessages = (message) => {
    messages.push(message);
    if (message.children) {
      message.children.forEach(addMessages);
    }
  };

  history.forEach(addMessages);
  return messages;
};

// MessagesPush====


export default function ChatInterface() {
  const [chatHistory, setChatHistory] = useState([]);
  const [parentID, setParentID] = useState(null); 
  const [selectedChat, setSelectedChat] = useState([]); 
  const [selectedItem, setSelectedItem] = useState(null);
  const [message, setMessage] = useState('');
  const [typing, setTyping] = useState(false); 
  const [openDialog, setOpenDialog] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [showChatHistory, setShowChatHistory] = useState(false);




  const toggleChatHistory = () => {
        setShowChatHistory(!showChatHistory);
  };

const confirmDeleteMessage = async () => {
  if (messageToDelete) {
    console.log(messageToDelete)
    await handleDeleteMessage(messageToDelete);
  }
  handleCloseDialog();
};

const handleOpenDialog = (id) => {
  setMessageToDelete(id);
  setOpenDialog(true);
};

const handleCloseDialog = () => {
  setOpenDialog(false);
  setMessageToDelete(null);
};

  const fetchChatHistory = async () => {
    try {
      const response = await axios.get('http://localhost:3030/chat-history');
      const flatHistory = response.data.map(chat => ({
        ...chat,
        history: getMessagesWithChildren(chat.history),
      }));
      setChatHistory(flatHistory);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };
  


  
useEffect(() => {
  fetchChatHistory();
}, []);


  const handleListItemClick = async  (id) => {
    setParentID(id);
    setSelectedItem(id);

    const selectedMessages = chatHistory
      .flatMap(chat => chat.history)
      .filter(msg => msg.parentId === id || msg.id === id);
    
    setSelectedChat([]);
    setTimeout(() => setSelectedChat(selectedMessages), 0); 
    await fetchChatHistory();
    toggleChatHistory();
  };


  const NewChat = () => {
    setSelectedChat([]);
    setParentID(null);
    setSelectedItem([]);
    toggleChatHistory();
  };


  const handleSendMessage = async () => {
    if (message.trim() === '') return;

    try {
      const newMessage = {
        id: Date.now(),
        name: 'User',
        content: message,
        parentId: parentID,
      };

      setSelectedChat(prevChat => [...prevChat, newMessage, { id: 'typing', name: 'Assistant', content: '...', parentId: newMessage.id }]);
      setMessage('');

      setTyping(true);

      const response = await axios.post('http://localhost:3030/chatme', {
        message,
        parentId: parentID,
      });

        setSelectedChat(prevChat => {
          const updatedChat = prevChat.filter(msg => msg.id !== 'typing');
          const assistantMessage = {
            id: Date.now(),
            name: 'Assistant',
            content: response.data.answer,
            parentId: newMessage.id,
          };
          return [...updatedChat, assistantMessage];
        });
        setTyping(false);
        await fetchChatHistory();
        setParentID(response.data.userChatId);


    } catch (error) {
      console.error('Error sending message:', error);
      setTyping(false);
    }
  };

  const handleDeleteMessage = async (id) => {
    try {
      await axios.delete(`http://localhost:3030/delete/${id}`);
      await fetchChatHistory();
      NewChat(); 
      
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  return (
    <Box className="flex flex-col h-screen bg-purple-50">
    {/* Header */}
 <Box className="flex justify-between items-center p-5 bg-white">
    <Box 
      className="w-14 h-14 flex items-center justify-center text-white font-bold text-[10.7px]" 
      style={{ 
        backgroundColor: '#65558F',
        borderRadius: '15px',
        marginLeft: '1.3%'
      }}
    >
      CHATBOT
    </Box>
  </Box>

   {/*Start of dialog for delete */}
    <Dialog
      open={openDialog}
      onClose={handleCloseDialog}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      classes={{ paper: 'p-4 rounded-3xl' }}
    >
      <DialogTitle id="alert-dialog-title"
        sx={{
          bgcolor: 'purple.50',
          borderRadius: '1.5rem',
          textAlign: 'center',
        }}
      >
        {"Are you sure you want to delete this Conversation?"}
      </DialogTitle>
  
      <DialogActions sx={{ justifyContent: 'center' }}>
        <Button onClick={handleCloseDialog} color="primary"
          className='bg-[#E8DEF8] text-black rounded-3xl w-20'
        >
          Cancel
        </Button>
        <Button onClick={confirmDeleteMessage} color="primary" autoFocus
          className='bg-[#B3261E] text-white rounded-3xl w-20'>
          Delete
        </Button>
      </DialogActions>
    </Dialog>

  {/* End of dialog for delete */}


    <Box className="flex flex-grow shadow-md">
      {/* Start of sidebar for chat history */}
      <Box 
    className={`fixed top-0 left-0 h-full p-4 border-r border-purple-50 bg-purple-50 shadow-lg transform ${
      showChatHistory ? 'translate-x-0 w-[75%]' : '-translate-x-full'
    } transition-transform duration-300 ease-in-out z-50 lg:relative lg:translate-x-0 lg:flex lg:flex-col lg:w-1/4`}
  >
    <ListItem 
      button 
      className="mb-2 p-2 rounded-2xl shadow-sm bg-white shadow-xl " 
      style={{ 
        backgroundColor: '#E8DEF8', 
        transform: 'scale(0.95)',
        cursor: 'pointer' 
      }}
      onClick={() => NewChat()}
    >
      <IconButton style={{ marginLeft:'25%'}}>
        <AddCircleOutlineIcon style={{ color: '#21005D',  marginLeft:'15%'}}  />   
      </IconButton>
      
      <ListItemText 
        primary="Conversation" 
        primaryTypographyProps={{ style: { color: '#21005D', fontWeight: 'bold' } }}
      />
    </ListItem>

    <List>
      {/* Load */}
      {chatHistory.length === 0 && (
        <Box className="flex justify-center items-center p-24">
          <BackgroundCircle thickness={4} variant="determinate" value={100} />
          <CustomCircularProgress thickness={4} />
        </Box>
      )}
      {chatHistory.map((chat, index) => (
        <ListItem
          key={chat.title}
          button
          className="mb-2 p-2 rounded-2xl shadow-sm bg-purple-50 animate__animated animate__fadeIn"
          style={{
            backgroundColor: selectedItem === chat.history[0].id ? '#d8c4dc' : '#E8DEF8',
            transform: 'scale(0.95)',
          }}
          onClick={() => handleListItemClick(chat.history[0].id)} 
        >
          <ListItemText  className="mr-1 ml-4"
            primary={`Conversation ${index + 1}`}
            primaryTypographyProps={{ style: { fontSize: '18px' } }}
          />
          <IconButton aria-label="delete" onClick={() => handleOpenDialog(chat.history[0].id)}>
            <DeleteIcon />
          </IconButton>
        </ListItem>
      ))}
    </List>
  </Box>
  {/* End of sidebar for chat history */}
  
      {/*Start of main chat area */}
      <Card
        className="flex-grow p-3 overflow-auto flex flex-col shadow-none"
        style={{
          borderRadius: '12px',
          marginTop: '16px',
          marginBottom: '2%',
          marginRight: '15px',
        }}
      >
      
                  <Box className="border-t border-gray-300 w-full lg:hidden p-1" />


        
        <Box className="mb-4">
          <Box className="flex items-center mb-2">
            <Avatar src="https://s3-alpha-sig.figma.com/img/6e4d/877c/e9c070a34ca062eebd3f33d8c1dac952?Expires=1726444800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=gCbGFvXVslkibYXboRYpMSEvU7GJ2rSJ9Ccf~pZvuP855Dd9VnST2lfeBR0pHezoCAoY4qFLaWCktCpwtHWLhBOsNYwvcoaQcHjrMZC77ba8zBa2WdCvVp2~mIA5UwQ4TEfVmrPNWiVoqZWX~g~5lHXYvkftSlBMC337ewZ2d4TbCiq9bHIuAqKGdbuxdSWSrbsHLCCkI4kwO7EXUV8IVq3OrGufewzdCloI1C5jzspOSBN5PLxSs5YtqkopudCk-XHJXiIcNF1APfbb0wa93bXRVkv0XvhjQsa-3wAzZ3c-Eq6GrCTxiO5g6Xw9BZw5Yw9wC9vi6ayroUZtMi8bEA__" className="w-8 h-8 rounded-full" />
            <Typography variant="body1" className="ml-2">Chatbot</Typography>
                <IconButton 
        className="ml-auto lg:hidden" 
        onClick={toggleChatHistory}
      >
        <MenuIcon />
      </IconButton>
          </Box>
          <Box className="border-t border-gray-300 w-full" />
        </Box>
  
        <Typography variant="caption" align="center" className="text-gray-500 mb-4">
          Jan 27, 12:53 PM
        </Typography>
  
        <Box className="flex-grow">
          <Box
            key="initial-message"
            className="flex items-start mb-4"
          >
            <Avatar src="https://s3-alpha-sig.figma.com/img/6e4d/877c/e9c070a34ca062eebd3f33d8c1dac952?Expires=1726444800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=gCbGFvXVslkibYXboRYpMSEvU7GJ2rSJ9Ccf~pZvuP855Dd9VnST2lfeBR0pHezoCAoY4qFLaWCktCpwtHWLhBOsNYwvcoaQcHjrMZC77ba8zBa2WdCvVp2~mIA5UwQ4TEfVmrPNWiVoqZWX~g~5lHXYvkftSlBMC337ewZ2d4TbCiq9bHIuAqKGdbuxdSWSrbsHLCCkI4kwO7EXUV8IVq3OrGufewzdCloI1C5jzspOSBN5PLxSs5YtqkopudCk-XHJXiIcNF1APfbb0wa93bXRVkv0XvhjQsa-3wAzZ3c-Eq6GrCTxiO5g6Xw9BZw5Yw9wC9vi6ayroUZtMi8bEA__" className="mr-2" />
            <Box>
              <Typography
                variant="body1"
                className="p-2 bg-purple-100 rounded-2xl self-start animate__animated animate__fadeIn"
                style={{
                  backgroundColor: '#f0e4f4',
                  color: '#000'
                }}
              >
                How can I help you?
              </Typography>
            </Box>
          </Box>
          
  
          {/* Render other chat messages */}
          {selectedChat.map((message) => (
            <Box
              key={message.id}
              className={`flex items-start mb-4 ${
                message.name === 'User' ? 'justify-end' : ''
              }`}
            >
              {message.name !== 'User' && (
                <Avatar src="https://s3-alpha-sig.figma.com/img/6e4d/877c/e9c070a34ca062eebd3f33d8c1dac952?Expires=1726444800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=gCbGFvXVslkibYXboRYpMSEvU7GJ2rSJ9Ccf~pZvuP855Dd9VnST2lfeBR0pHezoCAoY4qFLaWCktCpwtHWLhBOsNYwvcoaQcHjrMZC77ba8zBa2WdCvVp2~mIA5UwQ4TEfVmrPNWiVoqZWX~g~5lHXYvkftSlBMC337ewZ2d4TbCiq9bHIuAqKGdbuxdSWSrbsHLCCkI4kwO7EXUV8IVq3OrGufewzdCloI1C5jzspOSBN5PLxSs5YtqkopudCk-XHJXiIcNF1APfbb0wa93bXRVkv0XvhjQsa-3wAzZ3c-Eq6GrCTxiO5g6Xw9BZw5Yw9wC9vi6ayroUZtMi8bEA__" className="mr-2" />
              )}
              <Box>
                <Typography
                  variant="body1"
                  className="p-2 bg-purple-100 rounded-2xl self-start animate__animated animate__fadeIn"
                  style={{
                    backgroundColor: message.name === 'User' ? '#685c74' : '#f0e4f4',
                    color: message.name === 'User' ? '#fff' : '#000'
                  }}
                >
                  {message.name === 'Assistant' && message.content === '...' ? (
                    <Typewriter
                      options={{
                        strings: [message.content],
                        autoStart: true,
                        cursor: ".",
                        loop:true
                      }}
                    />
                  ) : (
                    message.content
                  )}
                </Typography>
              </Box>
              {message.name === 'User' && (
                <Avatar src="https://s3-alpha-sig.figma.com/img/eaa3/2071/7b7e77fd08d1bdaf9802cc375eb36366?Expires=1726444800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=hPVqAavE8BKnItyB-AMnVN2iOemWEUJAYQoRYWareZX7RDNRGWXtVYyZjsqVlOuvDvHHJdMvZD6-96c8zmnISXsA1oMeeNx-srCnmxPCG3fj4rzxbnFiDV23i3m8ll5fzclzyJQVU984eINBPk7Im-6kZv6I2J3nT1gdOsVSshqV0qg9JCNSl6z8q77qgJYg0eOLEigiL~PQeONSpCKlb~Y7lo2DyfDA~PmwPY5XvmEPLjhtOgJjKlRx0kWOAh5MNAluANCO6~pyFehQhQmvwKuut18JK9SnC5vNO06wkyDkUmnnfHTTDS8VZgKGCV2xt244K45fwWs4xfnuB-U~SQ__" className="ml-2" />
              )}
            </Box>
          ))}
        </Box>
  
        <Box className="flex items-center p-5 mt-4 bg-white">
          <Box className="flex-grow flex items-center">
            <TextField
              fullWidth
              placeholder="Reply to ChatBot"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              InputProps={{
                endAdornment: (
                  <IconButton color="gray" onClick={handleSendMessage}>
                    <SendIcon />
                  </IconButton>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '50px',
                  backgroundColor: '#ECE6F0',
                  '&:hover fieldset': {
                    borderColor: 'gray',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'black',
                  },
                },
              }}
            />
          </Box>
        </Box>
      </Card>
    </Box>
    {/*End of main chat area */}
  </Box>
  
  );
}
