/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, MenuItem } from '@mui/material';

const schema = z.object({
  name: z.string().min(2).max(128),
  description: z.string().max(1024).optional().or(z.literal('')),
  distanceKm: z.coerce.number().min(0).max(100000).optional(),
  difficulty: z.string().optional(),
  status: z.boolean().default(true),
  categoryId: z.coerce.number().optional(),
});
export type RouteFormValues = z.infer<typeof schema>;

export default function RouteForm({
  open, initialValues, title, onClose, onSubmit, loading, categories,
}: {
  open: boolean;
  initialValues?: Partial<RouteFormValues>;
  title: string;
  onClose: () => void;
  onSubmit: (values: RouteFormValues) => void;
  loading?: boolean;
  categories: { id: number; name: string }[];
}) {
  const [values, setValues] = useState<RouteFormValues>({
    name: '',
    description: '',
    distanceKm: undefined,
    difficulty: 'MEDIUM',
    status: true,
    categoryId: undefined,
    ...initialValues,
  } as RouteFormValues);

  useEffect(() => { setValues((v) => ({ ...v, ...initialValues })); }, [initialValues]);

  const handleSubmit = () => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) return;
    onSubmit(parsed.data);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mt={1}>
          <TextField label="Nombre" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} required />
          <TextField label="Descripción" value={values.description ?? ''} onChange={(e) => setValues({ ...values, description: e.target.value })} multiline minRows={2} />
          <TextField label="Distancia (km)" type="number" value={values.distanceKm ?? ''} onChange={(e) => setValues({ ...values, distanceKm: e.target.value === '' ? undefined : Number(e.target.value) })} />
          <TextField select label="Dificultad" value={values.difficulty ?? 'MEDIUM'} onChange={(e) => setValues({ ...values, difficulty: e.target.value })}>
            <MenuItem value="EASY">Fácil</MenuItem>
            <MenuItem value="MEDIUM">Media</MenuItem>
            <MenuItem value="HARD">Alta</MenuItem>
          </TextField>
          <TextField
            select
            label="Estado"
            value={values.status}
            onChange={(e) =>
              setValues({ ...values, status: e.target.value === 'true' })
            }
          >
            <MenuItem value="true">Activo</MenuItem>
            <MenuItem value="false">Inactivo</MenuItem>
          </TextField>
          <TextField select label="Categoría" value={values.categoryId ?? ''} onChange={(e) => setValues({ ...values, categoryId: e.target.value === '' ? undefined : Number(e.target.value) })}>
            <MenuItem value="">Sin categoría</MenuItem>
            {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={loading} variant="contained">Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}
