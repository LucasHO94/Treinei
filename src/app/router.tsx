import { Route, Routes } from 'react-router-dom'
import { AppLayout } from './layout'
import { TodayPage } from '@/features/today/today-page'
import { WorkoutPage } from '@/features/workout/workout-page'
import { DietPage } from '@/features/diet/diet-page'
import { ProfilePage } from '@/features/profile/profile-page'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<TodayPage />} />
        <Route path="treino/*" element={<WorkoutPage />} />
        <Route path="dieta/*" element={<DietPage />} />
        <Route path="perfil" element={<ProfilePage />} />
      </Route>
    </Routes>
  )
}
