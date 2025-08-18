/* eslint-disable @typescript-eslint/no-explicit-any */
import MoreVertIcon from '@mui/icons-material/MoreVert';
import * as React from 'react';
import {
    Button, Card, CardContent, Divider, IconButton, InputAdornment, MenuItem, Stack, TextField, Typography, Snackbar, Alert,
    ListItemText,
    ListItemIcon,
    Menu
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import HotelIcon from '@mui/icons-material/Hotel';
import AddIcon from '@mui/icons-material/Add';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { listRoutes, createRoute, updateRoute, deleteRoute } from '../../api/routes';
import { listAllCategories } from '../../api/categories';
import type { RouteItem, RouteCreate } from '../../types/Routes';
import RouteForm from '../../components/RouteForm';
import ManageRoutePoisDialog from './dialogs/ManageRoutePoisDialog';
import ManageRouteLodgingsDialog from './dialogs/ManageRouteLodgingsDialog';
import ImageIcon from '@mui/icons-material/Image';
import ImageManager from '../../components/ImageManager';

export default function RoutesPage() {
    const qc = useQueryClient();

    // filtros
    const [page, setPage] = React.useState(0);
    const [size, setSize] = React.useState(10);
    const [q, setQ] = React.useState('');
    const [status, setStatus] = React.useState<boolean | null>(null);
    const [categoryId, setCategoryId] = React.useState<number | ''>('');
    const [openImagesForRoute, setOpenImagesForRoute] = React.useState<number | null>(null);

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['routes', { page, size, q, status, categoryId }],
        queryFn: () => listRoutes({ page, size, q: q || undefined, status, categoryId }),
        keepPreviousData: true,
    });

    const { data: categories } = useQuery({
        queryKey: ['categories-all'],
        queryFn: () => listAllCategories(),
    });

    const createM = useMutation({
        mutationFn: (body: RouteCreate) => createRoute(body),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['routes'] }),
    });

    const updateM = useMutation({
        mutationFn: ({ id, body }: { id: number; body: Partial<RouteCreate> }) => updateRoute(id, body),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['routes'] }),
    });

    const deleteM = useMutation({
        mutationFn: (id: number) => deleteRoute(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['routes'] }),
    });

    const [openForm, setOpenForm] = React.useState(false);
    const [editRow, setEditRow] = React.useState<RouteItem | null>(null);
    const [openPois, setOpenPois] = React.useState<number | null>(null);
    const [openLodgings, setOpenLodgings] = React.useState<number | null>(null);
    const [toast, setToast] = React.useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    const onSubmitForm = async (values: RouteCreate) => {
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

    const onAskDelete = (row: RouteItem) => {
        if (!confirm(`¿Eliminar la ruta "${row.name}"?`)) return;
        deleteM.mutate(row.id, {
            onError: (e: any) => setToast({ type: 'error', msg: e?.response?.data?.message || 'No se pudo eliminar' }),
        });
    };

    const ActionsMenu = ({ row, onOpenImages, onOpenPois, onOpenLodgings, onEdit, onDelete }: any) => {
        const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
        const open = Boolean(anchorEl);
        const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
        const handleClose = () => setAnchorEl(null);

        return (
            <>
                {/* Deja 1-2 botones "rápidos" visibles si quieres */}
                {/* <IconButton size="small" title="Imágenes" onClick={() => onOpenImages(row.id)}><ImageIcon /></IconButton> */}

                {/* Botón kebab */}
                <IconButton size="small" onClick={handleOpen}>
                    <MoreVertIcon fontSize="small" />
                </IconButton>

                <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                    <MenuItem onClick={() => { handleClose(); onOpenPois(row.id); }}>
                        <ListItemIcon><AltRouteIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>POIs</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => { handleClose(); onOpenLodgings(row.id); }}>
                        <ListItemIcon><HotelIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Alojamientos</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => { handleClose(); onOpenImages(row.id); }}>
                        <ListItemIcon><ImageIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Imágenes</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => { handleClose(); onEdit(row); }}>
                        <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Editar</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => { handleClose(); onDelete(row); }}>
                        <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                        <ListItemText primaryTypographyProps={{ color: 'error' }}>Eliminar</ListItemText>
                    </MenuItem>
                </Menu>
            </>
        );
    };

    const columns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 80 },
        { field: 'name', headerName: 'Nombre', flex: 1, minWidth: 200 },
        { field: 'categoryName', headerName: 'Categoría', width: 160 },
        { field: 'distanceKm', headerName: 'Dist. (km)', width: 120 },
        { field: 'difficulty', headerName: 'Dificultad', width: 120 },
        { field: 'status', headerName: 'Estado', width: 110 },
        {
            field: 'actions',
            headerName: 'Acciones',
            width: 100,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <ActionsMenu
                    row={params.row}
                    onOpenImages={(id: number) => setOpenImagesForRoute(id)}
                    onOpenPois={(id: number) => setOpenPois(id)}
                    onOpenLodgings={(id: number) => setOpenLodgings(id)}
                    onEdit={(row: any) => { setEditRow(row); setOpenForm(true); }}
                    onDelete={(row: any) => onAskDelete(row)}
                />
            ),
        },
    ];

    return (
        <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h5">Rutas</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditRow(null); setOpenForm(true); }}>
                    Nueva ruta
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
                        <TextField
                            select
                            label="Estado"
                            value={status === null ? 'ALL' : status ? 'ACTIVE' : 'INACTIVE'}
                            onChange={(e) => {
                                const v = e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE';
                                setStatus(v === 'ALL' ? null : v === 'ACTIVE');
                                setPage(0);
                            }}
                            sx={{ minWidth: 160 }}
                        >
                            <MenuItem value="ALL">Todos</MenuItem>
                            <MenuItem value="ACTIVE">Activos</MenuItem>
                            <MenuItem value="INACTIVE">Inactivos</MenuItem>
                        </TextField>
                        <TextField select label="Categoría" value={categoryId} onChange={(e) => { setCategoryId(e.target.value === '' ? '' : Number(e.target.value)); setPage(0); }} sx={{ minWidth: 220 }}>
                            <MenuItem value="">Todas</MenuItem>
                            {(categories ?? []).map((c) => (
                                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                            ))}
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

            {/* Crear/Editar */}
            <RouteForm
                open={openForm}
                initialValues={editRow ? {
                    name: editRow.name,
                    description: editRow.description ?? '',
                    distanceKm: editRow.distanceKm ?? undefined,
                    difficulty: editRow.difficulty ?? 'MEDIUM',
                    status: editRow.status ?? 'ACTIVE',
                    categoryId: editRow.categoryId ?? undefined,
                } : undefined}
                title={editRow ? 'Editar ruta' : 'Nueva ruta'}
                categories={categories ?? []}
                onClose={() => { setOpenForm(false); setEditRow(null); }}
                onSubmit={onSubmitForm}
                loading={createM.isPending || updateM.isPending}
            />

            {/* Gestores de vínculos */}
            <ManageRoutePoisDialog routeId={openPois ?? 0} open={openPois != null} onClose={() => setOpenPois(null)} />
            <ManageRouteLodgingsDialog routeId={openLodgings ?? 0} open={openLodgings != null} onClose={() => setOpenLodgings(null)} />

            <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)}>
                {toast ? <Alert severity={toast.type}>{toast.msg}</Alert> : undefined}
            </Snackbar>
            <ImageManager
                entity="route"
                entityId={openImagesForRoute ?? 0}
                open={openImagesForRoute != null}
                onClose={() => setOpenImagesForRoute(null)}
                title="Imágenes de la ruta"
            />
        </Stack>
    );
}
