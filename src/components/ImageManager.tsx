// src/components/images/ImageManager.tsx
import * as React from 'react';
import {
  Box, Button, Card, CardActions, CardContent, CardMedia, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, Stack, TextField, Typography, Checkbox, FormControlLabel, Tooltip
} from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import StarIcon from '@mui/icons-material/Star';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteImage, listImages, reorderImages, updateImageMeta, uploadImages, type EntityKind, type ImageItem } from '../api/images';

export default function ImageManager({
  entity, entityId, open, onClose, title,
}: {
  entity: EntityKind;
  entityId: number | string;
  open: boolean;
  onClose: () => void;
  title?: string;
}) {
  const qc = useQueryClient();
  const qKey = ['images', entity, entityId];

  const { data, isLoading } = useQuery({
    enabled: open,
    queryKey: qKey,
    queryFn: () => listImages(entity, entityId),
  });

  const uploadM = useMutation({
    mutationFn: (files: File[]) => uploadImages(entity, entityId, files),
    onSuccess: () => qc.invalidateQueries({ queryKey: qKey }),
  });

  const reorderM = useMutation({
    mutationFn: (orderedIds: (number|string)[]) => reorderImages(entity, entityId, orderedIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: qKey }),
  });

  const updateMetaM = useMutation({
    mutationFn: ({ imageId, meta }: { imageId: number | string; meta: { title?: string; alt?: string; cover?: boolean } }) =>
      updateImageMeta(entity, entityId, imageId, meta),
    onSuccess: () => qc.invalidateQueries({ queryKey: qKey }),
  });

  const deleteM = useMutation({
    mutationFn: (imageId: number | string) => deleteImage(entity, entityId, imageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qKey }),
  });

  const [fileInput, setFileInput] = React.useState<HTMLInputElement | null>(null);
  const [edit, setEdit] = React.useState<null | ImageItem>(null);

  const rows = (data ?? []).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const onMove = (idx: number, dir: -1 | 1) => {
    const i2 = idx + dir;
    if (i2 < 0 || i2 >= rows.length) return;
    const arr = rows.slice();
    const tmp = arr[idx]; arr[idx] = arr[i2]; arr[i2] = tmp;
    reorderM.mutate(arr.map(x => x.id));
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{title ?? 'Gestión de imágenes'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <input
              ref={setFileInput}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                const files = e.target.files ? Array.from(e.target.files) : [];
                if (files.length) uploadM.mutate(files);
                e.currentTarget.value = '';
              }}
            />
            <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => fileInput?.click()} disabled={uploadM.isPending}>
              {uploadM.isPending ? 'Subiendo…' : 'Subir imágenes'}
            </Button>
            <Typography variant="caption">JPG/PNG recomendados; se respeta portada y orden.</Typography>
          </Stack>

          {isLoading ? <Typography>Cargando…</Typography> : (
            <Grid container spacing={2}>
              {rows.map((img, idx) => (
                <Grid item xs={12} sm={6} md={4} key={img.id}>
                  <Card variant="outlined">
                    <CardMedia component="img" height="160" image={img.url} alt={img.alt ?? ''} />
                    <CardContent sx={{ pb: 0 }}>
                      <Typography variant="subtitle2" noWrap title={img.title ?? ''}>{img.title ?? '(sin título)'}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap title={img.alt ?? ''}>
                        {img.alt ?? '(sin alt)'}
                      </Typography>
                      <Box mt={1} display="flex" gap={1} alignItems="center">
                        <StarIcon fontSize="small" color={img.cover ? 'warning' : 'disabled'} />
                        <Typography variant="caption">{img.cover ? 'Portada' : '—'}</Typography>
                      </Box>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'space-between' }}>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Subir">
                          <span>
                            <IconButton size="small" onClick={() => onMove(idx, -1)} disabled={reorderM.isPending || idx === 0}>
                              <ArrowUpwardIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Bajar">
                          <span>
                            <IconButton size="small" onClick={() => onMove(idx, +1)} disabled={reorderM.isPending || idx === rows.length - 1}>
                              <ArrowDownwardIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <IconButton size="small" onClick={() => setEdit(img)}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => {
                          if (confirm('¿Eliminar esta imagen?')) deleteM.mutate(img.id);
                        }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
              {rows.length === 0 && <Box px={2}><Typography variant="body2">Sin imágenes. Sube algunas con el botón “Subir imágenes”.</Typography></Box>}
            </Grid>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>

      {/* Editar metadatos */}
      <EditImageDialog
        open={!!edit}
        image={edit}
        onClose={() => setEdit(null)}
        onSave={(vals) => {
          if (!edit) return;
          updateMetaM.mutate({ imageId: edit.id, meta: vals }, { onSuccess: () => setEdit(null) });
        }}
        saving={updateMetaM.isPending}
      />
    </Dialog>
  );
}

function EditImageDialog({
  open, image, onClose, onSave, saving,
}: {
  open: boolean;
  image: ImageItem | null;
  onClose: () => void;
  onSave: (vals: { title?: string; alt?: string; cover?: boolean }) => void;
  saving?: boolean;
}) {
  const [title, setTitle] = React.useState(image?.title ?? '');
  const [alt, setAlt] = React.useState(image?.alt ?? '');
  const [cover, setCover] = React.useState<boolean>(!!image?.cover);

  React.useEffect(() => {
    setTitle(image?.title ?? '');
    setAlt(image?.alt ?? '');
    setCover(!!image?.cover);
  }, [image]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Editar imagen</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mt={1}>
          <TextField label="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextField label="Texto alternativo (alt)" value={alt} onChange={(e) => setAlt(e.target.value)} />
          <FormControlLabel control={<Checkbox checked={cover} onChange={(e) => setCover(e.target.checked)} />} label="Marcar como portada" />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" disabled={saving} onClick={() => onSave({ title, alt, cover })}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}
