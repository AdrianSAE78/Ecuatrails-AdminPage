/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/Routes/dialogs/ManageRoutePoisDialog.tsx
import * as React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getRoutePois, addRoutePoi, removeRoutePoi, reorderRoutePois } from '../../../api/routes';
import { listInterestPoints } from '../../../api/interestPoints';

export default function ManageRoutePoisDialog({ routeId, open, onClose }: { routeId: number; open: boolean; onClose: () => void; }) {
  const qc = useQueryClient();
  const { data: pois, isLoading } = useQuery({
    enabled: open,
    queryKey: ['route-pois', routeId],
    queryFn: () => getRoutePois(routeId),
  });

  const [search, setSearch] = React.useState('');
  const { data: searchRes } = useQuery({
    enabled: open && search.length >= 2,
    queryKey: ['poi-search', search],
    queryFn: () => listInterestPoints({ q: search, size: 10 }),
  });

  const addM = useMutation({
    mutationFn: (interestPointId: number) => addRoutePoi(routeId, { interestPointId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['route-pois', routeId] }),
  });

  const delM = useMutation({
    mutationFn: (routeInterestPointId: number) => removeRoutePoi(routeId, routeInterestPointId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['route-pois', routeId] }),
  });

  const reorderM = useMutation({
    mutationFn: (orderedIds: number[]) => reorderRoutePois(routeId, orderedIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['route-pois', routeId] }),
  });

  const move = (index: number, dir: -1 | 1) => {
    if (!pois) return;
    const arr = [...pois].sort((a, b) => a.position - b.position);
    const i2 = index + dir;
    if (i2 < 0 || i2 >= arr.length) return;
    const tmp = arr[index]; arr[index] = arr[i2]; arr[i2] = tmp;
    const orderedIds = arr.map((x) => x.id);
    reorderM.mutate(orderedIds);
  };

  const currentIds = new Set((pois ?? []).map(p => p.interestPointId));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>POIs de la ruta</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField
              label="Buscar POIs"
              placeholder="Mín. 2 caracteres"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
            />
            <Stack direction="row" spacing={1}>
              {(searchRes?.rows ?? [])
                .filter((r: any) => !currentIds.has(r.id))
                .map((r: any) => (
                  <Button key={r.id} variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => addM.mutate(Number(r.id))}>
                    {r.name}
                  </Button>
                ))}
            </Stack>
          </Stack>

          <List dense>
            {(pois ?? []).sort((a, b) => a.position - b.position).map((link, idx) => (
              <ListItem key={link.id} divider>
                <ListItemText
                  primary={`${link.position}. ${link.interestPointName}`}
                  secondary={`linkId=${link.id} • poiId=${link.interestPointId}`}
                />
                <ListItemSecondaryAction>
                  <IconButton size="small" onClick={() => move(idx, -1)}><ArrowUpwardIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => move(idx, +1)}><ArrowDownwardIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => delM.mutate(link.id)}><DeleteIcon fontSize="small" /></IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            {isLoading && <ListItem><ListItemText primary="Cargando…" /></ListItem>}
            {!isLoading && (pois ?? []).length === 0 && <ListItem><ListItemText primary="Sin POIs" /></ListItem>}
          </List>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
