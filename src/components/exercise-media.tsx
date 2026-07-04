import { useState } from 'react'
import { Dumbbell } from 'lucide-react'
import { exerciseImageUrl } from '@/lib/catalog/media'
import { cn } from '@/lib/utils'
import type { Exercise } from '@/types/domain'

interface ExerciseMediaProps {
  exercise: Pick<Exercise, 'name' | 'images' | 'media_url'>
  /** Anima o crossfade entre as 2 fotos (início/fim do movimento). Quando falso, nem
   *  baixa a 2ª foto — usado na grade do catálogo, onde só a miniatura estática importa. */
  animate?: boolean
  /** 'cover' preenche o container (miniaturas/grade); 'contain' mostra a foto inteira (overlay fullscreen). */
  fit?: 'cover' | 'contain'
  className?: string
}

/**
 * Mídia de execução do exercício: crossfade entre as 2 fotos do catálogo.
 * Exercícios custom (sem mídia) mostram um placeholder com ícone.
 */
export function ExerciseMedia({ exercise, animate = true, fit = 'cover', className }: ExerciseMediaProps) {
  const [loaded, setLoaded] = useState(false)
  const start = exerciseImageUrl(exercise.images?.[0])
  const end = animate ? exerciseImageUrl(exercise.images?.[1]) : null
  const fitClass = fit === 'contain' ? 'object-contain' : 'object-cover'

  if (!start) {
    return (
      <div className={cn('flex items-center justify-center bg-surface text-muted', className)}>
        <Dumbbell className="size-8" />
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden bg-white', className)}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-surface" />}
      <img
        src={start}
        alt={`Execução de ${exercise.name} — posição inicial`}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={cn('absolute inset-0 size-full transition-opacity duration-300', fitClass, loaded ? 'opacity-100' : 'opacity-0')}
      />
      {end && (
        <img
          src={end}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className={cn('absolute inset-0 size-full', fitClass, 'exercise-crossfade-top')}
        />
      )}
    </div>
  )
}
