"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type ColumnDef,
  type FilterFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Check, CircleMinus, CircleSlash, MoreHorizontal, Users } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { formatWIB } from "@/lib/shared/time";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { bulkUpdateAttendance } from "@/lib/actions/admin";

type AttendanceStatus = "HADIR" | "IZIN" | "TIDAK_HADIR" | "BELUM";

export type AttendanceTableRow = {
  nim: string;
  name: string;
  status: AttendanceStatus;
  attendedAtLabel: string;
};

type AttendanceDataTableProps = {
  sessionId: string;
  rows: AttendanceTableRow[];
};

function getStatusMeta(status: AttendanceStatus): {
  label: string;
  tone: "active" | "notice" | "expired" | "upcoming";
} {
  if (status === "HADIR") return { label: "Hadir", tone: "active" };
  if (status === "IZIN") return { label: "Izin", tone: "notice" };
  if (status === "TIDAK_HADIR") return { label: "Tidak hadir", tone: "expired" };
  return { label: "Belum presensi", tone: "upcoming" };
}

export default function AttendanceDataTable({
  sessionId,
  rows,
}: AttendanceDataTableProps) {
  const [data, setData] = useState<AttendanceTableRow[]>(rows);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [busyStatus, setBusyStatus] = useState<AttendanceStatus | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const router = useRouter();

  const bulkMutation = useMutation({
    mutationFn: ({ nims, status }: { nims: string[]; status: AttendanceStatus }) =>
      bulkUpdateAttendance(sessionId, status, nims),
    onSuccess: (result, variables) => {
      if (result.success) {
        const timestamp = formatWIB(new Date());
        setData((prev) =>
          prev.map((row) =>
            variables.nims.includes(row.nim) && !result.missing?.includes(row.nim)
              ? { ...row, status: variables.status, attendedAtLabel: timestamp }
              : row
          )
        );
        setRowSelection({});

        if ((result.updated ?? 0) > 0) {
          toast.success(`Presensi diperbarui untuk ${result.updated} mahasiswa.`);
        } else {
          toast.info("Tidak ada presensi yang diperbarui.");
        }
        if (result.missing && result.missing.length > 0) {
          toast.info(`NIM tidak ditemukan: ${result.missing.join(", ")}.`);
        }
        router.refresh();
      } else {
        toast.error(result.error ?? "Gagal memperbarui presensi.");
      }
      setBusyStatus(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan.");
      setBusyStatus(null);
    },
  });

  const applyStatus = useCallback(
    async (nims: string[], status: AttendanceStatus) => {
      if (nims.length === 0) {
        toast.info("Pilih mahasiswa yang ingin diperbarui.");
        return;
      }

      setBusyStatus(status);
      bulkMutation.mutate({ nims, status });
    },
    [bulkMutation]
  );

  useEffect(() => {
    setData(rows);
  }, [rows]);

  const columns = useMemo<ColumnDef<AttendanceTableRow>[]>(() => {
    return [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllRowsSelected()
                ? true
                : table.getIsSomeRowsSelected()
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(value) => table.toggleAllRowsSelected(Boolean(value))}
            aria-label="Pilih semua baris"
            className="border-fd-border bg-fd-background data-[state=checked]:border-fd-primary data-[state=checked]:bg-fd-primary data-[state=checked]:text-fd-primary-foreground"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
            aria-label="Pilih baris"
            className="border-fd-border bg-fd-background data-[state=checked]:border-fd-primary data-[state=checked]:bg-fd-primary data-[state=checked]:text-fd-primary-foreground"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "nim",
        header: "NIM",
        cell: ({ row }) => (
          <span className="font-mono text-fd-foreground">{row.original.nim}</span>
        ),
      },
      {
        accessorKey: "name",
        header: "Nama",
        cell: ({ row }) => (
          <div className="min-w-[180px]">
            <p className="text-sm font-medium text-fd-foreground">{row.original.name}</p>
          </div>
        ),
      },

      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const meta = getStatusMeta(row.original.status);
          return (
            <span className="status-chip" data-tone={meta.tone}>
              {meta.label}
            </span>
          );
        },
      },
      {
        accessorKey: "attendedAtLabel",
        header: "Waktu",
        cell: ({ row }) => (
          <span className="text-xs text-fd-muted-foreground">
            {row.original.attendedAtLabel}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-fd-border text-fd-foreground transition hover:bg-fd-muted disabled:cursor-not-allowed disabled:opacity-60"
                disabled={busyStatus !== null}
              >
                <span className="sr-only">Aksi</span>
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="border-fd-border bg-fd-card text-fd-foreground"
            >
              <DropdownMenuLabel className="text-xs uppercase tracking-wide text-fd-muted-foreground">
                Aksi presensi
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-fd-border" />
              <DropdownMenuItem
                onSelect={() => applyStatus([row.original.nim], "HADIR")}
                disabled={busyStatus !== null}
                className="cursor-pointer focus:bg-fd-muted focus:text-fd-foreground"
              >
                <Check className="h-4 w-4 text-fd-muted-foreground" />
                Tandai Hadir
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => applyStatus([row.original.nim], "IZIN")}
                disabled={busyStatus !== null}
                className="cursor-pointer focus:bg-fd-muted focus:text-fd-foreground"
              >
                <CircleMinus className="h-4 w-4 text-fd-muted-foreground" />
                Tandai Izin
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => applyStatus([row.original.nim], "TIDAK_HADIR")}
                disabled={busyStatus !== null}
                className="cursor-pointer focus:bg-fd-muted focus:text-fd-foreground"
              >
                <CircleSlash className="h-4 w-4 text-fd-muted-foreground" />
                Tandai Tidak Hadir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ];
  }, [applyStatus, busyStatus]);

  const globalFilterFn: FilterFn<AttendanceTableRow> = useCallback(
    (row, _columnId, filterValue) => {
      const query = String(filterValue ?? "").toLowerCase().trim();
      if (!query) return true;
      return (
        row.original.name.toLowerCase().includes(query) ||
        row.original.nim.toLowerCase().includes(query)
      );
    },
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { rowSelection, globalFilter },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn,
    getRowId: (row) => row.nim,
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedNims = selectedRows.map((row) => row.original.nim);
  const bulkDisabled = busyStatus !== null || selectedNims.length === 0;
  const hasFilter = globalFilter.trim().length > 0;

  return (
    <div className="rounded-xl border border-fd-border bg-fd-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-fd-border px-4 py-3 md:flex-nowrap md:gap-4 lg:gap-6">
        <div className="flex flex-1 flex-wrap items-center gap-3 md:flex-nowrap md:gap-4">
          <Input
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder="Cari nama atau NIM"
            className="h-9 w-full min-w-[200px] border-fd-border bg-fd-background text-sm text-fd-foreground placeholder:text-fd-muted-foreground focus-visible:border-[color:var(--color-fd-primary)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-fd-primary)] sm:w-64 md:w-72 lg:w-80"
          />
          <div className="flex items-center gap-2 text-xs text-fd-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {selectedNims.length > 0
              ? `${selectedNims.length} mahasiswa dipilih`
              : "Pilih baris."}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
          <button
            type="button"
            onClick={() => table.toggleAllRowsSelected(true)}
            className="rounded-md border border-fd-border px-2 py-1 text-xs font-semibold text-fd-foreground transition hover:bg-fd-muted"
          >
            Pilih semua
          </button>
          <button
            type="button"
            onClick={() => table.resetRowSelection()}
            className="rounded-md border border-fd-border px-2 py-1 text-xs font-semibold text-fd-foreground transition hover:bg-fd-muted"
          >
            Bersihkan
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={bulkDisabled}
                className="inline-flex items-center gap-1.5 rounded-md border border-fd-border px-3 py-1.5 text-xs font-semibold text-fd-foreground transition hover:bg-fd-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                Aksi massal
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="border-fd-border bg-fd-card text-fd-foreground"
            >
              <DropdownMenuLabel className="text-xs uppercase tracking-wide text-fd-muted-foreground">
                Perbarui presensi
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-fd-border" />
              <DropdownMenuItem
                onSelect={() => applyStatus(selectedNims, "HADIR")}
                disabled={bulkDisabled}
                className="cursor-pointer focus:bg-fd-muted focus:text-fd-foreground"
              >
                <Check className="h-4 w-4 text-fd-muted-foreground" />
                Tandai Hadir
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => applyStatus(selectedNims, "IZIN")}
                disabled={bulkDisabled}
                className="cursor-pointer focus:bg-fd-muted focus:text-fd-foreground"
              >
                <CircleMinus className="h-4 w-4 text-fd-muted-foreground" />
                Tandai Izin
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => applyStatus(selectedNims, "TIDAK_HADIR")}
                disabled={bulkDisabled}
                className="cursor-pointer focus:bg-fd-muted focus:text-fd-foreground"
              >
                <CircleSlash className="h-4 w-4 text-fd-muted-foreground" />
                Tandai Tidak Hadir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

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
              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8">
                <div className="flex flex-col items-center gap-2 text-fd-muted-foreground">
                  <Users className="h-8 w-8" />
                  <p>
                    {hasFilter
                      ? "Tidak ada hasil pencarian yang sesuai."
                      : "Belum ada data Mahasiswa aktif."}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
