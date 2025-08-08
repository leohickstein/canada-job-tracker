export const text = (v: any): string => {
  if (v == null) return ''
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (typeof v === 'object') {
    if ('display_name' in v) return text((v as any).display_name)
    if ('name' in v) return text((v as any).name)
    if ('label' in v) return text((v as any).label)
  }
  return ''
}
export const regionOf = (j: any) => text(j?.region)
export const roleOf   = (j: any) => text(j?.roleMatched)
