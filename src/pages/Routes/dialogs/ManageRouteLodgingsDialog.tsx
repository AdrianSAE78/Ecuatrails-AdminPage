/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getRouteLodgings, addRouteLodging, removeRouteLodging } from '../../../api/routes';
import { listLodgings } from '../../../api/lodgings';

export default function ManageRouteLodgingsDialog({ routeId, open, onClose }: { routeId: number; open: boolean; onClose: () => void; }) {
  const qc = useQueryClient();
  const { data: links, isLoading } = useQuery({
    enabled: open,
    queryKey: ['route-lodgings', routeId],
    queryFn: () => getRouteLodgings(routeId),
  });

  const [search, setSearch] = React.useState('');
  const { data: searchRes } = useQuery({
    enabled: open && search.length >= 2,
    queryKey: ['lodgings-search', search],
    queryFn: () => listLodgings({ q: search, size: 10 }), // devuelve { content: [], totalElements, ... }
  });

  const addM = useMutation({
    mutationFn: (lodgingId: number) => addRouteLodging(routeId, { lodgingId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['route-lodgings', routeId] }),
  });

  const delM = useMutation({
    mutationFn: (routeLodgingId: number) => removeRouteLodging(routeId, routeLodgingId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['route-lodgings', routeId] }),
  });

  const usedLodgingIds = new Set((links ?? []).map(l => l.lodgingId));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Alojamientos de la ruta</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField
              label="Buscar alojamientos"
              placeholder="Mín. 2 caracteres"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
            />
            <Stack direction="row" spacing={1}>
              {(searchRes?.content ?? [])
                .filter((r: any) => !usedLodgingIds.has(r.id))
                .map((r: any) => (
                  <Button key={r.id} variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => addM.mutate(Number(r.id))}>
                    {r.name}
                  </Button>
                ))}
            </Stack>
          </Stack>

          <List dense>
            {(links ?? []).map((link) => (
              <ListItem key={link.id} divider>
                <ListItemText primary={link.lodgingName} secondary={`linkId=${link.id} • lodgingId=${link.lodgingId}`} />
                <ListItemSecondaryAction>
                  <IconButton size="small" color="error" onClick={() => delM.mutate(link.id)}><DeleteIcon fontSize="small" /></IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            {isLoading && <ListItem><ListItemText primary="Cargando…" /></ListItem>}
            {!isLoading && (links ?? []).length === 0 && <ListItem><ListItemText primary="Sin alojamientos" /></ListItem>}
          </List>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
