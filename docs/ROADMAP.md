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

Cadastro, login, logout, recuperação de senha e redefinição obrigatória no
primeiro acesso (contas migradas). Sessão por cookie httpOnly com token
hasheado em `Session`; rate limiting no login; middleware de proteção de rotas
e de papéis (`STUDENT` / `EDITOR` / `ADMIN`).

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

### 5. Assinaturas e checkout

Integração com o gateway (Pix + recorrência no cartão), webhooks, liberação
automática de acesso, cupons, cancelamento e página de cobrança do aluno.

**Depende de**: 1. Precisa da decisão de gateway (abaixo).

### 6. Cadernos e simulados

Cadernos do aluno, simulados cronometrados com correção ao final e comparação
com a média dos demais alunos.

**Depende de**: 2.

### 7. Dashboard do aluno

Percentual de acerto geral e por matéria, evolução temporal, pontos fracos.

**Depende de**: 2 (precisa de volume de respostas para ter sentido).

### 8. Admin — gestão e receita

Alunos e assinaturas, planos, cupons, avisos, dashboard de receita (MRR).

**Depende de**: 5.

### 9. Blog e páginas institucionais

CRUD de posts, listagem e página do post com SEO (metadata, sitemap,
`robots.txt`, dados estruturados), termos de uso e política de privacidade.

**Depende de**: 3 (reaproveita o editor de texto rico).

### 10. Operação

Sentry, e-mail transacional, backups verificados, ambiente de homologação,
checklist de LGPD (exportação e exclusão de dados).

## Decisões pendentes da contratante

Nenhuma delas bloqueia os módulos 1 a 4.

| Decisão              | Opções                                        | Necessária a partir de |
| -------------------- | --------------------------------------------- | ---------------------- |
| Gateway de pagamento | Asaas · Pagar.me · Mercado Pago · Stripe      | módulo 5               |
| Serviço de vídeo     | Panda Video · Mux · Vimeo Pro                 | módulo 3               |
| Banco gerenciado     | Neon · Supabase                               | primeiro deploy        |
| Hospedagem           | Vercel · Railway                              | primeiro deploy        |
| E-mail transacional  | Resend · Postmark                             | módulo 1               |
| Depoimentos reais    | textos e autorização de uso dos alunos        | home de vendas         |

Sobre a última linha: a home traz números reais lidos do banco, mas ainda não
tem a seção de depoimentos. Ela só será construída com depoimentos verdadeiros
e autorizados — nada de conteúdo fictício em página de vendas.

## Fora do escopo

App nativo · emissão de nota fiscal · ferramentas de IA · produção de vídeo ·
e-mail marketing.
