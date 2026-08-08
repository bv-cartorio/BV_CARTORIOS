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
- README, ERD e plano de migração documentados

## Próximos módulos

### 1. Autenticação e conta

Login, logout, recuperação de senha e **definição de senha no primeiro acesso**.
Sessão por cookie httpOnly com token hasheado em `Session`; rate limiting no
login; proteção de rotas por papel (`STUDENT` / `EDITOR` / `ADMIN`) e guarda de
assinatura ativa.

Não há autocadastro público: a conta nasce de uma compra na Hotmart (módulo 5)
ou da migração do legado (módulo 4), sempre sem senha utilizável. Os três
caminhos — comprou, foi migrado, esqueceu a senha — convergem para o mesmo
fluxo de token por e-mail.

**Depende de**: nada. É pré-requisito de todo o resto.

### 2. Área do aluno — resolver questões

Busca e filtros (matéria, assunto, banca, ano, respondidas/não,
acertadas/erradas), resolução com feedback imediato, comentário rico, vídeo
quando houver, favoritas, anotações e reporte de erro.

**Depende de**: 1.

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

## Pendências da contratante

| Pendência                                  | Necessária a partir de |
| ------------------------------------------ | ---------------------- |
| Credenciais de desenvolvedor da Hotmart    | módulo 5               |
| Códigos de produto e de oferta de cada plano | módulo 5             |
| E-mail transacional (Resend · Postmark)    | módulo 1               |
| Serviço de vídeo (Panda · Mux · Vimeo Pro) | módulo 3               |
| Banco gerenciado (Neon · Supabase)         | primeiro deploy        |
| Hospedagem (Vercel · Railway)              | primeiro deploy        |
| Depoimentos reais, com autorização de uso  | home de vendas         |

O e-mail transacional é o único item que o módulo 1 realmente exige: sem ele
não há como enviar o link de definição de senha. Em desenvolvimento o link é
escrito no console, então dá para construir e testar o módulo inteiro antes da
escolha — mas não para colocá-lo no ar.

Sobre a última linha: a home traz números reais lidos do banco, mas ainda não
tem a seção de depoimentos. Ela só será construída com depoimentos verdadeiros
e autorizados — nada de conteúdo fictício em página de vendas.

## Fora do escopo

App nativo · emissão de nota fiscal · ferramentas de IA · produção de vídeo ·
e-mail marketing.
