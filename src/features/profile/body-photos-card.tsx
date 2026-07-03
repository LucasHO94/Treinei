import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useBodyPhotos } from './lib/queries'
import { addBodyPhoto, deleteBodyPhoto } from './lib/actions'
import { uploadBodyPhoto, bodyPhotoSignedUrl } from '@/lib/supabase/storage'
import type { BodyPhoto } from '@/types/domain'

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y.slice(2)}`
}

/** Miniatura de foto corporal: resolve a signed URL (bucket privado) sob demanda. */
function BodyPhotoThumb({ photo, onDelete }: { photo: BodyPhoto; onDelete: (p: BodyPhoto) => void }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void bodyPhotoSignedUrl(photo.storage_path).then((u) => {
      if (active) setUrl(u)
    })
    return () => {
      active = false
    }
  }, [photo.storage_path])

  return (
    <div className="relative overflow-hidden rounded-lg bg-surface">
      <div className="aspect-[3/4] w-full">
        {url ? (
          <img src={url} alt={`Foto de ${formatDate(photo.taken_on)}`} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-muted">
            <Loader2 className="size-5 animate-spin" />
          </div>
        )}
      </div>
      <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
        {formatDate(photo.taken_on)}
      </span>
      <button
        type="button"
        onClick={() => onDelete(photo)}
        aria-label="Excluir foto"
        className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-black/60 text-white active:scale-95"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  )
}

export function BodyPhotosCard({ userId, canUpload }: { userId: string; canUpload: boolean }) {
  const photos = useBodyPhotos(userId)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const path = await uploadBodyPhoto(userId, file)
      await addBodyPhoto(userId, path)
    } catch (err) {
      setError('Não foi possível enviar a foto. ' + (err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(photo: BodyPhoto) {
    await deleteBodyPhoto(photo)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução corporal</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {canUpload ? (
          <>
            <p className="text-xs text-muted">
              Suas fotos ficam privadas (só você acessa) e servem para acompanhar sua evolução.
            </p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-4 text-sm font-medium text-muted hover:text-foreground disabled:opacity-60"
            >
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
              {uploading ? 'Enviando...' : 'Adicionar foto'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={handlePick} />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </>
        ) : (
          <p className="text-xs text-muted">Entre com uma conta para enviar e guardar suas fotos de evolução.</p>
        )}

        {photos && photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p) => (
              <BodyPhotoThumb key={p.id} photo={p} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
