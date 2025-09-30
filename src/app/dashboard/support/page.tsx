'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
  Stack,
  Button,
  Dialog,
  TextField,
  Typography,
  CardContent,
  Chip,
  IconButton,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  ChatBubble as MessageIcon,
  Close as CloseIcon,
  Send as SendIcon,
} from '@mui/icons-material';

import { DashboardContent } from 'src/layouts/dashboard';
import { useAuth } from 'src/hooks/useAuth';

interface SupportTicket {
  id: string;
  subject: string;
  subjectAr?: string;
  status: string;
  priority: string;
  category: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
  };
  assignee?: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface TicketMessage {
  id: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
  user: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

const statusColors: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  OPEN: 'info',
  IN_PROGRESS: 'warning',
  WAITING_CUSTOMER: 'default',
  RESOLVED: 'success',
  CLOSED: 'default',
};

const priorityColors: Record<string, 'default' | 'info' | 'warning' | 'error'> = {
  LOW: 'info',
  MEDIUM: 'default',
  HIGH: 'warning',
  URGENT: 'error',
};

export default function SupportTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Form states
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'MEDIUM',
    category: 'GENERAL',
  });
  const [newMessage, setNewMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      const authTokens = localStorage.getItem('auth_tokens');
      if (!authTokens) {
        setError('Authentication required');
        return;
      }

      const tokens = JSON.parse(authTokens);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/tickets?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setTickets(result.data.tickets || []);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error?.message || 'Failed to load tickets');
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const authTokens = localStorage.getItem('auth_tokens');
      if (!authTokens) {
        setError('Authentication required');
        return;
      }

      const tokens = JSON.parse(authTokens);

      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify(newTicket),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSuccess('Support ticket created successfully!');
          setCreateDialogOpen(false);
          setNewTicket({
            subject: '',
            description: '',
            priority: 'MEDIUM',
            category: 'GENERAL',
          });
          fetchTickets();
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error?.message || 'Failed to create ticket');
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError('Failed to create support ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchTicketMessages = async (ticketId: string) => {
    try {
      const authTokens = localStorage.getItem('auth_tokens');
      if (!authTokens) return;

      const tokens = JSON.parse(authTokens);

      const response = await fetch(`/api/tickets/${ticketId}/messages`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setMessages(result.data.messages || []);
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;

    try {
      setSubmitting(true);
      const authTokens = localStorage.getItem('auth_tokens');
      if (!authTokens) return;

      const tokens = JSON.parse(authTokens);

      const response = await fetch(`/api/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({
          message: newMessage,
          isInternal: false,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        fetchTicketMessages(selectedTicket.id);
        setSuccess('Message sent successfully!');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    await fetchTicketMessages(ticket.id);
    setMessageDialogOpen(true);
  };

  return (
    <DashboardContent>
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Support Tickets
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your support requests and get help
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchTickets}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              New Ticket
            </Button>
          </Stack>
        </Stack>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Status Filter */}
        <Box sx={{ mb: 3 }}>
          <Tabs
            value={statusFilter}
            onChange={(_, newValue) => setStatusFilter(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All" value="ALL" />
            <Tab label="Open" value="OPEN" />
            <Tab label="In Progress" value="IN_PROGRESS" />
            <Tab label="Waiting" value="WAITING_CUSTOMER" />
            <Tab label="Resolved" value="RESOLVED" />
            <Tab label="Closed" value="CLOSED" />
          </Tabs>
        </Box>

        {/* Tickets Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : tickets.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body1" color="text.secondary" align="center">
                No support tickets found. Create a new ticket to get help.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Subject</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Messages</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {ticket.subject}
                      </Typography>
                      {ticket.assignee && (
                        <Typography variant="caption" color="text.secondary">
                          Assigned to: {ticket.assignee.firstName} {ticket.assignee.lastName}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ticket.status.replace('_', ' ')}
                        color={statusColors[ticket.status]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ticket.priority}
                        color={priorityColors[ticket.priority]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {ticket.category.replace('_', ' ')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={ticket.messageCount} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<MessageIcon />}
                        onClick={() => handleViewTicket(ticket)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Create Ticket Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={() => !submitting && setCreateDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <Box sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
              <Typography variant="h6">Create Support Ticket</Typography>
              <IconButton onClick={() => setCreateDialogOpen(false)} disabled={submitting}>
                <CloseIcon />
              </IconButton>
            </Stack>

            <Stack spacing={3}>
              <TextField
                label="Subject"
                fullWidth
                required
                value={newTicket.subject}
                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                disabled={submitting}
              />

              <TextField
                label="Description"
                fullWidth
                required
                multiline
                rows={4}
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                disabled={submitting}
              />

              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newTicket.priority}
                  label="Priority"
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  disabled={submitting}
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="URGENT">Urgent</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newTicket.category}
                  label="Category"
                  onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  disabled={submitting}
                >
                  <MenuItem value="GENERAL">General</MenuItem>
                  <MenuItem value="TECHNICAL">Technical</MenuItem>
                  <MenuItem value="BILLING">Billing</MenuItem>
                  <MenuItem value="ACCOUNT">Account</MenuItem>
                  <MenuItem value="BIDDING">Bidding</MenuItem>
                  <MenuItem value="PAYMENT">Payment</MenuItem>
                  <MenuItem value="FEATURE_REQUEST">Feature Request</MenuItem>
                </Select>
              </FormControl>

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleCreateTicket}
                  disabled={submitting || !newTicket.subject || !newTicket.description}
                >
                  {submitting ? <CircularProgress size={24} /> : 'Create Ticket'}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Dialog>

        {/* Messages Dialog */}
        <Dialog
          open={messageDialogOpen}
          onClose={() => !submitting && setMessageDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <Box sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
              <Box>
                <Typography variant="h6">{selectedTicket?.subject}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip
                    label={selectedTicket?.status.replace('_', ' ')}
                    color={selectedTicket ? statusColors[selectedTicket.status] : 'default'}
                    size="small"
                  />
                  <Chip
                    label={selectedTicket?.priority}
                    color={selectedTicket ? priorityColors[selectedTicket.priority] : 'default'}
                    size="small"
                  />
                </Stack>
              </Box>
              <IconButton onClick={() => setMessageDialogOpen(false)} disabled={submitting}>
                <CloseIcon />
              </IconButton>
            </Stack>

            {/* Messages */}
            <Box sx={{ maxHeight: 400, overflowY: 'auto', mb: 3 }}>
              {messages.map((message) => (
                <Card key={message.id} sx={{ mb: 2, bgcolor: message.isInternal ? 'action.hover' : 'background.paper' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="subtitle2">
                        {message.user.firstName} {message.user.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(message.createdAt).toLocaleString()}
                      </Typography>
                    </Stack>
                    <Typography variant="body2">{message.message}</Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>

            {/* Reply Form */}
            {selectedTicket?.status !== 'CLOSED' && (
              <Box>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={submitting}
                />
                <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={handleSendMessage}
                    disabled={submitting || !newMessage.trim()}
                  >
                    Send Message
                  </Button>
                </Stack>
              </Box>
            )}
          </Box>
        </Dialog>
      </Box>
    </DashboardContent>
  );
}
