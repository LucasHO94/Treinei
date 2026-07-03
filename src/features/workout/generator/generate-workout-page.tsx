import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowLeftRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCurrentUserId } from '@/lib/auth/current-user'
import { useExerciseMap } from '@/features/workout/lib/queries'
import { createGeneratedRoutine } from '@/features/workout/lib/actions'
import { cn } from '@/lib/utils'
import type { Exercise } from '@/types/domain'
import {
  GOAL_OPTIONS,
  REGION_OPTIONS,
  EQUIPMENT_MODE_OPTIONS,
  generateWorkoutPlan,
  findExerciseSubstitutes,
  type Goal,
  type Level,
  type EquipmentMode,
  type GeneratedWorkout,
} from './engine'
import { ExerciseSubstituteSheet } from './exercise-substitute-sheet'

const LEVEL_OPTIONS: { key: Level; label: string }[] = [
  { key: 'iniciante', label: 'Iniciante' },
  { key: 'intermediário', label: 'Intermediário' },
  { key: 'avançado', label: 'Avançado' },
]

export function GenerateWorkoutPage() {
  const navigate = useNavigate()
  const userId = useCurrentUserId()
  const exerciseMap = useExerciseMap()
  const allExercises = useMemo(() => [...exerciseMap.values()], [exerciseMap])

  const [goals, setGoals] = useState<Goal[]>([])
  const [regionKeys, setRegionKeys] = useState<string[]>([])
  const [level, setLevel] = useState<Level>('intermediário')
  const [daysPerWeek, setDaysPerWeek] = useState(3)
  const [equipmentMode, setEquipmentMode] = useState<EquipmentMode>('academia')

  const [plan, setPlan] = useState<GeneratedWorkout[]>()
  const [swapTarget, setSwapTarget] = useState<{ divisionIndex: number; exerciseIndex: number; exercise: Exercise }>()
  const [saving, setSaving] = useState(false)

  const canGenerate = goals.length > 0 && regionKeys.length > 0 && allExercises.length > 0

  // Atualização funcional (não a partir do `list` capturado no closure): garante que
  // selecionar vários chips em sequência rápida não perca uma seleção por causa de
  // batching de estado do React operando sobre um snapshot desatualizado.
  function toggle<T>(value: T, setter: React.Dispatch<React.SetStateAction<T[]>>) {
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  }

  function handleGenerate() {
    const result = generateWorkoutPlan({ goals, regionKeys, level, daysPerWeek, equipmentMode, exercises: allExercises })
    setPlan(result)
  }

  function handleSwap(divisionIndex: number, exerciseIndex: number, replacement: Exercise) {
    setPlan((prev) => {
      if (!prev) return prev
      const next = [...prev]
      const division = { ...next[divisionIndex] }
      const exercises = [...division.exercises]
      exercises[exerciseIndex] = { ...exercises[exerciseIndex], exercise: replacement }
      division.exercises = exercises
      next[divisionIndex] = division
      return next
    })
    setSwapTarget(undefined)
  }

  async function handleUsePlan() {
    if (!plan || plan.length === 0) return
    setSaving(true)
    try {
      const goalLabels = GOAL_OPTIONS.filter((g) => goals.includes(g.key)).map((g) => g.label)
      const routine = await createGeneratedRoutine(userId, `Sugestão: ${goalLabels.join(' + ')}`, plan)
      navigate(`/treino/rotina/${routine.id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <header className="flex items-center gap-2">
        <button type="button" onClick={() => navigate('/treino')} aria-label="Voltar">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-xl font-bold">Treino sugerido</h1>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-muted">Objetivo (selecione um ou mais)</h2>
        <div className="flex flex-wrap gap-2">
          {GOAL_OPTIONS.map((g) => (
            <Chip key={g.key} active={goals.includes(g.key)} onClick={() => toggle(g.key, setGoals)}>
              {g.label}
            </Chip>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-muted">Região do corpo</h2>
        <div className="flex flex-wrap gap-2">
          {REGION_OPTIONS.map((r) => (
            <Chip key={r.key} active={regionKeys.includes(r.key)} onClick={() => toggle(r.key, setRegionKeys)}>
              {r.label}
            </Chip>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-muted">Nível</h2>
        <div className="flex flex-wrap gap-2">
          {LEVEL_OPTIONS.map((l) => (
            <Chip key={l.key} active={level === l.key} onClick={() => setLevel(l.key)}>
              {l.label}
            </Chip>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-muted">Dias por semana</h2>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map((d) => (
            <Chip key={d} active={daysPerWeek === d} onClick={() => setDaysPerWeek(d)}>
              {d}
            </Chip>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-muted">Equipamento disponível</h2>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_MODE_OPTIONS.map((e) => (
            <Chip key={e.key} active={equipmentMode === e.key} onClick={() => setEquipmentMode(e.key)}>
              {e.label}
            </Chip>
          ))}
        </div>
      </section>

      <Button size="lg" onClick={handleGenerate} disabled={!canGenerate}>
        <Sparkles className="size-4" /> Gerar treino
      </Button>

      {plan && plan.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted">
          Nenhum exercício compatível foi encontrado para essa combinação. Tente outra região ou equipamento.
        </p>
      )}

      {plan && plan.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-bold">Prévia da rotina</h2>
          {plan.map((division, divisionIndex) => (
            <div key={division.name} className="rounded-lg border border-border bg-card p-4">
              <p className="mb-2 font-semibold">{division.name}</p>
              <div className="flex flex-col gap-2">
                {division.exercises.map((item, exerciseIndex) => (
                  <div key={item.exercise.id} className="flex items-center justify-between gap-2 rounded-md bg-surface p-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.exercise.name}</p>
                      <p className="text-xs text-muted">
                        {item.sets}× {item.targetReps} reps · descanso {item.restSeconds}s
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSwapTarget({ divisionIndex, exerciseIndex, exercise: item.exercise })}
                      aria-label={`Substituir ${item.exercise.name}`}
                      className="shrink-0 text-muted hover:text-accent"
                    >
                      <ArrowLeftRight className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <Button size="lg" variant="accent" onClick={() => void handleUsePlan()} disabled={saving}>
            {saving ? 'Criando rotina...' : 'Usar este treino'}
          </Button>
        </div>
      )}

      {swapTarget && (
        <ExerciseSubstituteSheet
          open
          onOpenChange={(open) => !open && setSwapTarget(undefined)}
          exercise={swapTarget.exercise}
          substitutes={findExerciseSubstitutes(swapTarget.exercise, allExercises, level, equipmentMode, goals)}
          onSelect={(replacement) => handleSwap(swapTarget.divisionIndex, swapTarget.exerciseIndex, replacement)}
        />
      )}
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'bg-surface text-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
