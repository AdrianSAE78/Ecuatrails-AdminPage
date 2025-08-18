// src/pages/Transport/LinkToPoiDialog.tsx
import * as React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, MenuItem,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { listInterestPoints } from '../../api/interestPoints';
import { linkTransportToPoi } from '../../api/transport';

export default function LinkToPoiDialog({
  transportId, open, onClose, onLinked,
}: {
  transportId: number;
  open: boolean;
  onClose: () => void;
  onLinked: () => void; // para refrescar POIs en su página si luego haces un gestor específico
}) {
  const [q, setQ] = React.useState('');
  const [poiId, setPoiId] = React.useState<number | ''>('');
  const [distance, setDistance] = React.useState<number | ''>('');
  const [time, setTime] = React.useState<number | ''>('');
  const [accessNotes, setAccessNotes] = React.useState('');

  const { data } = useQuery({
    enabled: open && q.length >= 2,
    queryKey: ['poi-search-for-transport', q],
    queryFn: () => listInterestPoints({ q, size: 20 }),
  });

  const pois = data?.rows ?? [];

  const onSubmit = async () => {
    if (!poiId) return;
    await linkTransportToPoi(Number(poiId), {
      transportId,
      walkingDistanceMeters: distance === '' ? undefined : Number(distance),
      walkingTimeMinutes: time === '' ? undefined : Number(time),
      accessibilityNotes: accessNotes || undefined,
    });
    onLinked();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Vincular transporte a POI</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mt={1}>
          <TextField label="Buscar POI (mín. 2)" value={q} onChange={(e) => setQ(e.target.value)} />
          <TextField select label="POI" value={poiId} onChange={(e) => setPoiId(e.target.value === '' ? '' : Number(e.target.value))}>
            <MenuItem value="">Selecciona…</MenuItem>
            {pois.map((p) => <MenuItem key={p.id} value={Number(p.id)}>{p.name}</MenuItem>)}
          </TextField>
          <TextField label="Distancia a pie (m)" type="number" value={distance} onChange={(e) => setDistance(e.target.value === '' ? '' : Number(e.target.value))} />
          <TextField label="Tiempo a pie (min)" type="number" value={time} onChange={(e) => setTime(e.target.value === '' ? '' : Number(e.target.value))} />
          <TextField label="Notas de accesibilidad" value={accessNotes} onChange={(e) => setAccessNotes(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={onSubmit} variant="contained">Vincular</Button>
      </DialogActions>
    </Dialog>
  );
}
