'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
  Stack,
  Button,
  Typography,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as HealthyIcon,
  Warning as DegradedIcon,
  Error as UnhealthyIcon,
  Storage as DatabaseIcon,
  Speed as CacheIcon,
  Email as EmailIcon,
  TrendingUp as MetricsIcon,
} from '@mui/icons-material';

import { DashboardContent } from 'src/layouts/dashboard';

interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  error?: string;
  details?: Record<string, any>;
}

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    email: ServiceHealth;
  };
  uptime: number;
  environment: string;
}

interface Metrics {
  http_requests_total?: number;
  http_request_duration_seconds?: number;
  active_websocket_connections?: number;
  database_query_duration_seconds?: number;
  redis_operation_duration_seconds?: number;
  [key: string]: any;
}

const statusIcons = {
  healthy: <HealthyIcon color="success" />,
  degraded: <DegradedIcon color="warning" />,
  unhealthy: <UnhealthyIcon color="error" />,
};

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  healthy: 'success',
  degraded: 'warning',
  unhealthy: 'error',
  up: 'success',
  down: 'error',
  degraded: 'warning',
};

export default function SystemHealthPage() {
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchHealthData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      setError(null);

      const authTokens = localStorage.getItem('auth_tokens');
      if (!authTokens) {
        setError('Authentication required');
        return;
      }

      const tokens = JSON.parse(authTokens);

      // Fetch health check
      const [healthResponse, metricsResponse] = await Promise.all([
        fetch('/api/health/detailed', {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }),
        fetch('/api/metrics?format=json', {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }),
      ]);

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealth(healthData);
      } else {
        setError('Failed to fetch health data');
      }

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }

      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching system health:', err);
      setError('Failed to load system health data');
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatResponseTime = (ms?: number): string => {
    if (!ms) return 'N/A';
    return `${ms.toFixed(0)}ms`;
  };

  return (
    <DashboardContent>
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              System Health & Monitoring
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monitor application health, services, and performance metrics
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchHealthData}
              disabled={loading}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading && !health ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : health ? (
          <>
            {/* Overall Status */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <Stack spacing={1} alignItems="center">
                      {statusIcons[health.status]}
                      <Typography variant="h6">Overall Status</Typography>
                      <Chip
                        label={health.status.toUpperCase()}
                        color={statusColors[health.status]}
                        size="medium"
                      />
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Stack spacing={1}>
                      <Typography variant="body2" color="text.secondary">
                        Environment
                      </Typography>
                      <Typography variant="h6">{health.environment.toUpperCase()}</Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Stack spacing={1}>
                      <Typography variant="body2" color="text.secondary">
                        Uptime
                      </Typography>
                      <Typography variant="h6">{formatUptime(health.uptime)}</Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Stack spacing={1}>
                      <Typography variant="body2" color="text.secondary">
                        Last Check
                      </Typography>
                      <Typography variant="h6">
                        {new Date(health.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Services Grid */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {/* Database Service */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <DatabaseIcon color="primary" />
                          <Typography variant="h6">Database</Typography>
                        </Stack>
                        <Chip
                          label={health.services.database.status.toUpperCase()}
                          color={statusColors[health.services.database.status]}
                          size="small"
                        />
                      </Stack>

                      <Divider />

                      <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Type
                          </Typography>
                          <Typography variant="body2">
                            {health.services.database.details?.type || 'N/A'}
                          </Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Response Time
                          </Typography>
                          <Typography variant="body2">
                            {formatResponseTime(health.services.database.responseTime)}
                          </Typography>
                        </Stack>
                        {health.services.database.error && (
                          <Alert severity="error" sx={{ mt: 1 }}>
                            {health.services.database.error}
                          </Alert>
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Redis Service */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CacheIcon color="warning" />
                          <Typography variant="h6">Redis Cache</Typography>
                        </Stack>
                        <Chip
                          label={health.services.redis.status.toUpperCase()}
                          color={statusColors[health.services.redis.status]}
                          size="small"
                        />
                      </Stack>

                      <Divider />

                      <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Type
                          </Typography>
                          <Typography variant="body2">
                            {health.services.redis.details?.type || 'N/A'}
                          </Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Response Time
                          </Typography>
                          <Typography variant="body2">
                            {formatResponseTime(health.services.redis.responseTime)}
                          </Typography>
                        </Stack>
                        {health.services.redis.error && (
                          <Alert severity="error" sx={{ mt: 1 }}>
                            {health.services.redis.error}
                          </Alert>
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Email Service */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <EmailIcon color="success" />
                          <Typography variant="h6">Email Service</Typography>
                        </Stack>
                        <Chip
                          label={health.services.email.status.toUpperCase()}
                          color={statusColors[health.services.email.status]}
                          size="small"
                        />
                      </Stack>

                      <Divider />

                      <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Provider
                          </Typography>
                          <Typography variant="body2">
                            {health.services.email.details?.provider || 'N/A'}
                          </Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Configured
                          </Typography>
                          <Typography variant="body2">
                            {health.services.email.details?.configured ? 'Yes' : 'No'}
                          </Typography>
                        </Stack>
                        {health.services.email.details?.warning && (
                          <Alert severity="warning" sx={{ mt: 1 }}>
                            {health.services.email.details.warning}
                          </Alert>
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Performance Metrics */}
            {metrics && (
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
                    <MetricsIcon color="info" />
                    <Typography variant="h6">Performance Metrics</Typography>
                  </Stack>

                  <Grid container spacing={3}>
                    {metrics.http_requests_total !== undefined && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Stack spacing={1}>
                          <Typography variant="body2" color="text.secondary">
                            Total HTTP Requests
                          </Typography>
                          <Typography variant="h5">
                            {metrics.http_requests_total.toLocaleString()}
                          </Typography>
                        </Stack>
                      </Grid>
                    )}

                    {metrics.active_websocket_connections !== undefined && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Stack spacing={1}>
                          <Typography variant="body2" color="text.secondary">
                            Active WebSocket Connections
                          </Typography>
                          <Typography variant="h5">
                            {metrics.active_websocket_connections}
                          </Typography>
                        </Stack>
                      </Grid>
                    )}

                    {metrics.http_request_duration_seconds !== undefined && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Stack spacing={1}>
                          <Typography variant="body2" color="text.secondary">
                            Avg HTTP Response Time
                          </Typography>
                          <Typography variant="h5">
                            {(metrics.http_request_duration_seconds * 1000).toFixed(0)}ms
                          </Typography>
                        </Stack>
                      </Grid>
                    )}

                    {metrics.database_query_duration_seconds !== undefined && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Stack spacing={1}>
                          <Typography variant="body2" color="text.secondary">
                            Avg DB Query Time
                          </Typography>
                          <Typography variant="h5">
                            {(metrics.database_query_duration_seconds * 1000).toFixed(0)}ms
                          </Typography>
                        </Stack>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent>
              <Typography variant="body1" color="text.secondary" align="center">
                Unable to load system health data
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </DashboardContent>
  );
}
