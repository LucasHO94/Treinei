import { Route, Routes } from 'react-router-dom'
import { AppLayout } from './layout'
import { TodayPage } from '@/features/today/today-page'
import { WorkoutPage } from '@/features/workout/workout-page'
import { CatalogPage } from '@/features/workout/catalog/catalog-page'
import { RoutineBuilderPage } from '@/features/workout/builder/routine-builder-page'
import { ExecutionPage } from '@/features/workout/execution/execution-page'
import { HistoryPage } from '@/features/workout/history/history-page'
import { DietPage } from '@/features/diet/diet-page'
import { MealDetailPage } from '@/features/diet/meals/meal-detail-page'
import { ProfilePage } from '@/features/profile/profile-page'

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
