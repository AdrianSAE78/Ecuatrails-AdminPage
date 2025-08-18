/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQueries } from '@tanstack/react-query';
import { Card, CardContent, Grid, Stack, Typography, LinearProgress, Divider } from '@mui/material';
import {
  getCategoryCount, getLodgingTotals, getPoiTotals, getRouteTotals, getTransportTotals
} from '../../api/dashboard';

function StatCard({ title, total, active, inactive }: { title: string; total: number; active?: number; inactive?: number }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="overline" color="text.secondary">{title}</Typography>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
          <Typography variant="h4">{total ?? 0}</Typography>
          {(active != null && inactive != null) && (
            <Typography variant="caption" color="text.secondary">
              Activos {active} · Inactivos {inactive}
            </Typography>
          )}
        </Stack>
        {(active != null && inactive != null && total > 0) && (
          <>
            <Divider sx={{ my: 1 }} />
            <LinearProgress
              variant="determinate"
              value={Math.min(100, Math.round((active / total) * 100))}
            />
            <Typography variant="caption" color="text.secondary">
              {Math.round((active / total) * 100)}% activos
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const results = useQueries({
    queries: [
      { queryKey: ['kpi', 'pois'], queryFn: getPoiTotals },
      { queryKey: ['kpi', 'lodgings'], queryFn: getLodgingTotals },
      { queryKey: ['kpi', 'routes'], queryFn: getRouteTotals },
      { queryKey: ['kpi', 'transport'], queryFn: getTransportTotals },
      { queryKey: ['kpi', 'categories'], queryFn: getCategoryCount },
    ],
  });

  const loading = results.some(r => r.isLoading);
  const [pois, lodgings, routes, transport, categories] = results.map(r => r.data as any);

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Dashboard</Typography>
      {loading && <LinearProgress />}

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}><StatCard title="POIs" total={pois?.total ?? 0} active={pois?.active ?? 0} inactive={pois?.inactive ?? 0} /></Grid>
        <Grid item xs={12} sm={6} md={4}><StatCard title="Alojamientos" total={lodgings?.total ?? 0} active={lodgings?.active ?? 0} inactive={lodgings?.inactive ?? 0} /></Grid>
        <Grid item xs={12} sm={6} md={4}><StatCard title="Rutas" total={routes?.total ?? 0} active={routes?.active ?? 0} inactive={routes?.inactive ?? 0} /></Grid>
        <Grid item xs={12} sm={6} md={4}><StatCard title="Transporte" total={transport?.total ?? 0} active={transport?.active ?? 0} inactive={transport?.inactive ?? 0} /></Grid>
        <Grid item xs={12} sm={6} md={4}><StatCard title="Categorías" total={categories ?? 0} /></Grid>
      </Grid>
    </Stack>
  );
}
