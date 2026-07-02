import { NavLink } from 'react-router-dom'
import { Home, Dumbbell, Apple, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { to: '/', label: 'Hoje', icon: Home, end: true },
  { to: '/treino', label: 'Treino', icon: Dumbbell, end: false },
  { to: '/dieta', label: 'Dieta', icon: Apple, end: false },
  { to: '/perfil', label: 'Perfil', icon: User, end: false },
] as const

export function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-4">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted hover:text-foreground',
                )
              }
            >
              <Icon className="size-5" strokeWidth={2} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
