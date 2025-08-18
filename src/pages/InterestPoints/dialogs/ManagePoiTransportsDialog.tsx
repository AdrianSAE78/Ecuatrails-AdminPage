/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/InterestPoints/dialogs/ManagePoiTransportsDialog.tsx
import * as React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, IconButton, List, ListItem,
  ListItemText, ListItemSecondaryAction, Checkbox, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPoiTransports, addPoiTransport, removePoiTransport, updatePoiTransport } from '../../../api/interestPoints';
import { searchTransports } from '../../../api/transport';
import type { TransportItemPOI } from '../../../types/Transport';

function EditLinkDialog({
  open, values, onClose, onSave, saving,
}: {
  open: boolean;
  values: { walkingDistanceMeters?: number | null; estimatedWalkingTime?: number | null; accessibilityNotes?: string | null; status: boolean };
  onClose: () => void;
  onSave: (v: { walkingDistanceMeters?: number; estimatedWalkingTime?: number; accessibilityNotes?: string; status: boolean }) => void;
  saving?: boolean;
}) {
  const [walkingDistanceMeters, setWalkingDistanceMeters] = React.useState<number | ''>(values.walkingDistanceMeters ?? '');
  const [estimatedWalkingTime, setEstimatedWalkingTime] = React.useState<number | ''>(values.estimatedWalkingTime ?? '');
  const [accessibilityNotes, setAccessibilityNotes] = React.useState<string>(values.accessibilityNotes ?? '');
  const [status, setStatus] = React.useState<boolean>(!!values.status);

  React.useEffect(() => {
    setWalkingDistanceMeters(values.walkingDistanceMeters ?? '');
    setEstimatedWalkingTime(values.estimatedWalkingTime ?? '');
    setAccessibilityNotes(values.accessibilityNotes ?? '');
    setStatus(!!values.status);
  }, [values, open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Editar vínculo</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Distancia a pie (m)"
            type="number"
            value={walkingDistanceMeters}
            onChange={(e) => setWalkingDistanceMeters(e.target.value === '' ? '' : Number(e.target.value))}
          />
          <TextField
            label="Tiempo estimado (min)"
            type="number"
            value={estimatedWalkingTime}
            onChange={(e) => setEstimatedWalkingTime(e.target.value === '' ? '' : Number(e.target.value))}
          />
          <TextField
            label="Notas de accesibilidad"
            value={accessibilityNotes}
            onChange={(e) => setAccessibilityNotes(e.target.value)}
            multiline
            minRows={2}
          />
          <Stack direction="row" spacing={1} alignItems="center">
            <Checkbox checked={status} onChange={(e) => setStatus(e.target.checked)} />
            Estado activo
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          disabled={saving}
          onClick={() => onSave({
            walkingDistanceMeters: (walkingDistanceMeters === '' ? undefined : Number(walkingDistanceMeters)),
            estimatedWalkingTime: (estimatedWalkingTime === '' ? undefined : Number(estimatedWalkingTime)),
            accessibilityNotes,
            status,
          })}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ManagePoiTransportsDialog({
  poiId, open, onClose,
}: { poiId: number; open: boolean; onClose: () => void; }) {
  const qc = useQueryClient();

  // vínculos existentes
  const { data: links, isLoading } = useQuery({
    enabled: open,
    queryKey: ['poi-transports', poiId],
    queryFn: () => getPoiTransports(poiId),
  });

  // búsqueda de transportes para agregar
  const [q, setQ] = React.useState('');
  const { data: results } = useQuery({
    enabled: open && q.trim().length >= 2,
    queryKey: ['transport-search', q],
    queryFn: () => searchTransports({ q, size: 8 }),
  });

  const addM = useMutation({
    mutationFn: (transportId: number) => addPoiTransport(poiId, { transportId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['poi-transports', poiId] }),
  });

  const delM = useMutation({
    mutationFn: (linkId: number) => removePoiTransport(poiId, linkId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['poi-transports', poiId] }),
  });

  const updM = useMutation({
    mutationFn: ({ linkId, payload }: { linkId: number; payload: any }) => updatePoiTransport(poiId, linkId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['poi-transports', poiId] }),
  });

  const [editing, setEditing] = React.useState<null | { id: number; values: { walkingDistanceMeters?: number | null; estimatedWalkingTime?: number | null; accessibilityNotes?: string | null; status: boolean } }>(null);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Transportes cercanos al POI</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField
              label="Buscar transportes"
              placeholder="Mín. 2 caracteres"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              fullWidth
              InputProps={{ startAdornment: <DirectionsBusIcon fontSize="small" /> }}
            />
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {(results ?? []).map((t: TransportItemPOI) => (
                <Button
                  key={t.id}
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => addM.mutate(Number(t.id))}
                  disabled={addM.isPending}
                >
                  {t.name} - {t.route}
                </Button>
              ))}
            </Stack>
          </Stack>

          <List dense>
            {(links ?? []).map((link) => (
              <ListItem key={link.id} divider>
                <ListItemText
                  primary={link.transportName ?? `(ID ${link.transportId})`}
                  secondary={[
                    link.walkingDistanceMeters != null ? `Distancia: ${link.walkingDistanceMeters} m` : null,
                    link.estimatedWalkingTime != null ? `Tiempo: ${link.estimatedWalkingTime} min` : null,
                    link.status ? 'Activo' : 'Inactivo',
                    link.accessibilityNotes ? `Notas: ${link.accessibilityNotes}` : null,
                  ].filter(Boolean).join(' • ')}
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Editar">
                    <IconButton size="small" onClick={() => setEditing({
                      id: link.id,
                      values: {
                        walkingDistanceMeters: link.walkingDistanceMeters ?? undefined,
                        estimatedWalkingTime: link.estimatedWalkingTime ?? undefined,
                        accessibilityNotes: link.accessibilityNotes ?? '',
                        status: link.status,
                      },
                    })}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Quitar">
                    <IconButton size="small" color="error" onClick={() => delM.mutate(link.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            {isLoading && <ListItem><ListItemText primary="Cargando…" /></ListItem>}
            {!isLoading && (links ?? []).length === 0 && <ListItem><ListItemText primary="Sin transportes vinculados" /></ListItem>}
          </List>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>

      <EditLinkDialog
        open={!!editing}
        values={editing?.values ?? { status: true }}
        onClose={() => setEditing(null)}
        saving={updM.isPending}
        onSave={(vals) => {
          if (!editing) return;
          updM.mutate({ linkId: editing.id, payload: vals }, { onSuccess: () => setEditing(null) });
        }}
      />
    </Dialog>
  );
}
