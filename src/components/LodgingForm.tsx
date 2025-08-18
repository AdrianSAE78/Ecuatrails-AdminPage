// LodgingForm.tsx
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, FormControlLabel, Switch, Alert } from '@mui/material';

const schema = z.object({
  name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(64, 'Máximo 64'),
  description: z
    .string()
    .trim()
    .max(128, 'Máximo 128')
    .optional()
    .or(z.literal('')),
  approximatePrice: z.coerce.number().min(0).max(99999).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  status: z.boolean().default(true),
});
export type LodgingFormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  initialValues?: Partial<LodgingFormValues>;
  title: string;
  onClose: () => void;
  onSubmit: (values: LodgingFormValues) => void;
  loading?: boolean;
};

export default function LodgingForm({ open, initialValues, title, onClose, onSubmit, loading }: Props) {
  const [values, setValues] = useState<LodgingFormValues>({
    name: '',
    description: '',
    approximatePrice: undefined,
    latitude: undefined,
    longitude: undefined,
    status: true,
    ...initialValues,
  } as LodgingFormValues);

  const [errors, setErrors] = useState<Partial<Record<keyof LodgingFormValues, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setValues((v) => ({ ...v, ...initialValues }));
    setErrors({});
    setFormError(null);
  }, [initialValues, open]);

  const handleSubmit = () => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      // Mapea errores de Zod a tus helperText
      const fieldErrors: Partial<Record<keyof LodgingFormValues, string>> = {};
      parsed.error.issues.forEach((iss) => {
        const path = iss.path[0] as keyof LodgingFormValues | undefined;
        if (path) fieldErrors[path] = iss.message;
      });
      setErrors(fieldErrors);
      setFormError('Revisa los campos marcados.');
      console.warn('Validación fallida:', parsed.error.format()); // <- para depurar
      return;
    }
    setErrors({});
    setFormError(null);

    // Normaliza payload
    const v = parsed.data;
    const payload: LodgingFormValues = {
      ...v,
      description: v.description === '' ? '' : v.description,
      approximatePrice:
        typeof v.approximatePrice === 'number' ? Number(v.approximatePrice.toFixed(2)) : undefined,
    };

    onSubmit(payload);
  };

  // Para permitir submit con Enter
  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
        <form onSubmit={onFormSubmit}>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Nombre"
              value={values.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
              required
              error={!!errors.name}
              helperText={errors.name}
            />
            <TextField
              label="Descripción"
              value={values.description ?? ''}
              onChange={(e) => setValues({ ...values, description: e.target.value })}
              multiline
              minRows={2}
              error={!!errors.description}
              helperText={errors.description}
            />
            <TextField
              label="Precio aprox. (USD)"
              type="number"
              value={values.approximatePrice ?? ''}
              onChange={(e) =>
                setValues({
                  ...values,
                  approximatePrice: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
              error={!!errors.approximatePrice}
              helperText={errors.approximatePrice}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Latitud"
                type="number"
                value={values.latitude ?? ''}
                onChange={(e) =>
                  setValues({
                    ...values,
                    latitude: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
                error={!!errors.latitude}
                helperText={errors.latitude}
              />
              <TextField
                label="Longitud"
                type="number"
                value={values.longitude ?? ''}
                onChange={(e) =>
                  setValues({
                    ...values,
                    longitude: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
                error={!!errors.longitude}
                helperText={errors.longitude}
              />
            </Stack>
            <FormControlLabel
              control={
                <Switch
                  checked={values.status}
                  onChange={(e) => setValues({ ...values, status: e.target.checked })}
                />
              }
              label="Activo"
            />
          </Stack>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={loading} variant="contained">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
