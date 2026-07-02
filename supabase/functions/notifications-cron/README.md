# notifications-cron (Fase 4)

Disparada pelo `pg_cron` a cada minuto. Seleciona `notification_schedules` cujo
`send_time` bate com o horário atual (no timezone do usuário) e `last_sent_on`
ainda não é hoje, então invoca `send-push` para cada uma.

Ver PLANEJAMENTO.md, seção 3.4-B para o fluxo completo e o SQL do cron.
