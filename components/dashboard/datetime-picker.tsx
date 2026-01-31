"use client";

import * as React from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";

interface DateTimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function DateTimePicker({ value, onChange, required }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  );
  const [hours, setHours] = React.useState(8);
  const [minutes, setMinutes] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        setDate(parsed);
        setHours(parsed.getHours());
        setMinutes(parsed.getMinutes());
      }
    } else {
      setDate(undefined);
      setHours(8);
      setMinutes(0);
    }
  }, [value]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      setDate(newDate);
      onChange(newDate.toISOString());
      setIsOpen(false);
    }
  };

  const handleTimeChange = (type: "hours" | "minutes", newValue: string) => {
    const numValue = parseInt(newValue) || 0;
    
    if (type === "hours") {
      const clamped = Math.max(0, Math.min(23, numValue));
      setHours(clamped);
      if (date) {
        const newDate = new Date(date);
        newDate.setHours(clamped);
        setDate(newDate);
        onChange(newDate.toISOString());
      }
    } else {
      const clamped = Math.max(0, Math.min(59, numValue));
      setMinutes(clamped);
      if (date) {
        const newDate = new Date(date);
        newDate.setMinutes(clamped);
        setDate(newDate);
        onChange(newDate.toISOString());
      }
    }
  };

  const handleConfirm = () => {
    if (date) {
      const newDate = new Date(date);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      setDate(newDate);
      onChange(newDate.toISOString());
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setDate(undefined);
    setHours(8);
    setMinutes(0);
    onChange("");
    setIsOpen(false);
  };

  const displayValue = date
    ? format(date, "yyyy-MM-dd'T'HH:mm", { locale: id })
    : "";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full"
      >
        <Input
          type="datetime-local"
          value={displayValue}
          placeholder="Pilih tanggal dan waktu"
          required={required}
          readOnly
          className="cursor-pointer pr-10 bg-fd-background border-fd-border"
        />
        <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fd-muted-foreground pointer-events-none" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 w-auto rounded-xl border border-fd-border bg-fd-card shadow-xl">
          <div className="p-3 border-b border-fd-border">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              locale={id}
              className="p-0"
            />
          </div>
          <div className="flex items-center justify-center gap-3 p-3 bg-fd-muted/30 border-t border-fd-border">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-fd-muted-foreground" />
              <input
                type="number"
                min="0"
                max="23"
                value={String(hours).padStart(2, "0")}
                onChange={(e) => handleTimeChange("hours", e.target.value)}
                className="w-14 rounded-md border border-fd-border bg-fd-background px-2 py-1.5 text-center text-sm font-medium focus:border-fd-primary focus:outline-none focus:ring-1 focus:ring-fd-primary"
              />
              <span className="text-sm font-medium">:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={String(minutes).padStart(2, "0")}
                onChange={(e) => handleTimeChange("minutes", e.target.value)}
                className="w-14 rounded-md border border-fd-border bg-fd-background px-2 py-1.5 text-center text-sm font-medium focus:border-fd-primary focus:outline-none focus:ring-1 focus:ring-fd-primary"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 p-3 border-t border-fd-border bg-fd-muted/20">
            <Button variant="outline" size="sm" onClick={handleClear}>
              Reset
            </Button>
            <Button size="sm" onClick={handleConfirm}>
              OK
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
