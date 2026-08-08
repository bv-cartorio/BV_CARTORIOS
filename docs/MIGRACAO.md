# Migração do sistema legado

Migração dos dados do sistema PHP atual (~5.000 questões comentadas, ~1.000
alunos com histórico de respostas e assinaturas recorrentes ativas) para a nova
plataforma.

> **Status**: planejado. Os scripts ficarão em `scripts/migracao/` e serão
> escritos quando o dump do banco legado estiver disponível.

## Regras invioláveis

1. **Nada manual.** Tudo por script automatizado e reexecutável a partir do dump.
2. **IDs mapeados.** `LegacyQuestionMap` e `LegacyUserMap` preservam a relação
   id antigo → id novo, para não quebrar o histórico de respostas.
3. **Saneamento.** HTML dos comentários sanitizado e taxonomia normalizada.
4. **Validação obrigatória** antes do corte (ver abaixo).
5. **Cobrança sem interrupção.** Assinaturas recorrentes migradas sem falha de
   ciclo.
6. **Senhas.** Se o hash legado for incompatível, o aluno redefine a senha no
   primeiro acesso — nunca se inventa senha nem se envia senha por e-mail.

## Pré-requisitos

- Dump do banco legado (somente leitura), configurado em `LEGACY_DATABASE_URL`.
- Documentação ou inspeção do schema antigo: nomes de tabelas, tipos dos ids,
  algoritmo de hash das senhas, formato do HTML dos comentários.
- Acesso ao painel do gateway de pagamento atual, para conferir as assinaturas
  ativas.

## Etapas

### 1. Extração e inventário

Contagem por tabela no legado e catálogo dos valores distintos de matéria,
assunto e banca. É esse inventário que revela a extensão da inconsistência de
taxonomia.

### 2. Taxonomia

Mapa `de → para` versionado em `scripts/migracao/taxonomia.json`, revisado pelo
Prof. César Bravo antes de rodar. Valores sem correspondência não são
descartados: vão para uma matéria "A classificar", visível no admin.

### 3. Questões

Para cada questão do legado:

- sanitizar `statement`, `explanation` e alternativas (allowlist de tags:
  `p, strong, em, u, ul, ol, li, h2, h3, h4, blockquote, a, img, table, thead,
  tbody, tr, th, td, br, sup, sub`);
- resolver matéria/assunto/subassunto pelo mapa de taxonomia;
- resolver a banca (criando `Board` quando necessário);
- preservar o número da questão em `Question.code` quando o id legado for
  numérico;
- gravar `LegacyQuestionMap`.

Idempotência: a existência de `LegacyQuestionMap.legacyId` decide entre criar e
atualizar. Rodar duas vezes produz o mesmo resultado.

### 4. Alunos

- `email` normalizado (minúsculas, sem espaços); duplicatas no legado são
  relatadas e resolvidas manualmente **antes** da migração, nunca durante;
- hash de senha reaproveitado se for bcrypt; caso contrário `password = null` e
  `mustResetPassword = true`;
- gravar `LegacyUserMap`.

### 5. Histórico de respostas

Cada resposta legada vira uma linha em `Answer`, traduzindo os ids pelos mapas.
Respostas cuja questão ou aluno não foi migrado são **contabilizadas e
relatadas**, nunca silenciosamente descartadas.

### 6. Assinaturas

As assinaturas dos alunos atuais **já estão na Hotmart**, o que simplifica
bastante esta etapa: a fonte de verdade é a Hotmart, não o banco legado.

- as assinaturas ativas são lidas pela API de assinaturas e casadas com os
  alunos **pelo e-mail**;
- cada uma vira um `Subscription` com `gateway = "hotmart"` e
  `gatewaySubscriptionId` igual ao código do assinante;
- a recorrência segue intocada na Hotmart — **nada é recriado**, sob pena de
  gerar cobrança nova;
- conferência linha a linha contra o relatório de assinaturas ativas da
  Hotmart.

Divergência de e-mail entre o legado e a Hotmart é o atrito mais provável desta
etapa: o aluno comprou com um endereço e usa outro para estudar. Esses casos
são listados em relatório e resolvidos um a um **antes** do corte, nunca por
adivinhação automática. Um aluno na Hotmart sem correspondência no legado é
conta nova; um aluno no legado sem assinatura na Hotmart entra sem acesso, e
precisa ser avisado antes.

### 7. Cadernos, favoritas e anotações

Migrados após as questões, pelos mesmos mapas.

## Validação (bloqueia o corte)

| Verificação                                        | Critério                              |
| -------------------------------------------------- | ------------------------------------- |
| Contagem por tabela (legado × novo)                 | Diferença zero ou justificada por escrito |
| Amostragem de 100 questões                          | Enunciado, alternativas, gabarito, comentário e classificação conferidos |
| Histórico de 10 alunos reais                        | Total de respostas e percentual de acerto idênticos aos do sistema atual |
| Assinaturas ativas                                  | Bate com o relatório do gateway       |
| Questões sem matéria                                | Zero (ou lista aprovada em "A classificar") |
| HTML sanitizado                                     | Nenhuma tag fora da allowlist         |

O relatório de validação é gerado pelo próprio script
(`scripts/migracao/validar.ts`) e arquivado junto ao registro do corte.

## Corte (go-live)

1. Congelar escrita no sistema legado (janela de baixo uso, madrugada).
2. Dump final e execução da migração completa em produção.
3. Rodar a validação; qualquer item reprovado aborta o corte.
4. Apontar o domínio para a nova plataforma.
5. Comunicar por e-mail aos alunos com hash incompatível o fluxo de redefinição
   de senha.
6. Manter o legado disponível em modo leitura por 30 dias.

## Plano de retorno

O apontamento do domínio é revertido para o sistema legado, que permanece
íntegro e sem escrita durante a janela. Como a migração não altera o banco
antigo, o retorno não tem perda de dados.
