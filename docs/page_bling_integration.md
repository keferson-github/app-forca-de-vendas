Viewed bling_automation_guide.md:1-29

Com base na tela de **Integração Bling** que você compartilhou, aqui está a descrição detalhada da função de cada recurso e campo:

### 1. Card "API OAuth" (Autenticação)
Este card gerencia a "chave" de acesso entre o seu aplicativo e o Bling.
*   **Botão "Conectar":** É o ponto de partida. Ao clicar nele, você é levado ao Bling para autorizar que este sistema leia seus produtos e envie pedidos.
*   **URL de redirecionamento:** Este é o endereço de segurança que você deve copiar e colar dentro do cadastro do seu aplicativo **lá no painel do Bling**. Ele garante que o Bling saiba para onde voltar após você clicar em "Autorizar".
*   **Informações de Status (Conectado em, Empresa Bling, etc.):** Mostram o "estado de saúde" da conexão. Quando conectado, exibirá o ID da sua empresa no Bling e a validade da conexão.

### 2. Card "Webhook & Sincronização" (Automação)
Aqui é onde configuramos como os dados fluem automaticamente.
*   **URL do Webhook:** É o endereço que você cadastra no Bling para que ele "avise" o seu app sempre que um produto mudar ou o estoque for alterado. Sem isso, o tempo real não funciona.
*   **Botão "Sincronia Incremental (1h)":** Um botão de emergência. Se você acha que algo não atualizou nos últimos minutos, clique aqui para forçar uma busca apenas do que mudou na última hora.
*   **Botão "Sincronia Completa":** Deve ser usado na primeira vez que você usar o sistema ou se quiser "zerar" e alinhar tudo. Ele percorre todo o seu catálogo do Bling e traz para o app.
*   **Eventos de Webhook recebidos:** Um contador em tempo real. Se o número subir, significa que o Bling está conseguindo conversar com o seu aplicativo com sucesso.
*   **Último evento:** Mostra qual foi a última ação recebida (ex: "estoque alterado") e o horário, servindo como um log de monitoramento.

### 3. Card "Configuração no Bling" (Instruções)
*   Este bloco é um manual de bolso. Ele te lembra quais permissões (escopos) você deve dar ao aplicativo dentro do Bling e como configurar a segurança (`X-Bling-Signature-256`) para que ninguém mal-intencionado consiga enviar dados falsos para o seu sistema.

### 4. Status Superior (Canto direito)
*   **Tag "Não conectado" / "Conectado":** Um indicador visual rápido. Se estiver em vermelho/cinza (Não conectado), o sistema está "cego" em relação ao Bling. Se estiver em verde (Conectado), a automação está ativa.

**Em resumo:** A coluna da esquerda cuida da **segurança e acesso**, e a coluna da direita cuida da **movimentação dos dados**. O seu objetivo é deixar o status como "Conectado" e ver o contador de webhooks subir conforme você trabalha no Bling.