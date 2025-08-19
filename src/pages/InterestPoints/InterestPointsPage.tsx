/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from 'react';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import {
    Alert,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Pagination,
    Paper,
    Select,
    Stack,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    createInterestPoint,
    deleteInterestPoint,
    geocodeInterestPoint,
    listInterestPoints,
    updateInterestPoint,
    updateInterestPointStatus,
    type InterestPoint,
    type Status,
} from '../../api/interestPoints';
import ImageIcon from '@mui/icons-material/Image';
import ImageManager from '../../components/ImageManager';
import ManagePoiTransportsDialog from './dialogs/ManagePoiTransportsDialog';
import React from 'react';

const schema = z.object({
    name: z.string().min(1, 'Nombre requerido').max(128, 'Máx 128'),
    city: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    latitude: z.preprocess((v) => (v === '' ? undefined : v), z.number().optional()),
    longitude: z.preprocess((v) => (v === '' ? undefined : v), z.number().optional()),
    status: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

// Función helper para limpiar valores vacíos
function cleanFormValues(values: FormValues): FormValues {
    return {
        ...values,
        city: values.city?.trim() || undefined,
        address: values.address?.trim() || undefined,
    };
}

export default function InterestPointsPage() {
    const qc = useQueryClient();

    const [q, setQ] = useState('');
    const [status, setStatus] = useState<null | Status>(null);
    const [page, setPage] = useState(1);
    const [size] = useState(10);
    const [openTransportsForPoi, setOpenTransportsForPoi] = useState<number | null>(null);

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['interest-points', { page, size, q, status }],
        queryFn: () => listInterestPoints({ page: page - 1, size, q, status }),
        keepPreviousData: true,
    });
    
    const [openImagesForPoi, setOpenImagesForPoi] = useState<number | null>(null);

    const rows = data?.rows ?? [];
    const total = data?.total ?? rows.length;
    const pageCount = Math.max(1, Math.ceil(total / size));

    const [open, setOpen] = useState<null | { mode: 'create' } | { mode: 'edit'; row: InterestPoint }>(null);
    const [confirmDelete, setConfirmDelete] = useState<null | InterestPoint>(null);

    const createMut = useMutation({
        mutationFn: (values: FormValues) => {
            const cleanedValues = cleanFormValues(values);
            return createInterestPoint(cleanedValues);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['interest-points'] }),
    });

    const updateMut = useMutation({
        mutationFn: (payload: { id: number | string; values: FormValues }) => {
            const cleanedValues = cleanFormValues(payload.values);
            return updateInterestPoint(payload.id, cleanedValues);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['interest-points'] }),
    });

    const deleteMut = useMutation({
        mutationFn: (id: number | string) => deleteInterestPoint(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['interest-points'] }),
    });

    const geocodeMut = useMutation({
        mutationFn: (id: number | string) => geocodeInterestPoint(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['interest-points'] }),
    });

    const statusMut = useMutation({
        mutationFn: ({ id, next }: { id: number | string; next: Status }) => updateInterestPointStatus(id, next),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['interest-points'] }),
    });

    const getDefaultValues = (row?: InterestPoint): FormValues => {
        if (row) {
            return {
                name: row.name,
                city: row.city || '',
                address: row.address || '',
                latitude: row.latitude ?? undefined,
                longitude: row.longitude ?? undefined,
                status: row.status,
            };
        }
        return {
            name: '',
            city: '',
            address: '',
            latitude: undefined,
            longitude: undefined,
            status: true,
        };
    };

    return (
        <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Puntos de Interés</Typography>
                <Stack direction="row" spacing={1}>
                    <TextField 
                        size="small" 
                        placeholder="Buscar…" 
                        value={q} 
                        onChange={(e) => { 
                            setQ(e.target.value); 
                            setPage(1); 
                        }} 
                    />
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Estado</InputLabel>
                        <Select
                            label="Estado"
                            value={status === null ? '' : status}
                            onChange={(e) => {
                                const v = e.target.value;
                                setStatus(v === '' ? null : (v === 'true' || v === true));
                                setPage(1);
                            }}
                        >
                            <MenuItem value="">Todos</MenuItem>
                            <MenuItem value="true">Activos</MenuItem>
                            <MenuItem value="false">Inactivos</MenuItem>
                        </Select>
                    </FormControl>
                    <Button variant="contained" onClick={() => setOpen({ mode: 'create' })}>
                        Nuevo POI
                    </Button>
                </Stack>
            </Stack>

            {isError && (
                <Alert severity="error">
                    {(error as any)?.response?.data?.message ?? 'Error al cargar'}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell width={80}>ID</TableCell>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Ciudad</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell align="right" width={200}>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5}>Cargando…</TableCell>
                            </TableRow>
                        ) : rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5}>Sin resultados</TableCell>
                            </TableRow>
                        ) : (
                            rows.map((r) => {
                                const active = r.status === true;
                                return (
                                    <TableRow key={r.id} hover>
                                        <TableCell>{r.id}</TableCell>
                                        <TableCell>{r.name}</TableCell>
                                        <TableCell>{r.city ?? '-'}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                size="small" 
                                                label={active ? 'Activo' : 'Inactivo'} 
                                                color={active ? 'success' : 'default'} 
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Geocodificar (lat/lng)">
                                                <span>
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => geocodeMut.mutate(r.id)} 
                                                        disabled={geocodeMut.isPending}
                                                    >
                                                        <MyLocationIcon fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                            <Tooltip title={active ? 'Desactivar' : 'Activar'}>
                                                <Switch 
                                                    size="small" 
                                                    checked={active} 
                                                    onChange={() => statusMut.mutate({ id: r.id, next: !active })} 
                                                />
                                            </Tooltip>
                                            <IconButton 
                                                size="small" 
                                                onClick={() => setOpen({ mode: 'edit', row: r })}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton 
                                                size="small" 
                                                color="error" 
                                                onClick={() => setConfirmDelete(r)}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton 
                                                size="small" 
                                                title="Imágenes" 
                                                onClick={() => setOpenImagesForPoi(Number(r.id))}
                                            >
                                                <ImageIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                title="Transportes"
                                                onClick={() => setOpenTransportsForPoi(Number(r.id))}
                                            >
                                                <DirectionsBusIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Stack direction="row" justifyContent="flex-end">
                <Pagination page={page} count={pageCount} onChange={(_, p) => setPage(p)} size="small" />
            </Stack>

            {/* Dialogo Crear / Editar */}
            <PoiDialog
                open={!!open}
                mode={open?.mode ?? 'create'}
                defaultValues={open && 'row' in open ? getDefaultValues(open.row) : getDefaultValues()}
                loading={createMut.isPending || updateMut.isPending}
                errorMessage={
                    (createMut.error as any)?.response?.data?.message ||
                    (updateMut.error as any)?.response?.data?.message
                }
                onClose={() => {
                    setOpen(null);
                    createMut.reset();
                    updateMut.reset();
                }}
                onSubmit={async (values) => {
                    if (open && 'row' in open) {
                        await updateMut.mutateAsync({ id: open.row.id, values });
                    } else {
                        await createMut.mutateAsync(values);
                    }
                    setOpen(null);
                }}
            />

            {/* Confirmación de borrado */}
            <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
                <DialogTitle>Eliminar punto de interés</DialogTitle>
                <DialogContent>
                    <Typography>¿Seguro que deseas eliminar "{confirmDelete?.name}"?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDelete(null)}>Cancelar</Button>
                    <Button 
                        color="error"
                        onClick={async () => {
                            if (confirmDelete) {
                                try {
                                    await deleteMut.mutateAsync(confirmDelete.id);
                                    setConfirmDelete(null);
                                } catch (_) { 
                                    /* manejar popup/toast si lo agregas */ 
                                }
                            }
                        }}
                    >
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>
            
            <ImageManager
                entity="poi"
                entityId={openImagesForPoi ?? 0}
                open={openImagesForPoi != null}
                onClose={() => setOpenImagesForPoi(null)}
                title="Imágenes del POI"
            />
            
            <ManagePoiTransportsDialog
                poiId={openTransportsForPoi ?? 0}
                open={openTransportsForPoi != null}
                onClose={() => setOpenTransportsForPoi(null)}
            />
        </Stack>
    );
}

function PoiDialog(props: {
    open: boolean;
    mode: 'create' | 'edit';
    defaultValues: FormValues;
    loading?: boolean;
    errorMessage?: string;
    onClose: () => void;
    onSubmit: (values: FormValues) => Promise<void>;
}) {
    const { open, mode, defaultValues, loading, errorMessage, onClose, onSubmit } = props;

    const {
        control,
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues,
    });

    React.useEffect(() => {
        if (open) {
            reset(defaultValues);
        }
    }, [open, defaultValues, reset]);

    const title = useMemo(() => (mode === 'create' ? 'Nuevo POI' : 'Editar POI'), [mode]);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{title}</DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
                {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}
                <Stack spacing={2}>
                    <TextField
                        label="Nombre"
                        size="small"
                        {...register('name')}
                        error={!!errors.name}
                        helperText={errors.name?.message}
                    />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            label="Ciudad"
                            size="small"
                            {...register('city')}
                            error={!!errors.city}
                            helperText={errors.city?.message}
                        />
                        <TextField
                            label="Dirección"
                            size="small"
                            fullWidth
                            {...register('address')}
                            error={!!errors.address}
                            helperText={errors.address?.message}
                        />
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            label="Latitud"
                            size="small"
                            type="number"
                            inputProps={{ step: 'any' }}
                            {...register('latitude', { valueAsNumber: true })}
                            error={!!errors.latitude}
                            helperText={errors.latitude?.message}
                        />
                        <TextField
                            label="Longitud"
                            size="small"
                            type="number"
                            inputProps={{ step: 'any' }}
                            {...register('longitude', { valueAsNumber: true })}
                            error={!!errors.longitude}
                            helperText={errors.longitude?.message}
                        />
                    </Stack>
                    <FormControl size="small">
                        <InputLabel>Estado</InputLabel>
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    label="Estado"
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.target.value)}
                                >
                                    <MenuItem value={true}>ACTIVO</MenuItem>
                                    <MenuItem value={false}>INACTIVO</MenuItem>
                                </Select>
                            )}
                        />
                    </FormControl>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button
                    variant="contained"
                    disabled={loading}
                    onClick={handleSubmit(onSubmit)} // Pasamos directamente onSubmit
                >
                    {mode === 'create' ? 'Crear' : 'Guardar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}