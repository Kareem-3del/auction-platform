'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Save as SaveIcon,
  Upload as UploadIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Chip,
  Stack,
  Alert,
  Button,
  Switch,
  Select,
  MenuItem,
  TextField,
  Typography,
  InputLabel,
  IconButton,
  FormControl,
  FormControlLabel,
} from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';

// Mock parent categories
const mockParentCategories = [
  { id: '1', name: 'Electronics', level: 0 },
  { id: '2', name: '-- Smartphones', level: 1 },
  { id: '3', name: '-- Laptops', level: 1 },
  { id: '4', name: 'Home & Garden', level: 0 },
  { id: '5', name: 'Fashion', level: 0 },
];

export default function CreateCategoryPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    parentId: '',
    isActive: true,
    metaTitle: '',
    metaDescription: '',
    keywords: [] as string[],
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [keywordInput, setKeywordInput] = useState('');

  // Generate slug from name
  const generateSlug = (name: string) => name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const handleInputChange = (field: keyof typeof formData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.type === 'checkbox' 
      ? (event.target as HTMLInputElement).checked 
      : event.target.value;
    
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Auto-generate slug when name changes
    if (field === 'name' && !formData.slug) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(value as string),
      }));
    }

    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSelectChange = (field: keyof typeof formData) => (
    event: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()],
      }));
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword),
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Creating category:', formData);
      
      setSuccessMessage('Category created successfully!');
      
      // Redirect after success
      setTimeout(() => {
        router.push('/dashboard/categories');
      }, 1500);
    } catch (error) {
      console.error('Error creating category:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard/categories');
  };

  return (
    <DashboardContent>
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <IconButton onClick={handleBack}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" gutterBottom>
              Create Category
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add a new product category to organize your inventory
            </Typography>
          </Box>
        </Stack>

        {/* Success Message */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Basic Information */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Category Name"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                />

                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  error={!!errors.description}
                  helperText={errors.description}
                  required
                />

                <TextField
                  fullWidth
                  label="Slug"
                  value={formData.slug}
                  onChange={handleInputChange('slug')}
                  error={!!errors.slug}
                  helperText={errors.slug || 'URL-friendly version of the category name'}
                  required
                />

                <FormControl fullWidth>
                  <InputLabel>Parent Category</InputLabel>
                  <Select
                    value={formData.parentId}
                    label="Parent Category"
                    onChange={handleSelectChange('parentId')}
                  >
                    <MenuItem value="">
                      <em>None (Top Level Category)</em>
                    </MenuItem>
                    {mockParentCategories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={handleInputChange('isActive')}
                    />
                  }
                  label="Active"
                />
              </Stack>
            </Card>

            {/* SEO Settings */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                SEO Settings
              </Typography>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Meta Title"
                  value={formData.metaTitle}
                  onChange={handleInputChange('metaTitle')}
                  helperText="Recommended length: 50-60 characters"
                />

                <TextField
                  fullWidth
                  label="Meta Description"
                  multiline
                  rows={2}
                  value={formData.metaDescription}
                  onChange={handleInputChange('metaDescription')}
                  helperText="Recommended length: 150-160 characters"
                />

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Keywords
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <TextField
                      size="small"
                      placeholder="Enter keyword"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddKeyword();
                        }
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={handleAddKeyword}
                      disabled={!keywordInput.trim()}
                    >
                      Add
                    </Button>
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {formData.keywords.map((keyword) => (
                      <Chip
                        key={keyword}
                        label={keyword}
                        onDelete={() => handleRemoveKeyword(keyword)}
                        size="small"
                      />
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </Card>

            {/* Image Upload */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Category Image
              </Typography>
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Click to upload or drag and drop
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  PNG, JPG, WEBP up to 2MB
                </Typography>
              </Box>
            </Card>

            {/* Actions */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Category'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Box>
    </DashboardContent>
  );
}