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
        setSuccessMessage('Category updated successfully!');
        setTimeout(() => {
          router.push('/dashboard/categories');
        }, 1500);
      } else {
        setErrors({ general: data.error?.message || 'Failed to update category' });
      }
    } catch (error) {
      console.error('Error updating category:', error);
      setErrors({ general: 'An unexpected error occurred' });
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
      setErrors(prev => ({ ...prev, image: 'Please select a valid image file' }));
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'Image size must be less than 2MB' }));
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
              Edit Category
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update category information and settings
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
                    Basic Information
                  </Typography>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label="Category Name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      error={!!errors.name}
                      helperText={errors.name}
                      required
                    />

                    <TextField
                      fullWidth
                      label="Description"
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
                      label="URL Slug"
                      value={formData.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      error={!!errors.slug}
                      helperText={errors.slug || 'URL-friendly version of the category name'}
                      required
                    />

                    <FormControl fullWidth>
                      <InputLabel>Parent Category</InputLabel>
                      <Select
                        value={formData.parentId}
                        label="Parent Category"
                        onChange={(e) => handleInputChange('parentId', e.target.value)}
                      >
                        <MenuItem value="">None (Top Level)</MenuItem>
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
                      label="Active"
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isFeatured}
                          onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                        />
                      }
                      label="Featured Category"
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
                    Category Image
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
                        alt="Category image"
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
                          Change Image
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          onClick={handleRemoveImage}
                        >
                          Remove
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
                        Click to upload or drag and drop
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        PNG, JPG, WEBP up to 2MB
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
                      Category Details
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Category ID
                        </Typography>
                        <Typography variant="body2" fontFamily="monospace">
                          {category.id}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Product Count
                        </Typography>
                        <Typography variant="body2">
                          {category.productCount || 0} products
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Level
                        </Typography>
                        <Typography variant="body2">
                          Level {category.level}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Created
                        </Typography>
                        <Typography variant="body2">
                          {new Date(category.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Last Updated
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
                    {isSubmitting ? 'Updating...' : 'Update Category'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleBack}
                    disabled={isSubmitting}
                    fullWidth
                  >
                    Cancel
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