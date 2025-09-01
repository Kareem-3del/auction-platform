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
import { useLocale } from 'src/hooks/useLocale';

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
  const { t } = useLocale();
  
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
      newErrors.name = t('categories.nameRequired');
    }

    if (!formData.description.trim()) {
      newErrors.description = t('categories.descriptionRequired');
    }

    if (!formData.slug.trim()) {
      newErrors.slug = t('categories.slugRequired');
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
      
      setSuccessMessage(t('categories.createSuccess'));
      
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
              {t('categories.createCategory')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('categories.createDescription')}
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
                {t('categories.basicInfo')}
              </Typography>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label={t('categories.categoryName')}
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                />

                <TextField
                  fullWidth
                  label={t('common.description')}
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
                  label={t('categories.slug')}
                  value={formData.slug}
                  onChange={handleInputChange('slug')}
                  error={!!errors.slug}
                  helperText={errors.slug || t('categories.slugHelper')}
                  required
                />

                <FormControl fullWidth>
                  <InputLabel>{t('categories.parentCategory')}</InputLabel>
                  <Select
                    value={formData.parentId}
                    label={t('categories.parentCategory')}
                    onChange={handleSelectChange('parentId')}
                  >
                    <MenuItem value="">
                      <em>{t('categories.noParent')}</em>
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
                  label={t('common.active')}
                />
              </Stack>
            </Card>

            {/* SEO Settings */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t('categories.seoSettings')}
              </Typography>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label={t('categories.metaTitle')}
                  value={formData.metaTitle}
                  onChange={handleInputChange('metaTitle')}
                  helperText={t('categories.metaTitleHelper')}
                />

                <TextField
                  fullWidth
                  label={t('categories.metaDescription')}
                  multiline
                  rows={2}
                  value={formData.metaDescription}
                  onChange={handleInputChange('metaDescription')}
                  helperText={t('categories.metaDescHelper')}
                />

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('categories.keywords')}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <TextField
                      size="small"
                      placeholder={t('categories.enterKeyword')}
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
                      {t('common.add')}
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
                {t('categories.categoryImage')}
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
                  {t('categories.uploadInstructions')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('categories.uploadFormats')}
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
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={isSubmitting}
              >
                {isSubmitting ? t('categories.creating') : t('categories.createCategory')}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Box>
    </DashboardContent>
  );
}