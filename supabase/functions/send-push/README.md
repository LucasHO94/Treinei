# send-push (Fase 4)

Edge Function invocada pelo `notifications-cron` (ou manualmente para testes).

Responsabilidade: montar o payload da notificação (refeição ou lembrete de treino) e
enviar via Web Push (VAPID) para todas as `push_subscriptions` do usuário. Remover
subscriptions que respondam 404/410 (expiradas).

Ver PLANEJAMENTO.md, seção 3.4-B para o fluxo completo.
