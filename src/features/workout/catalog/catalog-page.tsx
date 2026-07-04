import { useMemo, useState } from 'react'
import { Search, Plus, ArrowLeft, Check, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useMuscleGroups, useExercisesByGroup, useExerciseSearch, useExerciseCounts } from '@/features/workout/lib/queries'
import { exerciseImageUrl } from '@/lib/catalog/media'
import { ExerciseMedia } from '@/components/exercise-media'
import { ExerciseDetailOverlay } from './exercise-detail-overlay'
import { CreateExerciseSheet } from './create-exercise-sheet'
import { cn } from '@/lib/utils'
import type { Exercise, MuscleGroup } from '@/types/domain'

interface CatalogPageProps {
  /** Modo seleção múltipla (picker do builder): tocar seleciona; confirmar devolve todos. */
  onAddMany?: (exercises: Exercise[]) => void
  /** Oculta o título e o padding externo — usado ao embutir dentro de um Sheet. */
  embedded?: boolean
}

export function CatalogPage({ onAddMany, embedded = false }: CatalogPageProps) {
  const muscleGroups = useMuscleGroups()
  const counts = useExerciseCounts()
  const [search, setSearch] = useState('')
  const searchResults = useExerciseSearch(search)
  const [openGroup, setOpenGroup] = useState<MuscleGroup | null>(null)
  const [selected, setSelected] = useState<Map<string, Exercise>>(new Map())
  const [detail, setDetail] = useState<Exercise | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const selectable = !!onAddMany
  const isSearching = search.trim().length > 0

  function toggleSelect(exercise: Exercise) {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(exercise.id)) next.delete(exercise.id)
      else next.set(exercise.id, exercise)
      return next
    })
  }

  function handleCellTap(exercise: Exercise) {
    if (selectable) toggleSelect(exercise)
    else setDetail(exercise)
  }

  function confirmAdd() {
    if (!onAddMany || selected.size === 0) return
    onAddMany([...selected.values()])
    setSelected(new Map())
  }

  return (
    <div className={cn('flex flex-col gap-4', !embedded && 'p-4')}>
      {!embedded && (
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{openGroup ? openGroup.name : 'Catálogo'}</h1>
          <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
            <Plus /> Exercício
          </Button>
        </header>
      )}

      <div className="flex items-center gap-2">
        {openGroup && !isSearching && (
          <button
            type="button"
            onClick={() => setOpenGroup(null)}
            aria-label="Voltar aos grupos"
            className="flex size-11 shrink-0 items-center justify-center rounded-md bg-surface text-muted hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </button>
        )}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Buscar exercício ou criar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {embedded && (
          <Button size="sm" variant="outline" className="h-11 shrink-0" onClick={() => setCreateOpen(true)}>
            <Plus />
          </Button>
        )}
      </div>

      {isSearching ? (
        <>
          <ExerciseGrid
            exercises={searchResults ?? []}
            selected={selected}
            selectable={selectable}
            onTap={handleCellTap}
            onInfo={setDetail}
          />
          {searchResults != null && searchResults.length === 0 && (
            <EmptySearchState term={search} onCreate={() => setCreateOpen(true)} />
          )}
        </>
      ) : openGroup ? (
        <GroupDetail
          group={openGroup}
          selected={selected}
          selectable={selectable}
          onTap={handleCellTap}
          onInfo={setDetail}
          onCreate={() => setCreateOpen(true)}
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {(muscleGroups ?? []).map((group) => (
            <GroupHeroRow
              key={group.id}
              group={group}
              count={counts.get(group.id) ?? 0}
              onOpen={() => setOpenGroup(group)}
            />
          ))}
        </div>
      )}

      {selectable && selected.size > 0 && (
        <div className="sticky bottom-2 z-10 mt-2">
          <Button className="w-full shadow-lg" onClick={confirmAdd}>
            <Check className="size-4" /> Adicionar {selected.size} {selected.size === 1 ? 'exercício' : 'exercícios'}
          </Button>
        </div>
      )}

      <ExerciseDetailOverlay exercise={detail} onClose={() => setDetail(null)} />

      <CreateExerciseSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultMuscleGroupId={openGroup?.id}
        initialName={isSearching ? search : undefined}
        onCreated={(exercise) => {
          if (selectable) toggleSelect(exercise)
        }}
      />
    </div>
  )
}

/** Linha full-bleed do grupo muscular com foto de fundo — paridade com o app de referência. */
function GroupHeroRow({ group, count, onOpen }: { group: MuscleGroup; count: number; onOpen: () => void }) {
  const cover = exerciseImageUrl(group.image_url)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative h-24 w-full overflow-hidden rounded-lg text-left transition-transform active:scale-[0.99]"
    >
      {cover && (
        <img
          src={cover}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover object-[center_30%]"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-background/20" />
      <div className="relative flex h-full items-center justify-between px-4">
        <div>
          <p className="font-display text-lg font-bold">{group.name}</p>
          <p className="text-xs text-muted">{count} exercícios</p>
        </div>
        <span className="flex size-8 items-center justify-center rounded-full bg-surface/80 text-muted backdrop-blur">
          <Plus className="size-4" />
        </span>
      </div>
    </button>
  )
}

function GroupDetail({
  group,
  selected,
  selectable,
  onTap,
  onInfo,
  onCreate,
}: {
  group: MuscleGroup
  selected: Map<string, Exercise>
  selectable: boolean
  onTap: (e: Exercise) => void
  onInfo: (e: Exercise) => void
  onCreate: () => void
}) {
  const exercises = useExercisesByGroup(group.id)
  const [equipmentFilter, setEquipmentFilter] = useState<string | null>(null)

  const equipments = useMemo(() => {
    const set = new Set<string>()
    for (const e of exercises ?? []) if (e.equipment) set.add(e.equipment)
    return [...set].sort()
  }, [exercises])

  const filtered = useMemo(
    () => (exercises ?? []).filter((e) => !equipmentFilter || e.equipment === equipmentFilter),
    [exercises, equipmentFilter],
  )

  return (
    <div className="flex flex-col gap-3">
      {equipments.length > 1 && (
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          <FilterChip active={equipmentFilter === null} onClick={() => setEquipmentFilter(null)}>
            Todos
          </FilterChip>
          {equipments.map((eq) => (
            <FilterChip key={eq} active={equipmentFilter === eq} onClick={() => setEquipmentFilter(eq)}>
              {eq}
            </FilterChip>
          ))}
        </div>
      )}

      <ExerciseGrid exercises={filtered} selected={selected} selectable={selectable} onTap={onTap} onInfo={onInfo} />

      <button
        type="button"
        onClick={onCreate}
        className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-primary hover:bg-surface"
      >
        <Plus className="size-4" /> Criar exercício em {group.name}
      </button>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'bg-surface text-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

/** Grade 2 colunas com mídia animada — cada célula seleciona (picker) ou abre o detalhe. */
function ExerciseGrid({
  exercises,
  selected,
  selectable,
  onTap,
  onInfo,
}: {
  exercises: Exercise[]
  selected: Map<string, Exercise>
  selectable: boolean
  onTap: (e: Exercise) => void
  onInfo: (e: Exercise) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {exercises.map((exercise) => {
        const isSelected = selected.has(exercise.id)
        return (
          <div
            key={exercise.id}
            className={cn(
              'relative overflow-hidden rounded-lg transition-shadow',
              isSelected && 'ring-2 ring-primary',
            )}
            style={{ contentVisibility: 'auto', containIntrinsicSize: '160px 176px' }}
          >
            <button type="button" onClick={() => onTap(exercise)} className="block w-full text-left">
              <ExerciseMedia exercise={exercise} animate={false} className="aspect-square w-full" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 pb-1.5 pt-6">
                <p className="line-clamp-2 text-xs font-medium leading-tight text-white">{exercise.name}</p>
              </div>
            </button>

            {isSelected && (
              <span className="absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg">
                <Check className="size-5" strokeWidth={3} />
              </span>
            )}

            {selectable && (
              <button
                type="button"
                onClick={() => onInfo(exercise)}
                aria-label={`Ver execução de ${exercise.name}`}
                className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"
              >
                <Info className="size-3.5" />
              </button>
            )}

            {exercise.is_custom && (
              <span className="absolute left-1.5 top-1.5 rounded-full bg-accent/90 px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                Meu
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function EmptySearchState({ term, onCreate }: { term: string; onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-6 text-center">
      <p className="text-sm text-muted">Nenhum exercício encontrado para "{term}".</p>
      <Button size="sm" variant="outline" onClick={onCreate}>
        <Plus /> Criar "{term}" como exercício personalizado
      </Button>
    </div>
  )
}
