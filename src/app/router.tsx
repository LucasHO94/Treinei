import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppLayout } from './layout'
import { TodayPage } from '@/features/today/today-page'

// Code-splitting por rota: só a aba "Hoje" (index) entra no bundle inicial —
// as demais carregam sob demanda, reduzindo o JS avaliado no primeiro paint.
const WorkoutPage = lazy(() =>
  import('@/features/workout/workout-page').then((m) => ({ default: m.WorkoutPage })),
)
const CatalogPage = lazy(() =>
  import('@/features/workout/catalog/catalog-page').then((m) => ({ default: m.CatalogPage })),
)
const RoutineBuilderPage = lazy(() =>
  import('@/features/workout/builder/routine-builder-page').then((m) => ({ default: m.RoutineBuilderPage })),
)
const ExecutionPage = lazy(() =>
  import('@/features/workout/execution/execution-page').then((m) => ({ default: m.ExecutionPage })),
)
const HistoryPage = lazy(() =>
  import('@/features/workout/history/history-page').then((m) => ({ default: m.HistoryPage })),
)
const DietPage = lazy(() => import('@/features/diet/diet-page').then((m) => ({ default: m.DietPage })))
const MealDetailPage = lazy(() =>
  import('@/features/diet/meals/meal-detail-page').then((m) => ({ default: m.MealDetailPage })),
)
const ProfilePage = lazy(() =>
  import('@/features/profile/profile-page').then((m) => ({ default: m.ProfilePage })),
)

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<TodayPage />} />
        <Route path="treino" element={<WorkoutPage />} />
        <Route path="treino/catalogo" element={<CatalogPage />} />
        <Route path="treino/historico" element={<HistoryPage />} />
        <Route path="treino/rotina/:routineId" element={<RoutineBuilderPage />} />
        <Route path="treino/executar/:workoutId" element={<ExecutionPage />} />
        <Route path="dieta" element={<DietPage />} />
        <Route path="dieta/refeicao/:mealId" element={<MealDetailPage />} />
        <Route path="perfil" element={<ProfilePage />} />
      </Route>
    </Routes>
  )
}
