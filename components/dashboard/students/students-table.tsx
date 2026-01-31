"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type FilterFn,
} from "@tanstack/react-table";
import { Users, Search, Trash2, AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ImportCSVDialog } from "./import-csv-dialog";
import { AddStudentDialog } from "./add-student-dialog";
import { ensureCsrfToken } from "@/lib/csrf-client";
import { CSRF_HEADER_NAME } from "@/lib/csrf";

type Student = {
  id: string;
  nim: string;
  fullName: string | null;
  isActive: boolean;
  createdAt: Date;
};

interface StudentsTableProps {
  students: Student[];
}

const columns: ColumnDef<Student>[] = [
  {
    accessorKey: "nim",
    header: "NIM",
    cell: ({ row }) => (
      <span className="font-mono text-fd-foreground whitespace-nowrap">
        {row.original.nim}
      </span>
    ),
  },
  {
    accessorKey: "fullName",
    header: "Nama",
    cell: ({ row }) => (
      <span className="text-fd-foreground max-w-[300px] truncate block">
        {row.original.fullName || "-"}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => <DeleteButton student={row.original} />,
  },
];

function DeleteButton({ student }: { student: Student }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const csrfToken = await ensureCsrfToken();
      if (!csrfToken) {
        toast.error("Gagal mendapatkan token keamanan.");
        return;
      }

      const res = await fetch(`/api/students?nim=${encodeURIComponent(student.nim)}`, {
        method: "DELETE",
        headers: {
          [CSRF_HEADER_NAME]: csrfToken,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menghapus mahasiswa.");
        return;
      }

      toast.success("Mahasiswa berhasil dihapus.");
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan. Coba lagi.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-fd-error hover:text-fd-error hover:bg-fd-error/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-fd-error/10">
              <AlertTriangle className="h-5 w-5 text-fd-error" />
            </div>
            <AlertDialogTitle>Hapus Mahasiswa</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Yakin ingin menghapus mahasiswa dengan NIM {student.nim}?
            Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-fd-error text-fd-error-foreground hover:bg-fd-error/90"
          >
            {deleting ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function StudentsTable({ students }: StudentsTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");

  const globalFilterFn: FilterFn<Student> = (row, _columnId, filterValue) => {
    const query = String(filterValue ?? "").toLowerCase().trim();
    if (!query) return true;
    return (
      row.original.nim.toLowerCase().includes(query) ||
      (row.original.fullName?.toLowerCase().includes(query) ?? false)
    );
  };

  const table = useReactTable({
    data: students,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn,
    getRowId: (row) => row.id,
  });

  return (
    <div className="rounded-xl border border-fd-border bg-fd-card">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-fd-border p-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fd-muted-foreground" />
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Cari NIM atau nama..."
            className="pl-9 bg-fd-background border-fd-border"
          />
        </div>
        <div className="flex gap-2">
          <ImportCSVDialog />
          <AddStudentDialog />
        </div>
      </div>

      <div className="overflow-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-fd-border hover:bg-fd-muted/50">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-sm text-fd-muted-foreground">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-fd-border hover:bg-fd-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="border-fd-border hover:bg-transparent">
                <TableCell colSpan={3} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2 text-fd-muted-foreground">
                    <Users className="h-8 w-8" />
                    <p>
                      {globalFilter.trim()
                        ? "Tidak ada hasil pencarian yang sesuai."
                        : "Belum ada mahasiswa terdaftar."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
