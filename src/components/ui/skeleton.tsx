import { cn } from '@/lib/utils'

/** Placeholder pulsante de carregamento — substitui textos "Carregando...". */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-surface', className)} {...props} />
}

export { Skeleton }
