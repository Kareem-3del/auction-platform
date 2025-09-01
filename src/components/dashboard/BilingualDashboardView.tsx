'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Alert
} from '@mui/material';
import { Iconify } from '@/components/iconify';
import { useLocale } from '@/hooks/useLocale';
import { LanguageSwitcher } from '@/components/language-switcher';

interface DashboardStats {
  totalProducts: number;
  activeAuctions: number;
  totalUsers: number;
  totalRevenue: number;
  recentActivity: Activity[];
}

interface Activity {
  id: string;
  type: string;
  user: string;
  description: string;
  descriptionAr?: string;
  timestamp: Date;
  amount?: number;
}

interface BilingualEntity {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  status: string;
  createdAt: Date;
}

export function BilingualDashboardView() {
  const { t, isRTL, getLocalizedField, formatCurrency, formatDate } = useLocale();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [categories, setCategories] = useState<BilingualEntity[]>([]);
  const [brands, setBrands] = useState<BilingualEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<BilingualEntity | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  // Mock data - in real app, fetch from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(false);
      setStats({
        totalProducts: 1234,
        activeAuctions: 45,
        totalUsers: 5678,
        totalRevenue: 125000,
        recentActivity: [
          {
            id: '1',
            type: 'bid',
            user: 'أحمد محمد',
            description: 'Placed a bid on Vintage Watch',
            descriptionAr: 'قام بوضع عطاء على ساعة قديمة',
            timestamp: new Date('2024-01-15T10:30:00'),
            amount: 1500
          },
          {
            id: '2',
            type: 'auction_end',
            user: 'Sarah Johnson',
            description: 'Won auction for Antique Vase',
            descriptionAr: 'فاز في مزاد المزهرية الأثرية',
            timestamp: new Date('2024-01-15T09:15:00'),
            amount: 2800
          }
        ]
      });

      setCategories([
        {
          id: '1',
          name: 'Electronics',
          nameAr: 'الإلكترونيات',
          description: 'Electronic devices and gadgets',
          descriptionAr: 'الأجهزة والأدوات الإلكترونية',
          status: 'active',
          createdAt: new Date('2024-01-01')
        },
        {
          id: '2',
          name: 'Jewelry',
          nameAr: 'المجوهرات',
          description: 'Fine jewelry and watches',
          descriptionAr: 'المجوهرات الفاخرة والساعات',
          status: 'active',
          createdAt: new Date('2024-01-02')
        }
      ]);

      setBrands([
        {
          id: '1',
          name: 'Apple',
          nameAr: 'آبل',
          description: 'Technology and electronics',
          descriptionAr: 'التكنولوجيا والإلكترونيات',
          status: 'active',
          createdAt: new Date('2024-01-01')
        },
        {
          id: '2',
          name: 'Rolex',
          nameAr: 'رولكس',
          description: 'Luxury watches and timepieces',
          descriptionAr: 'الساعات الفاخرة وأدوات قياس الوقت',
          status: 'active',
          createdAt: new Date('2024-01-02')
        }
      ]);
    };

    fetchData();
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, entity: BilingualEntity) => {
    setMenuAnchor(event.currentTarget);
    setSelectedEntity(entity);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedEntity(null);
  };

  const handleEdit = () => {
    setDialogOpen(true);
    handleMenuClose();
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedEntity(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <Typography>{t('common.loading')}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with Language Switcher */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {t('navigation.dashboard')}
        </Typography>
        <LanguageSwitcher />
      </Box>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  {t('navigation.products')}
                </Typography>
                <Typography variant="h4">
                  {stats.totalProducts.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  {t('navigation.auctions')}
                </Typography>
                <Typography variant="h4">
                  {stats.activeAuctions}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  {t('navigation.users')}
                </Typography>
                <Typography variant="h4">
                  {stats.totalUsers.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  {t('common.total')} {t('wallet.balance')}
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(stats.totalRevenue)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3}>
        {/* Categories Table */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  {t('navigation.categories')}
                </Typography>
                <Button variant="outlined" size="small">
                  {t('navigation.addCategory')}
                </Button>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('common.name')}</TableCell>
                      <TableCell>{t('common.description')}</TableCell>
                      <TableCell>{t('common.status')}</TableCell>
                      <TableCell>{t('common.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {getLocalizedField(category, 'name')}
                            </Typography>
                            {isRTL && category.name && (
                              <Typography variant="caption" color="textSecondary">
                                {category.name}
                              </Typography>
                            )}
                            {!isRTL && category.nameAr && (
                              <Typography variant="caption" color="textSecondary">
                                {category.nameAr}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {getLocalizedField(category, 'description')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={category.status === 'active' ? t('common.active') : t('common.inactive')}
                            color={category.status === 'active' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, category)}
                          >
                            <Iconify icon="eva:more-vertical-fill" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Brands Table */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  {t('navigation.brands')}
                </Typography>
                <Button variant="outlined" size="small">
                  {t('navigation.addBrand')}
                </Button>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('common.name')}</TableCell>
                      <TableCell>{t('common.description')}</TableCell>
                      <TableCell>{t('common.status')}</TableCell>
                      <TableCell>{t('common.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {brands.map((brand) => (
                      <TableRow key={brand.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {getLocalizedField(brand, 'name')}
                            </Typography>
                            {isRTL && brand.name && (
                              <Typography variant="caption" color="textSecondary">
                                {brand.name}
                              </Typography>
                            )}
                            {!isRTL && brand.nameAr && (
                              <Typography variant="caption" color="textSecondary">
                                {brand.nameAr}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {getLocalizedField(brand, 'description')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={brand.status === 'active' ? t('common.active') : t('common.inactive')}
                            color={brand.status === 'active' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, brand)}
                          >
                            <Iconify icon="eva:more-vertical-fill" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t('common.recentActivity') || 'Recent Activity'}
              </Typography>

              {stats?.recentActivity.map((activity) => (
                <Box
                  key={activity.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' }
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {activity.user}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {isRTL ? activity.descriptionAr : activity.description}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    {activity.amount && (
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(activity.amount)}
                      </Typography>
                    )}
                    <Typography variant="caption" color="textSecondary">
                      {formatDate(activity.timestamp)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <Iconify icon="eva:edit-fill" sx={{ mr: 1 }} />
          {t('common.edit')}
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Iconify icon="eva:eye-fill" sx={{ mr: 1 }} />
          {t('common.view')}
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Iconify icon="eva:trash-2-fill" sx={{ mr: 1 }} />
          {t('common.delete')}
        </MenuItem>
      </Menu>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {t('common.edit')} {selectedEntity ? getLocalizedField(selectedEntity, 'name') : ''}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            {isRTL ? 
              'يمكنك تعديل المحتوى بكلا اللغتين. املأ الحقول المطلوبة.' :
              'You can edit content in both languages. Fill in the required fields.'
            }
          </Alert>
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={`${t('common.name')} (English)`}
                defaultValue={selectedEntity?.name}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={`الاسم (العربية)`}
                defaultValue={selectedEntity?.nameAr}
                inputProps={{ dir: 'rtl' }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={`${t('common.description')} (English)`}
                multiline
                rows={3}
                defaultValue={selectedEntity?.description}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={`الوصف (العربية)`}
                multiline
                rows={3}
                defaultValue={selectedEntity?.descriptionAr}
                inputProps={{ dir: 'rtl' }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="contained" onClick={handleDialogClose}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}