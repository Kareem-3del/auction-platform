'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Typography,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import { useLocale } from '@/hooks/useLocale';

// Validation schema
const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  nameAr: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().min(0).default(0),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface BilingualCategoryFormProps {
  initialData?: Partial<CategoryFormData>;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  isLoading?: boolean;
}

export function BilingualCategoryForm({
  initialData,
  onSubmit,
  isLoading = false
}: BilingualCategoryFormProps) {
  const { t, isRTL } = useLocale();
  const [tabValue, setTabValue] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty }
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      nameAr: '',
      slug: '',
      description: '',
      descriptionAr: '',
      isActive: true,
      isFeatured: false,
      sortOrder: 0,
      ...initialData,
    },
  });

  const watchedName = watch('name');

  // Auto-generate slug from name
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (value: string) => {
    if (!initialData?.slug) {
      setValue('slug', generateSlug(value));
    }
  };

  const handleFormSubmit = async (data: CategoryFormData) => {
    try {
      setSubmitError(null);
      await onSubmit(data);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Card>
        <CardHeader
          title={initialData ? t('common.edit') + ' ' + t('navigation.categories') : t('common.create') + ' ' + t('navigation.categories')}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" type="button">
                {t('common.cancel')}
              </Button>
              <Button
                variant="contained"
                type="submit"
                disabled={isLoading || !isDirty}
              >
                {isLoading ? t('common.loading') : t('common.save')}
              </Button>
            </Box>
          }
        />

        <CardContent>
          {submitError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {submitError}
            </Alert>
          )}

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label={`English`} />
              <Tab label={`العربية`} />
              <Tab label={t('common.settings')} />
            </Tabs>
          </Box>

          {/* English Tab */}
          {tabValue === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={`${t('common.name')} (English) *`}
                      fullWidth
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        handleNameChange(e.target.value);
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="slug"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={`URL Slug *`}
                      fullWidth
                      error={!!errors.slug}
                      helperText={errors.slug?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={`${t('common.description')} (English)`}
                      fullWidth
                      multiline
                      rows={4}
                      error={!!errors.description}
                      helperText={errors.description?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          )}

          {/* Arabic Tab */}
          {tabValue === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Controller
                  name="nameAr"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={`الاسم (العربية)`}
                      fullWidth
                      error={!!errors.nameAr}
                      helperText={errors.nameAr?.message}
                      inputProps={{
                        dir: 'rtl',
                        style: { textAlign: 'right' }
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="descriptionAr"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={`الوصف (العربية)`}
                      fullWidth
                      multiline
                      rows={4}
                      error={!!errors.descriptionAr}
                      helperText={errors.descriptionAr?.message}
                      inputProps={{
                        dir: 'rtl',
                        style: { textAlign: 'right' }
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          )}

          {/* Settings Tab */}
          {tabValue === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="sortOrder"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('common.sortOrder') || 'Sort Order'}
                      type="number"
                      fullWidth
                      error={!!errors.sortOrder}
                      helperText={errors.sortOrder?.message}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.value}
                            onChange={field.onChange}
                          />
                        }
                        label={t('common.active')}
                      />
                    )}
                  />

                  <Controller
                    name="isFeatured"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.value}
                            onChange={field.onChange}
                          />
                        }
                        label={`Featured`}
                      />
                    )}
                  />
                </Box>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
    </form>
  );
}