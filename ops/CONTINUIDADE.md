# Continuidade da Educalizando

Os endpoints de monitoramento exigem `Authorization: Bearer CRON_SECRET`.

Os agendamentos padrão na Vercel são diários. Para recuperação mais rápida do carrinho e monitoramento contínuo, agende na VPS:

- `/api/cron/abandoned-cart-reminders`: a cada 15 minutos.
- `/api/cron/platform-alerts`: a cada 10 minutos.
- `/api/cron/favorite-price-alerts`: a cada hora.

Configure `ADMIN_ALERT_WHATSAPP` com o número administrativo e `ADMIN_ALERT_EMAIL` com o e-mail administrativo. O e-mail permite receber alertas quando a própria Evolution estiver indisponível.

## Recuperação de falhas

1. Consulte `/admin/operacao` para identificar o serviço afetado.
2. Se o banco ou MinIO estiver indisponível, pause vendas até confirmar acesso aos materiais.
3. Se a Evolution cair, reconecte a instância e reenvie notificações pendentes pelo painel de entregas.
4. Se o pagamento falhar, confirme o status no provedor e reprocesse o webhook. Não libere materiais apenas pelo retorno do navegador.
5. Após normalizar, teste login, checkout, acesso do cliente, download e notificações.

Backups estão fora desta atualização conforme solicitado.
