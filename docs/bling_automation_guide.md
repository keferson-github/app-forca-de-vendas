# Guia de Configuração Final - Automação Bling

Siga este roteiro exato para finalizar a configuração e colocar o sistema para rodar de forma 100% automática.

---

### Etapa 1: Primeira Conexão (OAuth)
Antes de automatizar, o seu aplicativo precisa de permissão para falar com o seu Bling.

1.  Acesse o seu aplicativo no navegador.
2.  Vá no menu **Integrações > Bling**.
3.  Clique no botão **"Conectar"**.
4.  Você será redirecionado para o Bling. Faça login e clique em **"Autorizar"**.
5.  Após retornar ao app, você verá a mensagem **"Bling conectado com sucesso"**.
    *   *Isso gera o token inicial que o Cron Job usará para trabalhar sozinho.*

---

### Etapa 2: Configuração dos Webhooks (Tempo Real)
Isso faz o Bling "empurrar" as vendas e estoque para o seu app na hora.

1.  No painel do seu app (**Integrações > Bling**), copie a **URL do Webhook**.
    *   Ela será algo como: `https://seu-site.com/api/bling/webhook`
2.  Abra o seu **Bling** em outra aba.
3.  Vá em **Preferências (Engrenagem) > Sistema > Integrações > Configurações de Integrações**.
4.  Clique no seu aplicativo criado.
5.  Clique na aba **Webhooks**.
6.  Em **URL de recebimento**, cole a URL que você copiou.
7.  Na lista abaixo, selecione obrigatoriamente:
    *   **Produtos**: Marcar "Inserir", "Alterar" e "Excluir".
    *   **Estoques**: Marcar "Alterar".
8.  Clique em **Salvar**.

---

### Etapa 3: Configuração do Agendamento (Cron - 5 minutos)
Isso garante que o estoque se atualize mesmo se o passo anterior falhar.

1.  Acesse o site [cron-job.org](https://cron-job.org/) e crie uma conta (é grátis).
2.  Clique em **"Create Cronjob"**.
3.  Preencha exatamente assim:
    *   **Title**: `Sincronia Automática Bling`
    *   **URL**: `https://seu-site.com/api/bling/sync/incremental?minutes=10`
    *   **Schedule**: Selecione **Every 5 minutes**.
    *   **Request Method**: **GET**.
4.  Clique em **Create**.

---

### Etapa 4: Carga Inicial de Dados
Para o sistema não começar "vazio".

1.  Volte para a tela de **Integrações > Bling** no seu aplicativo.
2.  Clique no botão **"Sincronia Completa"**.
3.  Aguarde a finalização (uma mensagem mostrará quantos produtos foram criados/atualizados).

---

## Como testar se deu certo?

1.  Vá no seu **Bling** e altere o estoque de um produto qualquer (mude de 10 para 15, por exemplo).
2.  Abra a página de **Produtos** no seu aplicativo.
3.  O estoque deve ter mudado para 15 automaticamente em poucos segundos (via Webhook).
4.  Se não mudar na hora, espere 5 minutos (o Cron Job fará a correção).

**Pronto! A partir deste momento, você não precisa mais se preocupar com a atualização manual.**