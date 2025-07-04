import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  TextField, 
  Button, 
  Paper, 
  Typography,
  ThemeProvider,
  createTheme,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

interface Message {
  text: string;
  sender: 'user' | 'bot';
  error?: boolean;
}

interface Customer {
  customer_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');

  // Load customers on component mount
  React.useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      const data = await response.json();
      setCustomers(data.slice(0, 10)); // Show first 10 customers
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const handleSend = async () => {
    if (input.trim()) {
      const newMessage: Message = {
        text: input,
        sender: 'user'
      };
      setMessages([...messages, newMessage]);
      setInput('');
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Sending request to backend...');
        
        // Use the new endpoint that supports synthetic data
        const response = await fetch('/api/chat/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            message: input,
            email: selectedCustomer
          }),
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (!response.ok) {
          throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        const botResponse: Message = {
          text: data.reply || data.message || data.response,
          sender: 'bot'
        };
        setMessages(prev => [...prev, botResponse]);

        // Add suggestions if available
        if (data.suggestions && data.suggestions.length > 0) {
          const suggestionsMessage: Message = {
            text: 'Suggestions:\n' + data.suggestions.join('\n'),
            sender: 'bot'
          };
          setMessages(prev => [...prev, suggestionsMessage]);
        }
      } catch (error: any) {
        console.error('Error details:', error);
        const errorMessage: Message = {
          text: error.message || 'Sorry, I encountered an error. Please try again.',
          sender: 'bot',
          error: true
        };
        setMessages(prev => [...prev, errorMessage]);
        setError(`Error: ${error.message || 'Failed to connect to the server. Please make sure the backend is running.'}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="sm">
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', py: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Banking Assistant
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Customer</InputLabel>
            <Select
              value={selectedCustomer}
              label="Select Customer"
              onChange={(e) => setSelectedCustomer(e.target.value)}
            >
              {customers.map((customer) => (
                <MenuItem key={customer.customer_id} value={customer.email}>
                  {customer.first_name} {customer.last_name} ({customer.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          <Paper 
            elevation={3} 
            sx={{ 
              flex: 1, 
              mb: 2, 
              p: 2, 
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '70%',
                  bgcolor: message.error 
                    ? 'error.light' 
                    : message.sender === 'user' 
                      ? 'primary.main' 
                      : 'grey.200',
                  color: message.sender === 'user' || message.error ? 'white' : 'text.primary',
                  p: 2,
                  borderRadius: 2,
                }}
              >
                <Typography>{message.text}</Typography>
              </Box>
            ))}
            {isLoading && (
              <Box sx={{ alignSelf: 'flex-start', p: 2 }}>
                <CircularProgress size={20} />
              </Box>
            )}
          </Paper>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
              disabled={isLoading || !selectedCustomer}
            />
            <Button 
              variant="contained" 
              onClick={handleSend}
              disabled={!input.trim() || isLoading || !selectedCustomer}
            >
              Send
            </Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App; 