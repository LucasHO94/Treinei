import type { Intensity } from '@/types/domain'

export const INTENSITY_ORDER: Intensity[] = ['light', 'heavy', 'failure']

export const INTENSITY_LABEL: Record<Intensity, string> = {
  light: 'Leve',
  heavy: 'Pesado',
  failure: 'Até falhar',
}

export const INTENSITY_TEXT_COLOR: Record<Intensity, string> = {
  light: 'text-intensity-light',
  heavy: 'text-intensity-heavy',
  failure: 'text-intensity-failure',
}
