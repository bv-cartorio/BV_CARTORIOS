# Instruções do projeto

Plataforma de estudos por questões para concursos de cartório (BV Cartórios).
Contexto completo em [`README.md`](README.md), [`docs/ERD.md`](docs/ERD.md),
[`docs/MIGRACAO.md`](docs/MIGRACAO.md) e [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Regras de trabalho

- **Antes de implementar um módulo**, apresente o plano (rotas, componentes e
  mudanças de schema) para aprovação. Os módulos estão em `docs/ROADMAP.md`.
- **Simplicidade acima de otimização prematura.** O porte é modesto: ~5.000
  questões e ~1.000 alunos.
- **Schema só muda por migration versionada** (`npm run db:migrate`). Migration
  já aplicada em produção nunca é editada.
- **Nunca comitar segredos.** Toda variável nova entra em `.env.example`.
- **Interface e conteúdo em pt-BR**; código e models em inglês.
- Terminologia do domínio: questão, gabarito, comentário, simulado, caderno,
  banca, matéria/assunto/subassunto.

## Antes de commitar

```bash
npm run typecheck && npm run lint && npm run build
```

## Cuidados específicos

- **HTML rico** (enunciado, comentário, post): sanitizar **na escrita** com
  allowlist de tags; renderizar com a classe `.conteudo-rico`.
- **Vídeo**: guardar apenas `videoId` + `videoProvider`. Nunca hospedar arquivo
  de vídeo na aplicação.
- **Gabarito**: fonte única é `Question.answerKey`. `Alternative` não tem campo
  de resposta correta.
- **Conteúdo de vendas**: nada de depoimento, número ou prova social fictícios.
  Os números da home vêm do banco.
