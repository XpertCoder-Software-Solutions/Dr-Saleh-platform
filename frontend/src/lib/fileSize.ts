import { tx } from '@/lib/i18n'
/** "12.4 ميجا" */
export function fileSize(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} ${tx('جيجا', 'GB')}`
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} ${tx('ميجا', 'MB')}`
  return `${Math.max(1, Math.round(bytes / 1024))} ${tx('ك.ب', 'KB')}`
}
