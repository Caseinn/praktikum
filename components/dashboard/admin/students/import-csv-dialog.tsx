"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet } from "lucide-react";
import { importStudentsFromCsv } from "@/lib/actions/students";

export function ImportCSVDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      if (!csvFile) throw new Error("No file");
      return importStudentsFromCsv(csvFile);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Data mahasiswa berhasil diimpor (${result.count} mahasiswa).`);
        setOpen(false);
        setCsvFile(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "Gagal mengimpor data.");
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Gagal mengimpor data.");
    },
  });

  const handleImport = () => {
    if (!csvFile) {
      toast.error("Pilih file CSV terlebih dahulu.");
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-fd-border">
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-fd-success" />
            Import CSV
          </DialogTitle>
        </DialogHeader>

        <FieldGroup className="mt-4 space-y-4">
          <div className="rounded-lg border border-fd-border bg-fd-muted/50 p-4">
            <h4 className="font-medium text-fd-foreground mb-2">Format CSV</h4>
            <p className="text-sm text-fd-muted-foreground mb-2">
              File CSV harus memiliki header dengan kolom berikut:
            </p>
            <div className="bg-fd-background rounded p-2 text-sm font-mono">
              NIM,Nama
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-fd-muted-foreground">Contoh:</p>
              <div className="bg-fd-background rounded p-2 text-sm font-mono">
                124140001,Galih Sigit Satrio
              </div>
            </div>
          </div>

          <Field>
            <Input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="bg-fd-background border-fd-border"
            />
          </Field>
        </FieldGroup>

        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button variant="outline" type="button">Batal</Button>
          </DialogClose>
          <Button
            onClick={handleImport}
            disabled={!csvFile || mutation.isPending}
            className="bg-fd-primary text-fd-primary-foreground"
          >
            {mutation.isPending ? "Mengimpor..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
