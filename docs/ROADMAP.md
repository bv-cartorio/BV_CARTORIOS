# Roadmap de módulos

Ordem de entrega proposta. Cada módulo tem seu plano detalhado (rotas,
componentes e mudanças de schema) apresentado para aprovação **antes** da
implementação.

## Entregue

### 0. Fundação

- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4
- PostgreSQL + Prisma 7 com migration inicial versionada
- Modelo de dados completo do núcleo (24 models) — ver [`ERD.md`](ERD.md)
- Seed idempotente: taxonomia, bancas, planos, admin e questões de exemplo
- Validação de variáveis de ambiente com Zod; `.env.example` documentado
- Home de vendas com planos e matérias lidos do banco
- Identidade visual da marca aplicada (wordmark vetorial, paleta e favicon)
- README, ERD e plano de migração documentados

### 1. Autenticação e conta

- login, logout, autocadastro com confirmação de e-mail, recuperação de senha e
  definição de senha no primeiro acesso — os três caminhos de entrada (cadastro,
  compra na Hotmart, migração do legado) convergem para o mesmo token por e-mail
- sessão por cookie httpOnly; o banco guarda só o hash do token, então vazamento
  do banco não permite forjar sessão
- rate limiting de login por e-mail e por IP, persistido no banco
- guardas `exigirUsuario`, `exigirPapel` e `exigirAssinatura`; a guarda de
  assinatura já está no lugar e passa a encontrar dados quando a Hotmart entrar
- envio de e-mail com implementação de console em desenvolvimento; falha
  explícita em produção enquanto o provedor não for escolhido

### 2. Área do aluno — resolver questões

- busca por texto ou número da questão e filtros de matéria, assunto,
  subassunto, banca, ano, situação e favoritas — tudo na URL, então o link é
  compartilhável e o botão voltar funciona
- resolução com correção imediata, comentário do professor e vídeo quando
  houver; o aluno pode responder de novo (o histórico guarda toda tentativa)
- favoritas, anotação pessoal por questão e reporte de erro para a revisão
  editorial
- **gabarito e comentário nunca vão para o navegador antes de a questão ser
  respondida** — só a server action de resposta os devolve
- acesso gratuito por cota diária (ver decisões abaixo)

Sem migration: `Answer`, `Favorite`, `QuestionNote` e `QuestionReport` já
existiam desde a fundação.

## Próximos módulos

### 3. Admin — questões e taxonomia

CRUD de questões com editor de texto rico e sanitização na escrita, campo de
vídeo, status editorial (rascunho → revisão → publicada), importação CSV,
gestão de matérias/assuntos/subassuntos e fila de erros reportados.

**Depende de**: 1. Pode correr em paralelo com o 2.

### 4. Migração do sistema legado

Scripts, saneamento, validação e ensaio completo em homologação.
Ver [`MIGRACAO.md`](MIGRACAO.md).

**Depende de**: 2 e 3 (o modelo precisa estar estável) e do dump do legado.

### 5. Integração com a Hotmart

A venda e a cobrança acontecem **fora da aplicação**: o aluno compra no
checkout hospedado da Hotmart e a plataforma reage aos eventos. Ver
[`HOTMART.md`](HOTMART.md).

- receptor de webhook (`POST /api/webhooks/hotmart`) com validação do `hottok`,
  registro de todo evento recebido e processamento idempotente;
- mapeamento oferta da Hotmart → `Plan`, e comprador → `User`;
- liberação e revogação automáticas de acesso conforme o evento;
- consulta à API de assinaturas (OAuth2 *client credentials*) para reconciliar
  divergências e para o painel administrativo;
- página de cobrança do aluno apontando para a área de assinaturas da Hotmart.

Cupom e checkout deixam de ser responsabilidade nossa — são configurados na
Hotmart. O model `Coupon` fica sem uso nesta arquitetura; a decisão de removê-lo
por migration fica para quando o módulo entrar.

**Depende de**: 1 (o vínculo é com uma conta de usuário). Precisa das
credenciais e dos códigos de oferta (abaixo).

### 6. Cadernos e simulados

Cadernos do aluno, simulados cronometrados com correção ao final e comparação
com a média dos demais alunos.

**Depende de**: 2.

### 7. Dashboard do aluno

Percentual de acerto geral e por matéria, evolução temporal, pontos fracos.

**Depende de**: 2 (precisa de volume de respostas para ter sentido).

### 8. Admin — gestão e receita

Alunos e assinaturas, planos (com os códigos de oferta da Hotmart), avisos,
dashboard de receita (MRR) e fila de eventos de webhook com falha, para
reprocessamento manual.

**Depende de**: 5.

### 9. Blog e páginas institucionais

CRUD de posts, listagem e página do post com SEO (metadata, sitemap,
`robots.txt`, dados estruturados), termos de uso e política de privacidade.

**Depende de**: 3 (reaproveita o editor de texto rico).

### 10. Operação

Sentry, e-mail transacional, backups verificados, ambiente de homologação,
checklist de LGPD (exportação e exclusão de dados).

## Decisões já tomadas

| Decisão              | Escolha                                              |
| -------------------- | ---------------------------------------------------- |
| Venda e cobrança     | **Hotmart** — checkout hospedado, sem gateway próprio |
| Acesso do não assinante | **Cota diária**: 10 questões por dia, com comentário completo |

Sobre a cota: conta **questões distintas respondidas no dia**, virando à
meia-noite de Brasília — refazer uma questão já respondida não gasta cota, e
navegar, filtrar e buscar são livres para todo mundo. O número mora em
`src/lib/questoes/cota.ts`; mudá-lo é uma linha, sem migration.

## Pendências da contratante

| Pendência                                  | Necessária a partir de |
| ------------------------------------------ | ---------------------- |
| **E-mail transacional** (Resend · Postmark) | ir ao ar com o módulo 1 |
| Credenciais de desenvolvedor da Hotmart    | módulo 5               |
| Códigos de produto e de oferta de cada plano | módulo 5             |
| Serviço de vídeo (Panda · Mux · Vimeo Pro) | módulo 3               |
| Banco gerenciado (Neon · Supabase)         | primeiro deploy        |
| Hospedagem (Vercel · Railway)              | primeiro deploy        |
| Depoimentos reais, com autorização de uso  | home de vendas         |

O e-mail transacional é o único item que o módulo 1 realmente exige: sem ele
não há como enviar o link de definição de senha. Em desenvolvimento o link é
escrito no console, então dá para construir e testar o módulo inteiro antes da
escolha — mas não para colocá-lo no ar.

O serviço de vídeo continua pendente: o campo já existe na questão e o player
sai pronto para YouTube e Vimeo, mas Panda e Mux dependem de dados da conta
(identificador da biblioteca, componente próprio) que só existem depois da
escolha. Enquanto isso, questão com vídeo desses dois provedores simplesmente
não exibe o bloco, em vez de mostrar um player quebrado.

Sobre a última linha: a home traz números reais lidos do banco, mas ainda não
tem a seção de depoimentos. Ela só será construída com depoimentos verdadeiros
e autorizados — nada de conteúdo fictício em página de vendas.

## Fora do escopo

App nativo · emissão de nota fiscal · ferramentas de IA · produção de vídeo ·
e-mail marketing.
