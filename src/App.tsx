import { AppBar, Toolbar, Typography, Button, Container, Stack } from '@mui/material';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';

export default function App() {
  const { logout, username } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Ecuatrails Admin</Typography>
          <Stack direction="row" spacing={2}>
            <Button color="inherit" component={Link} to="/">Dashboard</Button>
            <Button color="inherit" component={Link} to="/categories">Categorías</Button>
            <Button color="inherit" component={Link} to="/interest-points">POIs</Button>
            <Button color="inherit" component={Link} to="/lodgings">Alojamientos</Button>
            <Button color="inherit" component={Link} to="/routes">Rutas</Button>
            <Button color="inherit" component={Link} to="/transport">Transporte</Button>
          </Stack>
          <Typography sx={{ mx: 2 }}>{username}</Typography>
          <Button color="inherit" onClick={() => { logout(); navigate('/login'); }}>Salir</Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ my: 3 }}>
        <Outlet />
      </Container>
    </>
  );
}