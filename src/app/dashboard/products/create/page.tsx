'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useLocale } from 'src/hooks/useLocale';

import {
  Add as AddIcon,
  Save as SaveIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Grid,
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
  Autocomplete,
  InputAdornment,
  FormControlLabel,
} from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';

// Mock data
const mockCategories = [
  'Electronics > Smartphones',
  'Electronics > Laptops', 
  'Electronics > Tablets',
  'Fashion > Clothing',
  'Fashion > Shoes',
  'Fashion > Watches',
  'Home & Garden > Furniture',
  'Home & Garden > Decor',
  'Collectibles > Art',
  'Collectibles > Coins',
];

const mockBrands = [
  'Apple', 'Samsung', 'Microsoft', 'Google', 'Sony',
  'Nike', 'Adidas', 'Rolex', 'Omega', 'Louis Vuitton'
];

const mockTags = [
  'Premium', 'Sale', 'New Arrival', 'Limited Edition',
  'Vintage', 'Luxury', 'Professional', 'Gaming'
];

export default function CreateProductPage() {
  const router = useRouter();
  const { t } = useLocale();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    brand: '',
    category: '',
    price: '',
    reservePrice: '',
    condition: 'NEW',
    dimensions: {
      length: '',
      width: '',
      height: '',
      weight: '',
    },
    tags: [] as string[],
    specifications: [{ key: '', value: '' }],
    isActive: true,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDimensionChange = (dimension: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [dimension]: value,
      }
    }));
  };

  const handleSpecificationChange = (index: number, field: 'key' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.map((spec, i) => 
        i === index ? { ...spec, [field]: value } : spec
      ),
    }));
  };

  const addSpecification = () => {
    setFormData(prev => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }],
    }));
  };

  const removeSpecification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = t('products.productTitleRequired');
    }

    if (!formData.description.trim()) {
      newErrors.description = t('products.descriptionRequired');
    }

    if (!formData.brand.trim()) {
      newErrors.brand = t('products.brandRequired');
    }

    if (!formData.category.trim()) {
      newErrors.category = t('products.categoryRequired');
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = t('products.startingPriceRequired');
    }

    if (!formData.reservePrice || parseFloat(formData.reservePrice) <= 0) {
      newErrors.reservePrice = t('products.reservePriceRequired');
    }

    if (parseFloat(formData.reservePrice) >= parseFloat(formData.price)) {
      newErrors.reservePrice = t('products.reservePriceMustBeLess');
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
      
      console.log('Creating product:', formData);
      
      setSuccessMessage(t('products.createSuccess'));
      
      // Redirect after success
      setTimeout(() => {
        router.push('/dashboard/products');
      }, 1500);
    } catch (error) {
      console.error('Error creating product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard/products');
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
              {t('products.createTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('products.createDescription')}
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
          <Grid container spacing={3}>
            {/* Left Column */}
            <Grid item xs={12} md={8}>
              <Stack spacing={3}>
                {/* Basic Information */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('products.basicInfo')}
                  </Typography>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label={t('products.productTitle')}
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      error={!!errors.title}
                      helperText={errors.title}
                      required
                    />

                    <TextField
                      fullWidth
                      label={t('products.description')}
                      multiline
                      rows={4}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      error={!!errors.description}
                      helperText={errors.description}
                      required
                    />

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Autocomplete
                          freeSolo
                          options={mockBrands}
                          value={formData.brand}
                          onChange={(_, value) => handleInputChange('brand', value || '')}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label={t('products.brand')}
                              error={!!errors.brand}
                              helperText={errors.brand}
                              required
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Autocomplete
                          freeSolo
                          options={mockCategories}
                          value={formData.category}
                          onChange={(_, value) => handleInputChange('category', value || '')}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label={t('products.category')}
                              error={!!errors.category}
                              helperText={errors.category}
                              required
                            />
                          )}
                        />
                      </Grid>
                    </Grid>

                    <FormControl fullWidth>
                      <InputLabel>{t('products.condition')}</InputLabel>
                      <Select
                        value={formData.condition}
                        label={t('products.condition')}
                        onChange={(e) => handleInputChange('condition', e.target.value)}
                      >
                        <MenuItem value="NEW">{t('products.conditionNew')}</MenuItem>
                        <MenuItem value="EXCELLENT">{t('products.conditionExcellent')}</MenuItem>
                        <MenuItem value="GOOD">{t('products.conditionGood')}</MenuItem>
                        <MenuItem value="FAIR">{t('products.conditionFair')}</MenuItem>
                        <MenuItem value="POOR">Poor</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                </Card>

                {/* Pricing */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('products.pricing')}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label={t('products.startingPrice')}
                        type="number"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        error={!!errors.price}
                        helperText={errors.price}
                        required
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label={t('products.reservePrice')}
                        type="number"
                        value={formData.reservePrice}
                        onChange={(e) => handleInputChange('reservePrice', e.target.value)}
                        error={!!errors.reservePrice}
                        helperText={errors.reservePrice || t('products.reservePriceHelp')}
                        required
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                    </Grid>
                  </Grid>
                </Card>

                {/* Dimensions */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('products.dimensionsWeight')}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        label={t('products.length')}
                        type="number"
                        value={formData.dimensions.length}
                        onChange={(e) => handleDimensionChange('length', e.target.value)}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">in</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        label={t('products.width')}
                        type="number"
                        value={formData.dimensions.width}
                        onChange={(e) => handleDimensionChange('width', e.target.value)}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">in</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        label={t('products.height')}
                        type="number"
                        value={formData.dimensions.height}
                        onChange={(e) => handleDimensionChange('height', e.target.value)}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">in</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        label={t('products.weight')}
                        type="number"
                        value={formData.dimensions.weight}
                        onChange={(e) => handleDimensionChange('weight', e.target.value)}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">lbs</InputAdornment>,
                        }}
                      />
                    </Grid>
                  </Grid>
                </Card>

                {/* Specifications */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('products.specifications')}
                  </Typography>
                  <Stack spacing={2}>
                    {formData.specifications.map((spec, index) => (
                      <Grid container spacing={2} key={index}>
                        <Grid item xs={5}>
                          <TextField
                            fullWidth
                            label={t('products.specification')}
                            value={spec.key}
                            onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)}
                            placeholder={t('products.specificationPlaceholder')}
                          />
                        </Grid>
                        <Grid item xs={5}>
                          <TextField
                            fullWidth
                            label={t('products.value')}
                            value={spec.value}
                            onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                            placeholder={t('products.valuePlaceholder')}
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <IconButton 
                            onClick={() => removeSpecification(index)}
                            disabled={formData.specifications.length === 1}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    ))}
                    <Button
                      startIcon={<AddIcon />}
                      onClick={addSpecification}
                      variant="outlined"
                      size="small"
                    >
                      {t('products.addSpecification')}
                    </Button>
                  </Stack>
                </Card>
              </Stack>
            </Grid>

            {/* Right Column */}
            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                {/* Images */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('products.productImages')}
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
                      {t('products.uploadHelp')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('products.uploadFormats')}
                    </Typography>
                  </Box>
                </Card>

                {/* Tags */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('products.tags')}
                  </Typography>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={mockTags}
                    value={formData.tags}
                    onChange={(_, value) => handleInputChange('tags', value)}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          variant="outlined"
                          label={option}
                          {...getTagProps({ index })}
                          key={index}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder={t('products.tagsPlaceholder')}
                        helperText={t('products.tagsHelp')}
                      />
                    )}
                  />
                </Card>

                {/* Settings */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('products.settings')}
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive}
                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
                      />
                    }
                    label={t('products.active')}
                  />
                </Card>

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
                    {isSubmitting ? t('products.creating') : t('products.createProduct')}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleBack}
                    disabled={isSubmitting}
                    fullWidth
                  >
                    {t('products.cancel')}
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