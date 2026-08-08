# BV Cartórios

Plataforma de estudos por questões para concursos de serviços notariais e de
registro (foco em banca FGV e no Exame Nacional dos Cartórios — ENAC).

Reconstrução da plataforma atual, com migração integral dos dados do sistema
legado (~5.000 questões comentadas e ~1.000 alunos com histórico de respostas).

## Stack

| Camada    | Escolha                                         |
| --------- | ----------------------------------------------- |
| Aplicação | Next.js 16 (App Router) + React 19 + TypeScript |
| Estilo    | Tailwind CSS v4                                 |
| Banco     | PostgreSQL                                      |
| ORM       | Prisma 7 (driver adapter `@prisma/adapter-pg`)  |
| Validação | Zod                                             |
| Senhas    | bcrypt (`bcryptjs`, custo 12)                   |

Venda e cobrança são feitas pela **Hotmart** (checkout hospedado; a aplicação
libera o acesso por webhook — ver [`docs/HOTMART.md`](docs/HOTMART.md)). Vídeo,
e-mail transacional e monitoramento entram por outros serviços externos, ver
`docs/ROADMAP.md`.

## Requisitos

- Node.js 22+
- PostgreSQL 16+ (local ou gerenciado)

## Como rodar

```bash
# 1. dependências
npm install

# 2. ambiente
cp .env.example .env      # preencha DATABASE_URL

# 3. banco: aplica as migrations e popula dados de desenvolvimento
npm run db:migrate
npm run db:seed

# 4. aplicação
npm run dev               # http://localhost:3000
```

O seed cria a taxonomia base, as bancas, os três planos comerciais, um usuário
administrador (`admin@bvcartorio.com`) e três questões de exemplo. Ele é
**idempotente**: pode ser executado quantas vezes for necessário.

### Banco local com Docker

```bash
docker run --name bv-postgres -e POSTGRES_USER=bv -e POSTGRES_PASSWORD=bv \
  -e POSTGRES_DB=bvcartorios -p 5432:5432 -d postgres:16
```

## Scripts

| Comando              | O que faz                                            |
| -------------------- | ---------------------------------------------------- |
| `npm run dev`        | Servidor de desenvolvimento                          |
| `npm run build`      | Gera o Prisma Client e compila para produção         |
| `npm run start`      | Sobe o build de produção                             |
| `npm run typecheck`  | `tsc --noEmit`                                       |
| `npm run lint`       | ESLint                                               |
| `npm run db:migrate` | Cria/aplica migration em desenvolvimento             |
| `npm run db:deploy`  | Aplica migrations pendentes (produção/homologação)   |
| `npm run db:seed`    | Popula dados de desenvolvimento                      |
| `npm run db:studio`  | Prisma Studio                                        |
| `npm run db:reset`   | **Apaga** o banco, reaplica migrations e roda o seed |

## Estrutura

```
prisma/
  schema.prisma          modelo de dados (fonte da verdade)
  migrations/            migrations versionadas — nunca editar aplicadas
  seed.ts                dados de desenvolvimento (idempotente)
src/
  app/
    (auth)/              login, cadastro, recuperação e definição de senha
    painel/              área do aluno (exige sessão)
  components/            componentes de interface
  lib/
    auth/                sessão, senha, tokens, guardas e rate limiting
  generated/prisma/      Prisma Client gerado (fora do controle de versão)
docs/
  ERD.md                 diagrama e decisões do modelo de dados
  MIGRACAO.md            plano de migração do sistema legado
  HOTMART.md             integração com a Hotmart (venda e acesso)
  ROADMAP.md             módulos, ordem de entrega e decisões pendentes
```

## Convenções

- **Idioma**: código, models e nomes de arquivo em inglês; interface, conteúdo,
  comentários e mensagens ao usuário em **português do Brasil**.
- **Domínio**: questão, gabarito, comentário, simulado, caderno, banca,
  matéria/assunto/subassunto.
- **Schema**: toda alteração passa por migration versionada (`npm run db:migrate`).
  Migration já aplicada em produção nunca é editada — corrige-se com uma nova.
- **Segredos**: apenas em variáveis de ambiente, sempre documentadas em
  `.env.example`. Nada de credencial no repositório.
- **HTML rico**: enunciados, comentários e posts são armazenados em HTML já
  sanitizado na escrita e renderizados com a classe `.conteudo-rico`.

## Ambientes

| Ambiente    | Branch    | Banco                 |
| ----------- | --------- | --------------------- |
| Produção    | `main`    | PostgreSQL gerenciado |
| Homologação | `develop` | Instância separada    |

Backup diário do banco de produção é requisito de operação (configurado no
provedor gerenciado).

## Documentação

- [`docs/ERD.md`](docs/ERD.md) — modelo de dados e decisões de modelagem
- [`docs/MIGRACAO.md`](docs/MIGRACAO.md) — migração do sistema legado
- [`docs/HOTMART.md`](docs/HOTMART.md) — integração com a Hotmart
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — módulos e ordem de entrega
