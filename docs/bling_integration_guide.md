# Guia de Sincronização Automática - Bling API v3

Este documento detalha a implementação técnica e os procedimentos operacionais para manter o estoque do aplicativo sincronizado com o ERP Bling de forma 100% automática e em tempo real.

---

## 1. Lógica de "Auto-Criação" (Upsert)
A base da automação é a capacidade do sistema de se adaptar a novos produtos sem intervenção manual.

*   **Onde está o código:** `lib/bling-sync.ts` -> função `applyBlingProductSnapshot`.
*   **Como funciona:**
    1. O sistema recebe um "Snapshot" (foto) de um produto do Bling (via Webhook ou busca automática).
    2. Ele tenta localizar o produto no banco local pelo `blingProductId` ou pelo `code` (SKU).
    3. **Se encontrado:** Atualiza os campos de preço, estoque e nome.
    4. **Se não encontrado:** O sistema cria um novo registro de produto automaticamente.
    5. **Configurações Padrão:** Produtos criados automaticamente recebem a categoria `ACESSORIOS` e subcategoria `GERAL` por padrão.

---

## 2. Sincronização em Tempo Real (Webhooks)
Utilizado para atualizações instantâneas de estoque e preço.

*   **Funcionamento:** Sempre que você altera um estoque ou produto no Bling, ele envia um aviso (PUSH) para o seu servidor.
*   **Endpoint de Recebimento:** `https://seu-dominio.com/api/bling/webhook`
*   **Configuração no Bling:**
    1. Vá em **Configurações > Integrações > Configurações de Integrações**.
    2. Acesse o seu aplicativo e vá na aba **Webhooks**.
    3. Informe a URL acima.
    4. Selecione os eventos de **Produtos** e **Estoques**.

---

## 3. Sincronização Incremental (Foco: 5 minutos)
Funciona como uma rede de segurança para capturar qualquer alteração que o Webhook possa ter perdido.

*   **Onde está o código:** `lib/bling-sync.ts` -> função `syncProductsFromBlingIncremental`.
*   **Endpoint:** `GET /api/bling/sync/incremental?minutes=15`
*   **Vantagem:** É um processo extremamente leve que busca apenas o que mudou nos últimos minutos, evitando sobrecarga na API do Bling.
*   **Configuração de Automação:**
    *   Utilize um serviço como [cron-job.org](https://cron-job.org/) ou Vercel Cron.
    *   Configure para chamar o endpoint acima a cada **5 ou 10 minutos**.

---

## 4. Sincronização Completa (Segurança Total)
Utilizado para auditoria completa e alinhamento total de bases.

*   **Onde está o código:** `lib/bling-sync.ts` -> função `syncProductsFromBlingFull`.
*   **Endpoint:** `GET /api/bling/sync/full`
*   **Funcionamento:** Percorre todas as páginas de produtos do Bling (100 por vez) e garante que o banco local está idêntico ao ERP.
*   **Recomendação:** Executar manualmente após grandes alterações no Bling ou agendar um Cron diário (ex: às 03:00 da manhã).

---

## 5. Interface de Gestão
No menu **Integrações > Bling**, você agora encontrará:

*   **Status da Conexão:** Informa se o OAuth está ativo.
*   **URL do Webhook:** Facilitada para cópia e colagem no painel do Bling.
*   **Botões de Sincronia Manual:** Atalhos para disparar a sincronia Incremental (última hora) ou a Completa.
*   **Logs de Eventos:** Contador de quantos webhooks foram processados e o horário do último recebimento.

---

## Como configurar o CRON de 5 minutos (Exemplo: cron-job.org)
1. Crie uma conta gratuita em [cron-job.org](https://cron-job.org/).
2. Clique em **"Create Cronjob"**.
3. No título, coloque: `App Força de Vendas - Sync Bling`.
4. Na URL, coloque: `https://seu-dominio.com/api/bling/sync/incremental?minutes=10`
5. No campo **Schedule**, selecione **"Every 5 minutes"**.
6. Clique em **"Create"**.

Pronto! Agora o sistema se manterá atualizado sem que você precise abrir a página de produtos.
