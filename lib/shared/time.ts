const WIB_TIMEZONE = "Asia/Jakarta";

export function formatWIBInputValue(date: Date): string {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: WIB_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const lookup = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return `${lookup.year}-${lookup.month}-${lookup.day}T${lookup.hour}:${lookup.minute}`;
}

export function parseWIBDateTime(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  if (
    [year, month, day, hour, minute].some((part) => Number.isNaN(part))
  ) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day, hour - 7, minute));
}

export function formatWIB(date: Date): string {
  return date.toLocaleString("id-ID", {
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: WIB_TIMEZONE,
  });
}

export function formatWIBTimeOnly(date: Date): string {
  return date.toLocaleString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: WIB_TIMEZONE,
  });
}
