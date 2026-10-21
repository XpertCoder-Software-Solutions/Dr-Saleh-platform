/** "12.4 ميجا" */
export function fileSize(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} جيجا`
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} ميجا`
  return `${Math.max(1, Math.round(bytes / 1024))} ك.ب`
}
