'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import {
  Save as SaveIcon,
  Upload as UploadIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Grid,
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
  CircularProgress,
} from '@mui/material';

import { apiClient } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import { useLocale } from 'src/hooks/useLocale';

interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  parentId: string | null;
  level: number;
  productCount: number;
  isActive: boolean;
  isFeatured: boolean;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  parent?: Category | null;
}

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useLocale();
  const categoryId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | null>(null);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    parentId: '',
    isActive: true,
    isFeatured: false,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoryData, parentData] = await Promise.all([
          apiClient.get(`/api/categories/${categoryId}`),
          apiClient.get('/api/categories?includeInactive=false')
        ]);

        console.log('Category data:', categoryData); // Debug log
        const cat = categoryData.success ? categoryData.data.category : (categoryData.data || categoryData);
        setCategory(cat);
        setImageUrl(cat.imageUrl);
        
        setFormData({
          name: cat.name || '',
          description: cat.description || '',
          slug: cat.slug || '',
          parentId: cat.parentId || '',
          isActive: cat.isActive ?? true,
          isFeatured: cat.isFeatured ?? false,
        });

        const categories = parentData.success ? (parentData.data.data || parentData.data) : (parentData.data || parentData || []);
        setParentCategories(Array.isArray(categories) ? categories.filter((c: Category) => c.id !== categoryId) : []);

      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [categoryId]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    if (field === 'name') {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setFormData(prev => ({
        ...prev,
        slug,
      }));
    }

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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
      let imageUploadUrl = imageUrl;

      // Upload image if a new file was selected
      if (imageFile) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });
        reader.readAsDataURL(imageFile);
        
        imageUploadUrl = await base64Promise;
      }

      const data = await apiClient.put(`/api/categories/${categoryId}`, {
        ...formData,
        parentId: formData.parentId || null,
        imageUrl: imageUploadUrl,
      });

      if (data.success) {
        setSuccessMessage(t('categories.updateSuccess'));
        setTimeout(() => {
          router.push('/dashboard/categories');
        }, 1500);
      } else {
        setErrors({ general: data.error?.message || t('categories.updateError') });
      }
    } catch (error) {
      console.error('Error updating category:', error);
      setErrors({ general: t('messages.unexpectedError') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard/categories');
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, image: t('categories.invalidImageFile') }));
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: t('categories.imageSizeLimit') }));
      return;
    }

    setImageFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Clear any previous errors
    if (errors.image) {
      setErrors(prev => ({ ...prev, image: '' }));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <DashboardContent>
        <Box sx={{ py: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

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
              {t('categories.editCategory')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('categories.editDescription')}
            </Typography>
          </Box>
        </Stack>

        {/* Success Message */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        {/* Error Message */}
        {errors.general && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.general}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Left Column */}
            <Grid item xs={12} md={8}>
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
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      error={!!errors.name}
                      helperText={errors.name}
                      required
                    />

                    <TextField
                      fullWidth
                      label={t('common.description')}
                      multiline
                      rows={4}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      error={!!errors.description}
                      helperText={errors.description}
                      required
                    />

                    <TextField
                      fullWidth
                      label={t('categories.urlSlug')}
                      value={formData.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      error={!!errors.slug}
                      helperText={errors.slug || t('categories.slugHelper')}
                      required
                    />

                    <FormControl fullWidth>
                      <InputLabel>{t('categories.parentCategory')}</InputLabel>
                      <Select
                        value={formData.parentId}
                        label={t('categories.parentCategory')}
                        onChange={(e) => handleInputChange('parentId', e.target.value)}
                      >
                        <MenuItem value="">{t('categories.noParent')}</MenuItem>
                        {parentCategories.map((parentCategory) => (
                          <MenuItem key={parentCategory.id} value={parentCategory.id}>
                            {parentCategory.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isActive}
                          onChange={(e) => handleInputChange('isActive', e.target.checked)}
                        />
                      }
                      label={t('common.active')}
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isFeatured}
                          onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                        />
                      }
                      label={t('categories.featuredCategory')}
                      sx={{ mt: 1 }}
                    />
                  </Stack>
                </Card>
              </Stack>
            </Grid>

            {/* Right Column */}
            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                {/* Category Image */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('categories.categoryImage')}
                  </Typography>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  
                  {imageUrl ? (
                    <Box sx={{ position: 'relative' }}>
                      <Box
                        component="img"
                        src={imageUrl}
                        alt={t('categories.categoryImage')}
                        sx={{
                          width: '100%',
                          height: 200,
                          objectFit: 'cover',
                          borderRadius: 1,
                          mb: 2,
                        }}
                      />
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<UploadIcon />}
                          onClick={handleImageUpload}
                          fullWidth
                        >
                          {t('categories.changeImage')}
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          onClick={handleRemoveImage}
                        >
                          {t('common.remove')}
                        </Button>
                      </Stack>
                    </Box>
                  ) : (
                    <Box
                      onClick={handleImageUpload}
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
                  )}
                  
                  {errors.image && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {errors.image}
                    </Alert>
                  )}
                </Card>

                {/* Category Details */}
                {category && (
                  <Card sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      {t('categories.categoryDetails')}
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('categories.categoryId')}
                        </Typography>
                        <Typography variant="body2" fontFamily="monospace">
                          {category.id}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('categories.productCount')}
                        </Typography>
                        <Typography variant="body2">
                          {t('categories.productsCount', { count: category.productCount || 0 })}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('categories.levelLabel')}
                        </Typography>
                        <Typography variant="body2">
                          {t('categories.level', { level: category.level })}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('categories.created')}
                        </Typography>
                        <Typography variant="body2">
                          {new Date(category.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('categories.updated')}
                        </Typography>
                        <Typography variant="body2">
                          {new Date(category.updatedAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Stack>
                  </Card>
                )}

                {/* Actions */}
                <Stack direction="column" spacing={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={<SaveIcon />}
                    disabled={isSubmitting}
                    fullWidth
                  >
                    {isSubmitting ? t('categories.updating') : t('categories.updateCategory')}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleBack}
                    disabled={isSubmitting}
                    fullWidth
                  >
                    {t('common.cancel')}
                  </Button>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Box>
    </DashboardContent>
  );
}