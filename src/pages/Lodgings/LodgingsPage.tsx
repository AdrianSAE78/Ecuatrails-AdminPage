/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { useLodgings, useCreateLodging, useUpdateLodging, useDeleteLodging } from '../../api/lodgings';
import type { LodgingFormValues } from '../../components/LodgingForm';
import LodgingForm from '../../components/LodgingForm';
import {
    Box, Button, Card, CardContent, Divider, IconButton, InputAdornment, MenuItem, Pagination, Stack, TextField, Tooltip, Typography,
    Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ImageIcon from '@mui/icons-material/Image';
import ImageManager from '../../components/ImageManager';

export default function LodgingsPage() {
    const [page, setPage] = React.useState(0);
    const [size, setSize] = React.useState(10);
    const [q, setQ] = React.useState('');
    const [status, setStatus] = React.useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
    const [minPrice, setMinPrice] = React.useState<number | ''>('');
    const [maxPrice, setMaxPrice] = React.useState<number | ''>('');
    const [openImagesForLodging, setOpenImagesForLodging] = React.useState<number | null>(null);

    const { data, isLoading, isFetching, refetch } = useLodgings({
        page, size, q: q || undefined,
        status: status === 'ALL' ? undefined : status === 'ACTIVE',
        minPrice: minPrice === '' ? undefined : Number(minPrice),
        maxPrice: maxPrice === '' ? undefined : Number(maxPrice),
    });

    const createM = useCreateLodging();
    const updateM = useUpdateLodging();
    const deleteM = useDeleteLodging();

    const [openForm, setOpenForm] = React.useState(false);
    const [editRow, setEditRow] = React.useState<any | null>(null);

    const [confirmDeleteId, setConfirmDeleteId] = React.useState<number | null>(null);
    const [confirmDeleteMsg, setConfirmDeleteMsg] = React.useState<string>('');

    const columns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 80 },
        { field: 'name', headerName: 'Nombre', flex: 1, minWidth: 200 },
        { field: 'description', headerName: 'Descripción', flex: 1, minWidth: 200 },
        { field: 'approximatePrice', headerName: 'Precio (USD)', width: 130, valueFormatter: (v?: any) => (v?.value ?? '') },
        { field: 'status', headerName: 'Estado', width: 110, valueFormatter: (v?: any) => (v?.value ? 'Activo' : 'Inactivo') },
        {
            field: 'images', headerName: 'Imágenes', width: 110, sortable: false,
            renderCell: (params) => (
                <IconButton size="small" title="Imágenes" onClick={() => setOpenImagesForLodging(params.row.id)}>
                    <ImageIcon />
                </IconButton>
            )
        },
        {
            field: 'actions', headerName: 'Acciones', width: 120, sortable: false, renderCell: (params) => (
                <Stack direction="row" spacing={1}>
                    <Tooltip title="Editar">
                        <IconButton onClick={() => { setEditRow(params.row); setOpenForm(true); }} size="small"><EditIcon /></IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                        <IconButton onClick={() => onAskDelete(params.row)} color="error" size="small"><DeleteIcon /></IconButton>
                    </Tooltip>
                </Stack>
            )
        },
    ];

    const onAskDelete = (row: any) => {
        setConfirmDeleteId(row.id);
        setConfirmDeleteMsg(`¿Eliminar "${row.name}"?`);
    };

    const onConfirmDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            await deleteM.mutateAsync(confirmDeleteId);
            setConfirmDeleteId(null);
        } catch (e: any) {
            // 409: "En uso por rutas" (lo define tu backend)
            const msg = e?.response?.status === 409
                ? 'No se puede eliminar: el alojamiento está en uso por rutas.'
                : (e?.response?.data?.message || 'Error al eliminar');
            setConfirmDeleteMsg(msg);
        }
    };

    const onSubmitForm = async (values: LodgingFormValues) => {
        try {
            if (editRow) {
                await updateM.mutateAsync({ id: editRow.id, body: values });
            } else {
                await createM.mutateAsync(values);
            }
            setOpenForm(false);
            setEditRow(null);
        } catch (e: any) {
            // Muestra errores simples; si quieres, mapea por campo
            alert(e?.response?.data?.message || 'Error al guardar');
        }
    };

    return (
        <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h5">Alojamientos</Typography>
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
                            onChange={(e) => setQ(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                            fullWidth
                        />
                        <TextField select label="Estado" value={status} onChange={(e) => setStatus(e.target.value as any)} sx={{ minWidth: 160 }}>
                            <MenuItem value="ALL">Todos</MenuItem>
                            <MenuItem value="ACTIVE">Activos</MenuItem>
                            <MenuItem value="INACTIVE">Inactivos</MenuItem>
                        </TextField>
                        <TextField label="Precio mín." type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))} />
                        <TextField label="Precio máx." type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))} />
                        <Button variant="outlined" onClick={() => refetch()}>Filtrar</Button>
                    </Stack>
                </CardContent>
                <Divider />
                <Box sx={{ height: 520 }}>
                    <DataGrid
                        rows={data?.content ?? []}
                        columns={columns}
                        getRowId={(r) => r.id}
                        loading={isLoading || isFetching}
                        paginationMode="server"
                        rowCount={data?.totalElements ?? 0}
                        pageSizeOptions={[5, 10, 20, 50]}
                        paginationModel={{ pageSize: size, page }}
                        onPaginationModelChange={(m) => { setPage(m.page); setSize(m.pageSize); }}
                        disableRowSelectionOnClick
                    />
                </Box>
                <Stack direction="row" justifyContent="flex-end" p={2}>
                    <Pagination
                        page={(page ?? 0) + 1}
                        count={data?.totalPages ?? 0}
                        onChange={(_e, p) => setPage(p - 1)}
                    />
                </Stack>
            </Card>

            <LodgingForm
                open={openForm}
                title={editRow ? 'Editar alojamiento' : 'Nuevo alojamiento'}
                initialValues={editRow ?? undefined}
                onClose={() => { setOpenForm(false); setEditRow(null); }}
                onSubmit={onSubmitForm}
                loading={createM.isPending || updateM.isPending}
            />

            <Dialog open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)}>
                <DialogTitle>Eliminar</DialogTitle>
                <DialogContent>{confirmDeleteMsg}</DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDeleteId(null)}>Cancelar</Button>
                    <Button onClick={onConfirmDelete} color="error" variant="contained" disabled={deleteM.isPending}>Eliminar</Button>
                </DialogActions>
            </Dialog>
            <ImageManager
                entity="lodging"
                entityId={openImagesForLodging ?? 0}
                open={openImagesForLodging != null}
                onClose={() => setOpenImagesForLodging(null)}
                title="Imágenes del alojamiento"
            />
        </Stack>
    );
}
