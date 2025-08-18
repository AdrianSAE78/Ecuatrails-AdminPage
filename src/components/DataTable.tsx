import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

interface Column<T> { key: keyof T; header: string; }
interface Props<T> { columns: Column<T>[]; rows: T[]; }

export default function DataTable<T extends Record<string, unknown>>({ columns, rows }: Props<T>) {
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((c) => (<TableCell key={String(c.key)}>{c.header}</TableCell>))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i}>
              {columns.map((c) => (<TableCell key={String(c.key)}>{String(r[c.key])}</TableCell>))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}