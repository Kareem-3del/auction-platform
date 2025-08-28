'use client';

import { useState, useEffect } from 'react';

import {
  Add as AddIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Preview as PreviewIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Chip,
  Grid,
  Stack,
  Table,
  Alert,
  Button,
  Dialog,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
} from '@mui/material';

import { apiClient } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

interface MailTemplate {
  id: string;
  name: string;
  subject: string;
  description: string;
  type: string;
  isActive: boolean;
  htmlContent: string;
  textContent: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

export default function MailTemplatesPage() {
  const [templates, setTemplates] = useState<MailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    description: '',
    type: 'notification',
    htmlContent: '',
    textContent: '',
    isActive: true,
  });

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get('/api/mail-templates');

        if (data.success) {
          setTemplates(data.data || []);
        } else {
          setError(data.error?.message || 'Failed to load mail templates');
          setTemplates([]);
        }
      } catch (error) {
        console.error('Error loading mail templates:', error);
        setError('An unexpected error occurred');
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  const filteredTemplates = Array.isArray(templates) ? templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setFormData({
      name: '',
      subject: '',
      description: '',
      type: 'notification',
      htmlContent: '',
      textContent: '',
      isActive: true,
    });
    setDialogOpen(true);
  };

  const handleEditTemplate = (template: MailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      description: template.description,
      type: template.type,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      isActive: template.isActive,
    });
    setDialogOpen(true);
  };

  const handlePreviewTemplate = (template: MailTemplate) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const handleSaveTemplate = async () => {
    try {
      const url = selectedTemplate ? `/api/mail-templates/${selectedTemplate.id}` : '/api/mail-templates';
      const method = selectedTemplate ? 'PUT' : 'POST';

      const data = selectedTemplate 
        ? await apiClient.put(url, formData)
        : await apiClient.post(url, formData);

      if (data.success) {
        if (selectedTemplate) {
          setTemplates(prev => prev.map(t => 
            t.id === selectedTemplate.id ? { ...t, ...formData } : t
          ));
        } else {
          setTemplates(prev => [...prev, data.data]);
        }
        setDialogOpen(false);
      } else {
        setError(data.error?.message || 'Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      setError('An unexpected error occurred');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'welcome':
        return 'success';
      case 'notification':
        return 'info';
      case 'reminder':
        return 'warning';
      case 'marketing':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  return (
    <DashboardContent>
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Mail Templates
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage email templates for system notifications
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateTemplate}
          >
            Create Template
          </Button>
        </Stack>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Search */}
        <Card sx={{ mb: 3, p: 2 }}>
          <TextField
            fullWidth
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
            }}
          />
        </Card>

        {/* Templates Table */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Template</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Variables</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {template.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Subject: {template.subject}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {template.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={template.type}
                        size="small"
                        color={getTypeColor(template.type) as any}
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={template.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={template.isActive ? 'success' : 'default'}
                        variant={template.isActive ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {template.variables.length} variables
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(template.updatedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          startIcon={<PreviewIcon />}
                          onClick={() => handlePreviewTemplate(template)}
                        >
                          Preview
                        </Button>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditTemplate(template)}
                        >
                          Edit
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        Loading templates...
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filteredTemplates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {searchQuery ? 'No templates match your search' : 'No templates found'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Create/Edit Template Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedTemplate ? 'Edit Template' : 'Create Template'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Template Name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Type"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subject Line"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="HTML Content"
                  multiline
                  rows={8}
                  value={formData.htmlContent}
                  onChange={(e) => setFormData(prev => ({ ...prev, htmlContent: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Plain Text Content"
                  multiline
                  rows={4}
                  value={formData.textContent}
                  onChange={(e) => setFormData(prev => ({ ...prev, textContent: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTemplate} variant="contained">
              {selectedTemplate ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Template Preview: {selectedTemplate?.name}</DialogTitle>
          <DialogContent>
            {selectedTemplate && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Subject: {selectedTemplate.subject}
                </Typography>
                <Box 
                  sx={{ 
                    border: 1, 
                    borderColor: 'divider', 
                    p: 2, 
                    borderRadius: 1,
                    backgroundColor: 'background.paper'
                  }}
                  dangerouslySetInnerHTML={{ __html: selectedTemplate.htmlContent }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardContent>
  );
}