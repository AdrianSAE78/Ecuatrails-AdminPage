/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/Transport/TransportPage.tsx
import * as React from 'react';
import {
  Button, Card, CardContent, Divider, IconButton, InputAdornment, MenuItem, Snackbar, Alert,
  Stack, TextField, Typography,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import AddIcon from '@mui/icons-material/Add';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { listTransport, createTransport, updateTransport, deleteTransport } from '../../api/transport';
import type { TransportCreate, TransportItem } from '../../types/Transport';
import TransportForm from '../../components/TransportForm';
import LinkToPoiDialog from './LinkToPoiDialog';

export default function TransportPage() {
  const qc = useQueryClient();

  // filtros
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(10);
  const [q, setQ] = React.useState('');
  const [type, setType] = React.useState<'ALL' | string>('ALL');
  const [status, setStatus] = React.useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['transport', { page, size, q, type, status }],
    queryFn: () => listTransport({ page, size, q: q || undefined, type, status }),
    keepPreviousData: true,
  });

  const createM = useMutation({
    mutationFn: (body: TransportCreate) => createTransport(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transport'] }),
  });

  const updateM = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<TransportCreate> }) => updateTransport(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transport'] }),
  });

  const deleteM = useMutation({
    mutationFn: (id: number) => deleteTransport(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transport'] }),
  });

  const [openForm, setOpenForm] = React.useState(false);
  const [editRow, setEditRow] = React.useState<TransportItem | null>(null);
  const [toast, setToast] = React.useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [linkDialogFor, setLinkDialogFor] = React.useState<number | null>(null);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'type', headerName: 'Tipo', width: 120 },
    { field: 'name', headerName: 'Nombre', flex: 1, minWidth: 200 },
    { field: 'route', headerName: 'Ruta/Línea', width: 140 },
    { field: 'schedule', headerName: 'Horario', width: 140 },
    { field: 'baseFare', headerName: 'Tarifa base', width: 120, valueFormatter: (v) => (v.value ?? '') },
    { field: 'status', headerName: 'Estado', width: 110 },
    {
      field: 'actions', headerName: 'Acciones', width: 170, sortable: false, renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <IconButton size="small" title="Vincular a POI" onClick={() => setLinkDialogFor(params.row.id)}><LinkIcon /></IconButton>
          <IconButton size="small" title="Editar" onClick={() => { setEditRow(params.row); setOpenForm(true); }}><EditIcon /></IconButton>
          <IconButton size="small" title="Eliminar" color="error" onClick={() => onAskDelete(params.row)}><DeleteIcon /></IconButton>
        </Stack>
      )
    },
  ];

  const onAskDelete = (row: TransportItem) => {
    if (!confirm(`¿Eliminar el transporte "${row.name}"?`)) return;
    deleteM.mutate(row.id, {
      onError: (e: any) => setToast({ type: 'error', msg: e?.response?.data?.message || 'No se pudo eliminar' }),
    });
  };

  const onSubmitForm = async (values: TransportCreate) => {
    try {
      if (editRow) {
        await updateM.mutateAsync({ id: editRow.id, body: values });
      } else {
        await createM.mutateAsync(values);
      }
      setOpenForm(false);
      setEditRow(null);
      setToast({ type: 'success', msg: 'Guardado correctamente' });
    } catch (e: any) {
      setToast({ type: 'error', msg: e?.response?.data?.message || 'Error al guardar' });
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Transporte</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditRow(null); setOpenForm(true); }}>
          Nuevo
        </Button>
      </Stack>

      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              placeholder="Buscar..."
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(0); }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
              fullWidth
            />
            <TextField select label="Tipo" value={type} onChange={(e) => { setType(e.target.value as any); setPage(0); }} sx={{ minWidth: 160 }}>
              <MenuItem value="ALL">Todos</MenuItem>
              <MenuItem value="BUS">BUS</MenuItem>
              <MenuItem value="TAXI">TAXI</MenuItem>
              <MenuItem value="METRO">METRO</MenuItem>
              <MenuItem value="CABLECAR">CABLECAR</MenuItem>
              <MenuItem value="BIKE">BIKE</MenuItem>
            </TextField>
            <TextField select label="Estado" value={status} onChange={(e) => { setStatus(e.target.value as any); setPage(0); }} sx={{ minWidth: 160 }}>
              <MenuItem value="ALL">Todos</MenuItem>
              <MenuItem value="ACTIVE">Activos</MenuItem>
              <MenuItem value="INACTIVE">Inactivos</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
        <Divider />
        <div style={{ height: 560 }}>
          <DataGrid
            rows={data?.records ?? []}
            columns={columns}
            getRowId={(r) => r.id}
            loading={isLoading || isFetching}
            paginationMode="server"
            rowCount={data?.total ?? 0}
            pageSizeOptions={[5, 10, 20, 50]}
            paginationModel={{ pageSize: size, page }}
            onPaginationModelChange={(m) => { setPage(m.page); setSize(m.pageSize); }}
            disableRowSelectionOnClick
          />
        </div>
      </Card>

      <TransportForm
        open={openForm}
        title={editRow ? 'Editar transporte' : 'Nuevo transporte'}
        initialValues={editRow ?? undefined}
        onClose={() => { setOpenForm(false); setEditRow(null); }}
        onSubmit={onSubmitForm}
        loading={createM.isPending || updateM.isPending}
      />

      <LinkToPoiDialog
        transportId={linkDialogFor ?? 0}
        open={linkDialogFor != null}
        onClose={() => setLinkDialogFor(null)}
        onLinked={() => setToast({ type: 'success', msg: 'Vinculado al POI' })}
      />

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)}>
        {toast ? <Alert severity={toast.type}>{toast.msg}</Alert> : undefined}
      </Snackbar>
    </Stack>
  );
}
