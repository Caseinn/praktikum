export function extractNimFromEmail(email: string): string | null {
  const local = (email.split("@")[0] ?? "").trim();

  const match = local.match(/(\d{9})/);

  return match ? match[1] : null;
}
