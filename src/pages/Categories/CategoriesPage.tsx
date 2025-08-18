import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Pagination,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
  type Category,
} from '../../api/categories';

const schema = z.object({
  code: z.string().min(1, 'Código requerido').max(16, 'Máx 16 caracteres'),
  name: z.string().min(1, 'Nombre requerido').max(64, 'Máx 64 caracteres'),
});

type FormValues = z.infer<typeof schema>;

export default function CategoriesPage() {
  const qc = useQueryClient();

  // Filtros & paginación simple (cliente/servidor)
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1); // 1-based para el UI
  const [size, setSize] = useState(10);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['categories', { page, size, q }],
    queryFn: () => listCategories({ page: page - 1, size, q }), // usa 0-based hacia el server
    keepPreviousData: true,
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? rows.length;
  const pageCount = Math.max(1, Math.ceil(total / size));

  // Estado de diálogos
  const [open, setOpen] = useState<null | { mode: 'create' } | { mode: 'edit'; row: Category }>(null);
  const [confirmDelete, setConfirmDelete] = useState<null | Category>(null);

  const createMut = useMutation({
    mutationFn: (values: FormValues) => createCategory(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });

  const updateMut = useMutation({
    mutationFn: (payload: { id: number | string; values: FormValues }) =>
      updateCategory(payload.id, payload.values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number | string) => deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Categorías</Typography>
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
          <Button variant="contained" onClick={() => setOpen({ mode: 'create' })}>Nueva categoría</Button>
        </Stack>
      </Stack>

      {isError && (
        <Alert severity="error">{(error as any)?.response?.data?.message ?? 'Error al cargar'}</Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={80}>ID</TableCell>
              <TableCell width={140}>Código</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell align="right" width={120}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4}>Cargando…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={4}>Sin resultados</TableCell></TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.id}</TableCell>
                  <TableCell>{r.code}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => setOpen({ mode: 'edit', row: r })}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setConfirmDelete(r)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack direction="row" justifyContent="flex-end">
        <Pagination page={page} count={pageCount} onChange={(_, p) => setPage(p)} size="small" />
      </Stack>

      {/* Dialogo Crear / Editar */}
      <CategoryDialog
        open={!!open}
        mode={open?.mode ?? 'create'}
        defaultValues={open && 'row' in open ? { code: open.row.code, name: open.row.name } : { code: '', name: '' }}
        loading={createMut.isPending || updateMut.isPending}
        errorMessage={(createMut.error as any)?.response?.data?.message || (updateMut.error as any)?.response?.data?.message}
        onClose={() => { setOpen(null); createMut.reset(); updateMut.reset(); }}
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
        <DialogTitle>Eliminar categoría</DialogTitle>
        <DialogContent>
          <Typography>¿Seguro que deseas eliminar "{confirmDelete?.name}"?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button color="error"
            onClick={async () => {
              if (confirmDelete) {
                try {
                  await deleteMut.mutateAsync(confirmDelete.id);
                  setConfirmDelete(null);
                } catch (_) { /* error mostrado por interceptor/toast si aplica */ }
              }
            }}
          >Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function CategoryDialog(props: {
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
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    values: defaultValues, // asegura que cambie cuando edites
  });

  const title = useMemo(() => (mode === 'create' ? 'Nueva categoría' : 'Editar categoría'), [mode]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}
        <Stack spacing={2}>
          <TextField label="Código" size="small" {...register('code')} error={!!errors.code} helperText={errors.code?.message} />
          <TextField label="Nombre" size="small" {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" disabled={loading} onClick={handleSubmit(async (v) => onSubmit(v))}>
          {mode === 'create' ? 'Crear' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}