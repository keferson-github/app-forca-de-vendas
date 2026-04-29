# Operação da sincronização com o Bling

A partir de agora, a ideia é que não seja necessário atualizar manualmente os produtos no app.

## Fluxo de atualização

### 1. Atualização automática por cron

O cron incremental roda a cada 5 minutos.

Ele chama:

```text
/api/bling/sync/incremental?minutes=10
```

Esse endpoint busca produtos alterados recentemente no Bling e atualiza no app.

### 2. Atualização completa diária

O cron full roda 1 vez por dia, às 03:00.

Ele chama:

```text
/api/bling/sync/full
```

Esse endpoint funciona como uma auditoria para corrigir qualquer informação que o incremental tenha perdido.

### 3. Webhook em tempo real

Se o webhook do Bling estiver configurado no painel do Bling, alterações de produto e estoque podem chegar imediatamente no app.

Se o webhook falhar ou atrasar, o cron incremental corrige a informação em até alguns minutos.

## Uso esperado

1. Você altera produto ou estoque no Bling.
2. O app atualiza automaticamente.
3. Você só usa os botões manuais se quiser forçar uma sincronização pontual.

## Configuração dos crons

### Cron incremental

Use este cron para manter o app atualizado durante o dia.

```text
URL: https://app-forca-de-vendas.vercel.app/api/bling/sync/incremental?minutes=10
Método: GET
Frequência: a cada 5 minutos
Expressão: */5 * * * *
Header: x-cron-secret: <CRON_SECRET>
```

### Cron full

Use este cron como auditoria diária da base de produtos.

```text
URL: https://app-forca-de-vendas.vercel.app/api/bling/sync/full
Método: GET
Frequência: todos os dias às 03:00
Expressão: 0 3 * * *
Header: x-cron-secret: <CRON_SECRET>
```

## Segurança

Os endpoints de cron aceitam chamadas externas somente quando o header `x-cron-secret` contém o mesmo valor configurado na variável de ambiente `CRON_SECRET`.

Sem esse header, a rota exige usuário autenticado no app.

## Ponto importante

Produtos criados ou editados manualmente no app também tentam sincronizar com o Bling.

Para o fluxo de estoque, porém, o Bling deve ser tratado como a fonte principal.
