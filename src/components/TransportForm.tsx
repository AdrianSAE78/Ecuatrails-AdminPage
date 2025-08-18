// src/pages/Transport/TransportForm.tsx
import { useEffect, useState } from 'react';
import { z } from 'zod';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, MenuItem,
} from '@mui/material';
import type { TransportCreate, TransportType } from '../types/Transport';

const schema = z.object({
    type: z.string().min(2),
    name: z.string().min(2).max(128),
    route: z.string().max(128).optional().or(z.literal('')),
    schedule: z.string().max(128).optional().or(z.literal('')),
    baseFare: z.coerce.number().min(0).max(9999).optional(),
    accessibility: z.coerce.boolean().default(false),
    status: z.coerce.boolean().default(true),
});
export type TransportFormValues = z.infer<typeof schema>;

const defaultTypes: TransportType[] = ['BUS', 'TAXI', 'METRO', 'CABLECAR', 'BIKE'];

export default function TransportForm({
    open, title, initialValues, onClose, onSubmit, loading,
}: {
    open: boolean;
    title: string;
    initialValues?: Partial<TransportFormValues>;
    onClose: () => void;
    onSubmit: (values: TransportCreate) => void;
    loading?: boolean;
}) {
    const [values, setValues] = useState<TransportFormValues>({
        type: 'BUS',
        name: '',
        route: '',
        schedule: '',
        baseFare: undefined,
        accessibility: false,
        status: true,
        ...initialValues,
    } as TransportFormValues);

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
                    <TextField select label="Tipo" value={values.type} onChange={(e) => setValues({ ...values, type: e.target.value as TransportType })}>
                        {defaultTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </TextField>
                    <TextField label="Nombre" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} required />
                    <TextField label="Ruta/Línea" value={values.route ?? ''} onChange={(e) => setValues({ ...values, route: e.target.value })} />
                    <TextField label="Horario" value={values.schedule ?? ''} onChange={(e) => setValues({ ...values, schedule: e.target.value })} />
                    <TextField label="Tarifa base (USD)" type="number" value={values.baseFare ?? ''} onChange={(e) => setValues({ ...values, baseFare: e.target.value === '' ? undefined : Number(e.target.value) })} />
                    <TextField
                        select
                        label="Accesibilidad"
                        value={values.accessibility ? 'true' : 'false'}
                        onChange={(e) =>
                            setValues({ ...values, accessibility: e.target.value === 'true' })
                        }
                    >
                        <MenuItem value="true">Sí</MenuItem>
                        <MenuItem value="false">No</MenuItem>
                    </TextField>

                    <TextField
                        select
                        label="Estado"
                        value={values.status ? 'true' : 'false'}
                        onChange={(e) =>
                            setValues({ ...values, status: e.target.value === 'true' })
                        }
                    >
                        <MenuItem value="true">Activo</MenuItem>
                        <MenuItem value="false">Inactivo</MenuItem>
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
