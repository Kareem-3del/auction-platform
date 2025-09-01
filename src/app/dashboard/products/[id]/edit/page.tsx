'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

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
  InputAdornment,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';

import { apiClient } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import { useLocale } from 'src/hooks/useLocale';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Brand {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

interface Product {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  condition: string;
  estimatedValueMin?: number;
  estimatedValueMax?: number;
  reservePrice?: number;
  specifications?: any;
  customFields?: any;
  images?: string[];
  status: string;
  isActive?: boolean;
  categoryId?: string;
  brandId?: string;
  category?: Category;
  brand?: Brand;
  tags?: Tag[];
  // Unified auction fields
  startingBid?: number;
  currentBid?: number;
  bidIncrement?: number;
  auctionType?: string;
  auctionStatus?: string;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  autoExtend?: boolean;
  extensionTriggerMinutes?: number;
  extensionDurationMinutes?: number;
  maxExtensions?: number;
  buyNowPrice?: number;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const { t } = useLocale();
  
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [originalData, setOriginalData] = useState<any>({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    categoryId: '',
    brandId: '',
    condition: 'NEW',
    estimatedValueMin: '',
    estimatedValueMax: '',
    reservePrice: '',
    images: [] as string[],
    specifications: [{ key: '', value: '' }],
    customFields: {} as any,
    status: 'PENDING_APPROVAL',
    // Unified auction fields
    startingBid: '',
    bidIncrement: '',
    auctionType: 'LIVE',
    startTime: '',
    endTime: '',
    timezone: 'America/New_York',
    autoExtend: true,
    extensionTriggerMinutes: '5',
    extensionDurationMinutes: '10',
    maxExtensions: '3',
    buyNowPrice: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load product, categories, brands, and tags in parallel
        const [productData, categoriesData, brandsData, tagsData] = await Promise.all([
          apiClient.get(`/api/products/${productId}`),
          apiClient.get('/api/categories'),
          apiClient.get('/api/brands'),
          apiClient.get('/api/tags')
        ]);

        // Handle different API response structures
        let prod;
        if (productData.success && productData.data) {
          // Format: { success: true, data: { product: {...} } }
          prod = productData.data.product || productData.data;
        } else if (productData.data) {
          // Format: { data: {...} }
          prod = productData.data;
        } else {
          // Direct format: { title: "...", ... }
          prod = productData;
        }
        
        if (prod) {
          console.log('Product data:', prod); // Debug log
          setProduct(prod);
          
          // Parse specifications if they exist
          let specs = [{ key: '', value: '' }];
          if (prod.specifications) {
            try {
              const parsed = typeof prod.specifications === 'string' 
                ? JSON.parse(prod.specifications) 
                : prod.specifications;
              if (Array.isArray(parsed) && parsed.length > 0) {
                specs = parsed;
              }
            } catch (e) {
              console.warn('Failed to parse specifications:', e);
            }
          }

          const formDataInit = {
            title: prod.title || '',
            description: prod.description || '',
            shortDescription: prod.shortDescription || '',
            categoryId: prod.categoryId || '',
            brandId: prod.brandId || '',
            condition: prod.condition || 'NEW',
            estimatedValueMin: prod.estimatedValueMin?.toString() || '',
            estimatedValueMax: prod.estimatedValueMax?.toString() || '',
            reservePrice: prod.reservePrice?.toString() || '',
            images: prod.images || [],
            specifications: specs,
            customFields: prod.customFields || {},
            status: prod.status || 'PENDING_APPROVAL',
            // Unified auction fields
            startingBid: prod.startingBid?.toString() || '',
            bidIncrement: prod.bidIncrement?.toString() || '5',
            auctionType: prod.auctionType || 'LIVE',
            startTime: prod.startTime ? new Date(prod.startTime).toISOString().slice(0, 16) : '',
            endTime: prod.endTime ? new Date(prod.endTime).toISOString().slice(0, 16) : '',
            timezone: prod.timezone || 'America/New_York',
            autoExtend: prod.autoExtend !== false,
            extensionTriggerMinutes: prod.extensionTriggerMinutes?.toString() || '5',
            extensionDurationMinutes: prod.extensionDurationMinutes?.toString() || '10',
            maxExtensions: prod.maxExtensions?.toString() || '3',
            buyNowPrice: prod.buyNowPrice?.toString() || '',
          };

          // Store original data for comparison
          setOriginalData(formDataInit);
          setFormData(formDataInit);
        }

        // Handle different API response formats for categories
        let categoriesArray = [];
        if (categoriesData.success && categoriesData.data) {
          categoriesArray = categoriesData.data.data || categoriesData.data;
        } else if (categoriesData.data) {
          categoriesArray = categoriesData.data;
        }
        setCategories(Array.isArray(categoriesArray) ? categoriesArray : []);

        // Handle different API response formats for brands
        let brandsArray = [];
        if (brandsData.success && brandsData.data) {
          brandsArray = brandsData.data.data || brandsData.data;
        } else if (brandsData.data) {
          brandsArray = brandsData.data;
        }
        setBrands(Array.isArray(brandsArray) ? brandsArray : []);

        // Handle different API response formats for tags
        let tagsArray = [];
        if (tagsData.success && tagsData.data) {
          tagsArray = tagsData.data.data || tagsData.data;
        } else if (tagsData.data) {
          tagsArray = tagsData.data;
        }
        setTags(Array.isArray(tagsArray) ? tagsArray : []);

      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [productId]);

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

  // Remove dimension change handler as it's not needed for real product data

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

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(t('products.fileTooLarge', { filename: file.name }));
        return;
      }

      if (!file.type.match(/^image\/(png|jpg|jpeg|webp)$/)) {
        alert(t('products.fileNotSupported', { filename: file.name }));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result as string;
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, imageUrl],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
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

    if (!formData.categoryId.trim()) {
      newErrors.categoryId = t('products.categoryRequired');
    }

    if (formData.estimatedValueMin && formData.estimatedValueMax) {
      if (parseFloat(formData.estimatedValueMin) > parseFloat(formData.estimatedValueMax)) {
        newErrors.estimatedValueMax = t('products.maxValueError');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Utility function to get only changed fields
  const getChangedFields = (original: any, current: any) => {
    const changes: any = {};
    
    // Deep comparison for each field
    Object.keys(current).forEach(key => {
      const currentValue = current[key];
      const originalValue = original[key];
      
      // Handle arrays (like images, specifications)
      if (Array.isArray(currentValue) && Array.isArray(originalValue)) {
        if (JSON.stringify(currentValue) !== JSON.stringify(originalValue)) {
          changes[key] = currentValue;
        }
      }
      // Handle objects (like customFields)
      else if (typeof currentValue === 'object' && currentValue !== null && typeof originalValue === 'object' && originalValue !== null) {
        if (JSON.stringify(currentValue) !== JSON.stringify(originalValue)) {
          changes[key] = currentValue;
        }
      }
      // Handle primitive values
      else if (currentValue !== originalValue) {
        changes[key] = currentValue;
      }
    });
    
    return changes;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      // Detect only changed fields
      const changedFields = getChangedFields(originalData, formData);
      
      // If no changes detected, show message and return
      if (Object.keys(changedFields).length === 0) {
        setSuccessMessage(t('products.noChangesDetected'));
        setTimeout(() => setSuccessMessage(''), 3000);
        setIsSubmitting(false);
        return;
      }
      
      // Process and convert data types only for changed fields
      const processedChanges: any = {};
      
      Object.keys(changedFields).forEach(key => {
        const value = changedFields[key];
        
        switch (key) {
          case 'specifications':
            processedChanges[key] = JSON.stringify(value.filter((spec: any) => spec.key && spec.value));
            break;
          case 'estimatedValueMin':
          case 'estimatedValueMax':
          case 'reservePrice':
          case 'startingBid':
          case 'bidIncrement':
          case 'buyNowPrice':
            processedChanges[key] = value ? parseFloat(value) : null;
            break;
          case 'extensionTriggerMinutes':
          case 'extensionDurationMinutes':
          case 'maxExtensions':
            processedChanges[key] = value ? parseInt(value) : null;
            break;
          case 'startTime':
          case 'endTime':
            processedChanges[key] = value ? new Date(value).toISOString() : null;
            break;
          default:
            processedChanges[key] = value;
        }
      });
      
      console.log('Sending only changed fields:', processedChanges); // Debug log
      
      const data = await apiClient.put(`/api/products/${productId}`, processedChanges);

      if (data.success) {
        setSuccessMessage(t('products.updateSuccess'));
        setTimeout(() => {
          router.push('/dashboard/products');
        }, 1500);
      } else {
        setErrors({ general: data.error?.message || t('products.updateError') });
      }
    } catch (error) {
      console.error('Error updating product:', error);
      setErrors({ general: t('products.unexpectedError') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard/products');
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
              {t('products.editTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('products.editDescription')}
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

                    <TextField
                      fullWidth
                      label={t('products.shortDescription')}
                      value={formData.shortDescription}
                      onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                      helperText={t('products.shortDescriptionHelp')}
                    />

                    <FormControl fullWidth error={!!errors.categoryId} required>
                      <InputLabel>{t('products.category')}</InputLabel>
                      <Select
                        value={formData.categoryId}
                        label={t('products.category')}
                        onChange={(e) => handleInputChange('categoryId', e.target.value)}
                      >
                        {categories.map((category) => (
                          <MenuItem key={category.id} value={category.id}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.categoryId && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                          {errors.categoryId}
                        </Typography>
                      )}
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel>{t('products.brand')}</InputLabel>
                      <Select
                        value={formData.brandId}
                        label={t('products.brand')}
                        onChange={(e) => handleInputChange('brandId', e.target.value)}
                      >
                        <MenuItem value="">
                          <em>{t('products.noBrand')}</em>
                        </MenuItem>
                        {brands.map((brand) => (
                          <MenuItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

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
                        <MenuItem value="POOR">{t('products.poor')}</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                </Card>

                {/* Valuation */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('products.estimatedValue')}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label={t('products.minimumValue')}
                        type="number"
                        value={formData.estimatedValueMin}
                        onChange={(e) => handleInputChange('estimatedValueMin', e.target.value)}
                        error={!!errors.estimatedValueMin}
                        helperText={errors.estimatedValueMin || t('products.minimumValueHelp')}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label={t('products.maximumValue')}
                        type="number"
                        value={formData.estimatedValueMax}
                        onChange={(e) => handleInputChange('estimatedValueMax', e.target.value)}
                        error={!!errors.estimatedValueMax}
                        helperText={errors.estimatedValueMax || t('products.maximumValueHelp')}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('products.reservePrice')}
                        type="number"
                        value={formData.reservePrice}
                        onChange={(e) => handleInputChange('reservePrice', e.target.value)}
                        error={!!errors.reservePrice}
                        helperText={errors.reservePrice || t('products.reservePriceEditHelp')}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                    </Grid>
                  </Grid>
                </Card>

                {/* Auction Settings */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('products.auctionSettings')}
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={t('products.startingBid')}
                        type="number"
                        value={formData.startingBid}
                        onChange={(e) => handleInputChange('startingBid', e.target.value)}
                        error={!!errors.startingBid}
                        helperText={errors.startingBid || t('products.startingBidHelp')}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={t('products.bidIncrement')}
                        type="number"
                        value={formData.bidIncrement}
                        onChange={(e) => handleInputChange('bidIncrement', e.target.value)}
                        error={!!errors.bidIncrement}
                        helperText={errors.bidIncrement || t('products.bidIncrementHelp')}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={t('products.buyNowPrice')}
                        type="number"
                        value={formData.buyNowPrice}
                        onChange={(e) => handleInputChange('buyNowPrice', e.target.value)}
                        error={!!errors.buyNowPrice}
                        helperText={errors.buyNowPrice || t('products.buyNowPriceHelp')}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>{t('products.auctionType')}</InputLabel>
                        <Select
                          value={formData.auctionType}
                          label={t('products.auctionType')}
                          onChange={(e) => handleInputChange('auctionType', e.target.value)}
                        >
                          <MenuItem value="LIVE">{t('products.liveAuction')}</MenuItem>
                          <MenuItem value="SEALED">{t('products.sealedBid')}</MenuItem>
                          <MenuItem value="RESERVE">{t('products.reserveAuction')}</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={t('products.startTime')}
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={(e) => handleInputChange('startTime', e.target.value)}
                        error={!!errors.startTime}
                        helperText={errors.startTime || t('products.startTimeHelp')}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={t('products.endTime')}
                        type="datetime-local"
                        value={formData.endTime}
                        onChange={(e) => handleInputChange('endTime', e.target.value)}
                        error={!!errors.endTime}
                        helperText={errors.endTime || t('products.endTimeHelp')}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        {t('products.autoExtensionSettings')}
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.autoExtend}
                            onChange={(e) => handleInputChange('autoExtend', e.target.checked)}
                          />
                        }
                        label={t('products.enableAutoExtension')}
                      />
                    </Grid>
                    {formData.autoExtend && (
                      <>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label={t('products.extensionTrigger')}
                            type="number"
                            value={formData.extensionTriggerMinutes}
                            onChange={(e) => handleInputChange('extensionTriggerMinutes', e.target.value)}
                            error={!!errors.extensionTriggerMinutes}
                            helperText={t('products.extensionTriggerHelp')}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">min</InputAdornment>,
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label={t('products.extensionDuration')}
                            type="number"
                            value={formData.extensionDurationMinutes}
                            onChange={(e) => handleInputChange('extensionDurationMinutes', e.target.value)}
                            error={!!errors.extensionDurationMinutes}
                            helperText={t('products.extensionDurationHelp')}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">min</InputAdornment>,
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label={t('products.maxExtensions')}
                            type="number"
                            value={formData.maxExtensions}
                            onChange={(e) => handleInputChange('maxExtensions', e.target.value)}
                            error={!!errors.maxExtensions}
                            helperText={t('products.maxExtensionsHelp')}
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                </Card>

                {/* Status */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('common.status')}
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel>{t('common.status')}</InputLabel>
                    <Select
                      value={formData.status}
                      label={t('common.status')}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                    >
                      <MenuItem value="PENDING_APPROVAL">{t('products.pendingApproval')}</MenuItem>
                      <MenuItem value="APPROVED">{t('products.approved')}</MenuItem>
                      <MenuItem value="REJECTED">{t('products.rejected')}</MenuItem>
                    </Select>
                  </FormControl>
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
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpg,image/jpeg,image/webp"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  
                  {/* Upload area */}
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
                      {t('products.uploadHelp')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('products.uploadFormats')}
                    </Typography>
                  </Box>
                  
                  {/* Current Images */}
                  {formData.images && formData.images.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {t('products.currentImages', { count: formData.images.length })}
                      </Typography>
                      <Grid container spacing={1}>
                        {formData.images.map((image, index) => (
                          <Grid item xs={6} key={index}>
                            <Box
                              sx={{
                                position: 'relative',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                overflow: 'hidden',
                                aspectRatio: '1',
                              }}
                            >
                              <Box
                                component="img"
                                src={image}
                                alt={`Product ${index + 1}`}
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => removeImage(index)}
                                sx={{
                                  position: 'absolute',
                                  top: 4,
                                  right: 4,
                                  backgroundColor: 'background.paper',
                                  '&:hover': {
                                    backgroundColor: 'error.light',
                                    color: 'error.contrastText',
                                  },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </Card>

                {/* Custom Fields */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('products.additionalInformation')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('products.additionalInformationHelp')}
                  </Typography>
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
                    {isSubmitting ? t('products.updating') : t('products.updateProduct')}
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