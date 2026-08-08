# Integração com a Hotmart

A BV Cartórios vende pela Hotmart. Isso define uma fronteira que vale enunciar
antes de qualquer código:

> **A Hotmart é dona do dinheiro. A plataforma é dona do acesso.**

Checkout, meios de pagamento, recorrência, cupom, reembolso e nota fiscal são
responsabilidade da Hotmart. A aplicação nunca vê cartão nem Pix; ela apenas
descobre, por webhook, que alguém comprou — e libera ou revoga o acesso.

> **Status**: planejado (módulo 5 do [`ROADMAP.md`](ROADMAP.md)). Este documento
> fixa as decisões de arquitetura para que os módulos anteriores já deixem as
> costuras no lugar.

## Consequências para a arquitetura

1. **A conta nasce da compra, não de um cadastro.** Quando o webhook de compra
   aprovada chega, o comprador pode nunca ter acessado o site. A aplicação cria
   o `User` a partir do e-mail e do nome do payload, **sem senha utilizável**, e
   envia um link de definição de senha. É o mesmo fluxo das contas migradas do
   sistema legado — um mecanismo, três portas de entrada (comprou, foi migrado,
   esqueceu a senha).

2. **O e-mail é a chave de identidade.** É o único dado que a Hotmart e a
   plataforma compartilham de forma estável. Ele é normalizado (minúsculas, sem
   espaços) na escrita, em ambos os lados da integração.

3. **O acesso é derivado, nunca digitado.** Nenhuma tela do admin concede acesso
   manualmente em operação normal; quem concede é o evento. Isso mantém uma
   fonte única de verdade e evita a divergência clássica entre "pagou" e "tem
   acesso".

4. **Todo evento é registrado antes de ser processado.** A Hotmart reenvia
   eventos e não garante ordem de entrega. Sem registro não há como reprocessar
   nem auditar.

## Autenticação nas APIs

Duas coisas diferentes, que costumam ser confundidas:

| O quê | Para quê | Como |
| --- | --- | --- |
| `hottok` | Validar que **um webhook recebido** veio mesmo da Hotmart | Token da conta, comparado com o valor que chega na requisição |
| OAuth2 *client credentials* | **Chamar** as APIs da Hotmart | `POST https://api-sec-vlc.hotmart.com/security/oauth/token` com `grant_type=client_credentials`, `client_id` e `client_secret`; devolve um *access token* de vida curta |

As credenciais (`client_id`, `client_secret` e o `Basic`) são geradas no painel
da Hotmart em **Ferramentas → Credenciais de desenvolvedor**. O `hottok` fica na
aba de autenticação do Webhook.

A comparação do `hottok` usa comparação de tempo constante. Um `===` comum
vaza, pelo tempo de resposta, quantos caracteres iniciais bateram.

## Eventos e o que cada um faz

Os nomes abaixo seguem a versão 2.0.0 do webhook. **Devem ser conferidos contra
o painel da conta antes da implementação** — a documentação da Hotmart não é
acessível a partir do ambiente de desenvolvimento atual, então esta tabela é
ponto de partida, não fonte de verdade.

| Evento | Efeito no `Subscription` |
| --- | --- |
| Compra aprovada | cria/renova, `status = ACTIVE`, `endsAt` = fim do ciclo |
| Compra completa | confirma o ciclo (fim da garantia) |
| Compra atrasada | `status = PAST_DUE`, acesso mantido durante a carência |
| Compra cancelada | `status = CANCELED` |
| Reembolso | `status = CANCELED`, acesso revogado |
| Chargeback | `status = CANCELED`, acesso revogado |
| Disputa | registrado; sem efeito no acesso até a resolução |
| Cancelamento de assinatura | `autoRenew = false`; **acesso mantido até `endsAt`** |
| Troca de plano | aponta a assinatura para o novo `Plan` |
| Mudança da data de cobrança | atualiza `endsAt` |

O cancelamento merece atenção: quem cancela hoje pagou pelo período corrente e
continua com direito a ele. Revogar na hora é erro de produto e gera reclamação
com razão.

## Modelo de dados

O schema atual já acomoda a integração — `Subscription.gateway`,
`gatewayCustomerId` e `gatewaySubscriptionId` foram desenhados genéricos.
O mapeamento fica:

| Campo no schema | Valor vindo da Hotmart |
| --- | --- |
| `Subscription.gateway` | `"hotmart"` |
| `Subscription.gatewaySubscriptionId` | código do assinante (`subscriber_code`) |
| `Payment.gatewayPaymentId` | código da transação |
| `Payment.rawPayload` | payload bruto do evento |

Faltam duas coisas, que entram por migration no módulo 5:

- **`Plan.hotmartProductId` e `Plan.hotmartOfferCode`** — para traduzir a oferta
  comprada no plano correspondente. Sem isso não há como saber se a compra foi
  do mensal ou do trimestral.
- **`WebhookEvent`** — `id` do evento, tipo, payload, `receivedAt`,
  `processedAt`, `status` e `error`. Garante idempotência (evento repetido é
  ignorado), permite reprocessar o que falhou e serve de trilha de auditoria.

`Plan.checkoutUrl` também será necessário: o botão "Assinar" da home passa a
apontar para a página de checkout da oferta na Hotmart, não para uma rota
interna.

## Ambiente de testes

A Hotmart oferece *sandbox*. O ensaio da integração é feito lá, com compras de
teste, antes de apontar o webhook de produção — inclusive os casos que ninguém
gosta de testar: reembolso, chargeback e troca de plano.

## Variáveis de ambiente

Documentadas em `.env.example`; preenchidas quando o módulo 5 entrar.

```
HOTMART_HOTTOK           # valida os webhooks recebidos
HOTMART_CLIENT_ID        # credenciais de desenvolvedor
HOTMART_CLIENT_SECRET
HOTMART_BASIC            # header Basic fornecido junto das credenciais
```

## Riscos conhecidos

- **E-mail divergente.** A pessoa compra com um e-mail e espera entrar com
  outro. Não há solução automática segura; o admin precisa de uma tela para
  vincular a compra à conta certa, com registro de quem fez a alteração.
- **Webhook perdido.** Se a aplicação estiver fora do ar, o evento pode se
  perder. Mitigação: rotina de reconciliação que consulta a API de assinaturas
  da Hotmart e corrige divergências.
- **Reembolso após uso.** O acesso é revogado, mas o histórico de respostas do
  aluno permanece — decisão consciente, para que uma recompra futura reencontre
  o progresso.

## Fontes

- [Credenciais e APIs da Hotmart](https://help.hotmart.com/en/article/4403617024013/discover-hotmart-s-apis)
- [Autenticação de aplicação (OAuth2)](https://developers.hotmart.com/docs/en/start/app-auth)
- [Configuração do Webhook/Postback](https://help.hotmart.com/en/article/360001491352/how-do-i-set-up-my-product-s-api-using-the-webhook-postback-)
- [Uso de webhook para assinaturas](https://developers.hotmart.com/docs/en/tutorials/use-webhook-for-subscriptions/)
- [Sandbox](https://developers.hotmart.com/docs/en/start/sandbox/)
