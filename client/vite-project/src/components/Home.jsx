import React, { useState } from 'react';
import { Box, Button, Typography, CircularProgress, Paper, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { UploadFile as UploadFileIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const ChatContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  backgroundColor: '#121212',
  color: '#ffffff',
}));

const MessagesArea = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'scroll',
  padding: '16px',
  borderBottom: '1px solid #333',
}));

const Message = styled(Paper)(({ theme, isAI }) => ({
  marginBottom: '8px',
  padding: '12px',
  backgroundColor: isAI ? '#424242' : '#1f1f1f',
  alignSelf: isAI ? 'flex-start' : 'flex-end',
  maxWidth: '80%',
  display: 'inline-block',
  color: isAI ? '#f0e68c' : '#00ffff', // Cambia el color del texto según sea mensaje de IA o no
}));

const SubTitle = styled(Typography)(({ theme }) => ({
  fontSize: '0.8rem',
  fontWeight: 'bold',
  color: '#888',
  marginBottom: '4px',
}));

export default function Home() {
  const [file, setFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false); // Estado para manejar el modal
  const [confirmation, setConfirmation] = useState(false); // Estado para guardar la confirmación del usuario

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/transcribe/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Error en la carga del archivo');

      const result = await response.json();
      console.log(result);

      const transcriptionText = result.transcription.transcription;

      // Mostrar la transcripción sin procesar
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: transcriptionText, isAI: false, type: 'raw' },
      ]);

      // Abrir el modal para que el usuario confirme
      setOpen(true);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const handleConfirm = (confirmation) => {
    setOpen(false);
    setConfirmation(confirmation);
    // Enviar la transcripción al servidor de Next.js con la confirmación del usuario
    sendTranscriptionToAI(messages[messages.length - 1].text, confirmation);
  };

  const sendTranscriptionToAI = async (transcriptionText, confirmation) => {
    if (confirmation) {
      try {
        const response = await fetch('http://localhost:3000/api/ollama', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ transcription: transcriptionText }),
        });

        if (!response.ok) throw new Error('Error en la petición a la IA');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiResponse = '';
        let chunk = await reader.read();

        while (!chunk.done) {
          const text = decoder.decode(chunk.value, { stream: true });
          aiResponse += text;

          // Actualizar el mensaje progresivamente
          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages];
            const lastMessageIndex = updatedMessages.length - 1;

            if (updatedMessages[lastMessageIndex]?.isAI) {
              updatedMessages[lastMessageIndex].text = aiResponse;
            } else {
              updatedMessages.push({ text: aiResponse, isAI: true, type: 'processed' });
            }

            return updatedMessages;
          });

          chunk = await reader.read();
        }
      } catch (error) {
        console.error('Error en la IA:', error);
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: 'Lo sentimos, la IA no está disponible de momento... 😢', isAI: true, type: 'error' },
        ]);
      }
    } else {
      return;
    }
  };

  return (
    <ChatContainer>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: '16px',
          borderBottom: '1px solid #333',
          backgroundColor: '#1f1f1f',
        }}
      >
        <UploadFileIcon sx={{ color: '#ffffff' }} />
        <Typography variant="h6" sx={{ marginLeft: '8px', color: '#ffffff' }}>
          Audio a Texto con IA
        </Typography>
      </Box>
      <MessagesArea>
        {messages.map((msg, index) => (
          <Message key={index} isAI={msg.isAI}>
            {msg.type === 'raw' && <SubTitle>Transcripción de la IA sin procesar</SubTitle>}
            {msg.type === 'processed' && <SubTitle>Transcripción procesada</SubTitle>}
            <Typography variant="body1" sx={{ color: msg.isAI ? '#f0e68c' : '#00ffff' }}>
              {msg.text}
            </Typography>
          </Message>
        ))}
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '16px' }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </MessagesArea>
      <Box
        sx={{
          display: 'flex',
          padding: '16px',
          borderTop: '1px solid #333',
          backgroundColor: '#1f1f1f',
        }}
      >
        <input
          accept="audio/*"
          type="file"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="file-input"
        />
        <label htmlFor="file-input">
          <Button
            variant="contained"
            color="primary"
            component="span"
            sx={{ marginRight: '8px' }}
          >
            Seleccionar Archivo
          </Button>
        </label>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleUpload}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Subir y Transcribir'}
        </Button>
      </Box>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
      >
        <DialogTitle>Confirmación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Hay más de una persona hablando en el audio?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleConfirm(false)} color="primary">
            No
          </Button>
          <Button onClick={() => handleConfirm(true)} color="primary" autoFocus>
            Sí
          </Button>
        </DialogActions>
      </Dialog>
    </ChatContainer>
  );
}
