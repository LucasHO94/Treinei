import { useState } from 'react'
import { Search, Dumbbell, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { useMuscleGroups, useExercisesByGroup, useExerciseSearch } from '@/features/workout/lib/queries'
import { CreateExerciseSheet } from './create-exercise-sheet'
import { cn } from '@/lib/utils'
import type { Exercise, MuscleGroup } from '@/types/domain'

interface CatalogPageProps {
  /** Quando fornecido, a página opera em modo seleção (usada pelo builder para adicionar exercícios). */
  onSelect?: (exercise: Exercise) => void
  /** Oculta o título e o padding externo — usado ao embutir a página dentro de um Sheet. */
  embedded?: boolean
}

export function CatalogPage({ onSelect, embedded = false }: CatalogPageProps) {
  const muscleGroups = useMuscleGroups()
  const [search, setSearch] = useState('')
  const searchResults = useExerciseSearch(search)
  const [createOpen, setCreateOpen] = useState(false)
  const [createGroupId, setCreateGroupId] = useState<number | undefined>(undefined)

  const isSearching = search.trim().length > 0

  return (
    <div className={cn('flex flex-col gap-4', !embedded && 'p-4')}>
      {embedded ? (
        <Button
          size="sm"
          variant="outline"
          className="self-end"
          onClick={() => {
            setCreateGroupId(undefined)
            setCreateOpen(true)
          }}
        >
          <Plus /> Exercício
        </Button>
      ) : (
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Catálogo</h1>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setCreateGroupId(undefined)
              setCreateOpen(true)
            }}
          >
            <Plus /> Exercício
          </Button>
        </header>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <Input
          placeholder="Buscar exercício..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isSearching ? (
        <div className="flex flex-col gap-2">
          {(searchResults ?? []).map((exercise) => (
            <ExerciseRow key={exercise.id} exercise={exercise} onSelect={onSelect} />
          ))}
          {searchResults != null && searchResults.length === 0 && (
            <EmptySearchState term={search} onCreate={() => setCreateOpen(true)} />
          )}
        </div>
      ) : (
        <Accordion type="multiple" className="flex flex-col">
          {(muscleGroups ?? []).map((group) => (
            <MuscleGroupAccordionItem
              key={group.id}
              group={group}
              onSelect={onSelect}
              onCreateExercise={() => {
                setCreateGroupId(group.id)
                setCreateOpen(true)
              }}
            />
          ))}
        </Accordion>
      )}

      <CreateExerciseSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultMuscleGroupId={createGroupId}
        initialName={isSearching ? search : undefined}
        onCreated={onSelect}
      />
    </div>
  )
}

function MuscleGroupAccordionItem({
  group,
  onSelect,
  onCreateExercise,
}: {
  group: MuscleGroup
  onSelect?: (exercise: Exercise) => void
  onCreateExercise: () => void
}) {
  const exercises = useExercisesByGroup(group.id)

  return (
    <AccordionItem value={String(group.id)}>
      <AccordionTrigger>{group.name}</AccordionTrigger>
      <AccordionContent>
        {(exercises ?? []).map((exercise) => (
          <ExerciseRow key={exercise.id} exercise={exercise} onSelect={onSelect} />
        ))}
        <button
          type="button"
          onClick={onCreateExercise}
          className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-primary hover:bg-surface"
        >
          <Plus className="size-4" /> Criar exercício em {group.name}
        </button>
      </AccordionContent>
    </AccordionItem>
  )
}

function ExerciseRow({ exercise, onSelect }: { exercise: Exercise; onSelect?: (exercise: Exercise) => void }) {
  const content = (
    <>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface text-muted">
        <Dumbbell className="size-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{exercise.name}</p>
        {exercise.is_custom && <p className="text-xs text-muted">Personalizado</p>}
      </div>
    </>
  )

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={() => onSelect(exercise)}
        className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-surface"
      >
        {content}
      </button>
    )
  }

  return <div className="flex items-center gap-3 rounded-md px-2 py-2">{content}</div>
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
