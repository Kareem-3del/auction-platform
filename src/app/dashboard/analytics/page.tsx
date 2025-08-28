'use client';

import { useState, useEffect } from 'react';

import {
  Box,
  Card,
  Grid,
  Stack,
  Typography,
  CardContent,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import {
  Gavel as AuctionIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';

import { apiClient } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

interface AnalyticsData {
  totalRevenue: number;
  totalAuctions: number;
  totalUsers: number;
  totalBids: number;
  revenueGrowth: number;
  auctionGrowth: number;
  userGrowth: number;
  bidGrowth: number;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalAuctions: 0,
    totalUsers: 0,
    totalBids: 0,
    revenueGrowth: 0,
    auctionGrowth: 0,
    userGrowth: 0,
    bidGrowth: 0,
  });

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const result = await apiClient.get('/api/analytics');

        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

  const formatPercentage = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

  const getGrowthColor = (growth: number) => growth >= 0 ? 'success.main' : 'error.main';

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
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Platform performance metrics and insights
            </Typography>
          </Box>
        </Stack>

        <Grid container spacing={3}>
          {/* Key Metrics */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <MoneyIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                    <Typography variant="caption" color={getGrowthColor(data.revenueGrowth)}>
                      {formatPercentage(data.revenueGrowth)}
                    </Typography>
                  </Stack>
                  <Box>
                    <Typography variant="h4" color="primary.main">
                      {formatCurrency(data.totalRevenue)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Revenue
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <AuctionIcon sx={{ color: 'success.main', fontSize: 32 }} />
                    <Typography variant="caption" color={getGrowthColor(data.auctionGrowth)}>
                      {formatPercentage(data.auctionGrowth)}
                    </Typography>
                  </Stack>
                  <Box>
                    <Typography variant="h4" color="success.main">
                      {data.totalAuctions}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Auctions
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <PersonIcon sx={{ color: 'info.main', fontSize: 32 }} />
                    <Typography variant="caption" color={getGrowthColor(data.userGrowth)}>
                      {formatPercentage(data.userGrowth)}
                    </Typography>
                  </Stack>
                  <Box>
                    <Typography variant="h4" color="info.main">
                      {data.totalUsers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Users
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <TrendingUpIcon sx={{ color: 'warning.main', fontSize: 32 }} />
                    <Typography variant="caption" color={getGrowthColor(data.bidGrowth)}>
                      {formatPercentage(data.bidGrowth)}
                    </Typography>
                  </Stack>
                  <Box>
                    <Typography variant="h4" color="warning.main">
                      {data.totalBids}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Bids
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Analytics Charts Placeholder */}
          <Grid item xs={12} md={8}>
            <Card sx={{ height: 400 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Revenue Trends
                </Typography>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: 300,
                    color: 'text.secondary'
                  }}
                >
                  <Stack alignItems="center" spacing={2}>
                    <TimelineIcon sx={{ fontSize: 48, opacity: 0.5 }} />
                    <Typography variant="body2">
                      Chart visualization coming soon
                    </Typography>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: 400 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Overview
                </Typography>
                <Stack spacing={3} sx={{ mt: 2 }}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2">Revenue Growth</Typography>
                      <Typography variant="body2" color={getGrowthColor(data.revenueGrowth)}>
                        {formatPercentage(data.revenueGrowth)}
                      </Typography>
                    </Stack>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(Math.abs(data.revenueGrowth), 100)} 
                      color={data.revenueGrowth >= 0 ? 'success' : 'error'}
                    />
                  </Box>

                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2">User Growth</Typography>
                      <Typography variant="body2" color={getGrowthColor(data.userGrowth)}>
                        {formatPercentage(data.userGrowth)}
                      </Typography>
                    </Stack>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(Math.abs(data.userGrowth), 100)} 
                      color={data.userGrowth >= 0 ? 'success' : 'error'}
                    />
                  </Box>

                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2">Auction Activity</Typography>
                      <Typography variant="body2" color={getGrowthColor(data.auctionGrowth)}>
                        {formatPercentage(data.auctionGrowth)}
                      </Typography>
                    </Stack>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(Math.abs(data.auctionGrowth), 100)} 
                      color={data.auctionGrowth >= 0 ? 'success' : 'error'}
                    />
                  </Box>

                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2">Bidding Activity</Typography>
                      <Typography variant="body2" color={getGrowthColor(data.bidGrowth)}>
                        {formatPercentage(data.bidGrowth)}
                      </Typography>
                    </Stack>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(Math.abs(data.bidGrowth), 100)} 
                      color={data.bidGrowth >= 0 ? 'success' : 'error'}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </DashboardContent>
  );
}