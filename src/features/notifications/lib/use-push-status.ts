import { useEffect, useState } from 'react'

export type PushPermissionState = 'unsupported' | 'default' | 'denied' | 'granted'

function readPermission(): PushPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

/** Reflete Notification.permission — não há evento nativo de mudança, então relemos ao focar a aba. */
export function usePushPermission(): PushPermissionState {
  const [state, setState] = useState<PushPermissionState>(readPermission)

  useEffect(() => {
    function refresh() {
      setState(readPermission())
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])

  return state
}
