import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { CatalogPage } from './catalog-page'
import type { Exercise } from '@/types/domain'

interface ExercisePickerSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (exercise: Exercise) => void
}

/** Reaproveita o catálogo em modo seleção — usado pelo builder para adicionar exercícios a uma divisão. */
export function ExercisePickerSheet({ open, onOpenChange, onSelect }: ExercisePickerSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-h-[90svh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Adicionar exercício</SheetTitle>
        </SheetHeader>
        <CatalogPage
          embedded
          onSelect={(exercise) => {
            onSelect(exercise)
            onOpenChange(false)
          }}
        />
      </SheetContent>
    </Sheet>
  )
}
