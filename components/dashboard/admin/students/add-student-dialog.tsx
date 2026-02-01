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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { addStudent } from "@/lib/actions/students";

export function AddStudentDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nim: "", nama: "" });

  const mutation = useMutation({
    mutationFn: () => addStudent(form.nim.trim(), form.nama.trim()),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Mahasiswa berhasil ditambahkan.");
        setOpen(false);
        setForm({ nim: "", nama: "" });
        router.refresh();
      } else {
        toast.error(result.error ?? "Gagal menambahkan mahasiswa.");
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Gagal menambahkan mahasiswa.");
    },
  });

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.nim.trim()) {
      toast.error("NIM wajib diisi.");
      return;
    }
    if (!form.nama.trim()) {
      toast.error("Nama wajib diisi.");
      return;
    }

    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-fd-primary text-fd-primary-foreground">
          <Plus className="h-4 w-4" />
          Tambah Mahasiswa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Tambah Mahasiswa
            </DialogTitle>
          </DialogHeader>

          <FieldGroup className="mt-4 space-y-4">
            <Field>
              <Label htmlFor="nim">NIM</Label>
              <Input
                id="nim"
                value={form.nim}
                onChange={(e) => setForm((prev) => ({ ...prev, nim: e.target.value }))}
                placeholder="Contoh: 124140001"
                required
              />
            </Field>

            <Field>
              <Label htmlFor="nama">Nama Lengkap</Label>
              <Input
                id="nama"
                value={form.nama}
                onChange={(e) => setForm((prev) => ({ ...prev, nama: e.target.value }))}
                placeholder="Contoh: Galih Sigit Satrio"
                required
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button variant="outline" type="button">Batal</Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending} className="bg-fd-primary text-fd-primary-foreground">
              {mutation.isPending ? "Menyimpan..." : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
