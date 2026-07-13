# Guia de Contribuição

Este documento define a convenção de branches e o fluxo de trabalho com Git
usados neste projeto. Ele serve como referência para este e para projetos
futuros com deploy contínuo na Vercel.

## Modelo adotado: GitHub Flow

Projetos web com deploy contínuo na Vercel usam **GitHub Flow** (e não Git Flow
completo). Cada push/merge já gera preview/produção, então um fluxo simples é
mais produtivo do que branches de `release`/`develop` intermediárias.

- **`main`** — sempre estável, corresponde ao que está em produção.
- Todo trabalho é feito em uma branch curta, com PR de volta para `main`.
- Nunca se commita diretamente na `main`.

## Convenção de nomes de branch

Use um prefixo que descreva o tipo de mudança, seguido de um nome curto em
`kebab-case`:

| Prefixo      | Uso                                                        | Exemplo                          |
| ------------ | ---------------------------------------------------------- | -------------------------------- |
| `feature/`   | Nova funcionalidade                                        | `feature/consolidado-mensal`     |
| `fix/`       | Correção de bug                                            | `fix/saldo-despesa-paga`         |
| `hotfix/`    | Correção urgente de algo quebrado em produção              | `hotfix/erro-login`              |
| `chore/`     | Manutenção, config, dependências, refatoração sem feature  | `chore/atualiza-dependencias`    |
| `docs/`      | Apenas documentação                                        | `docs/guia-contribuicao`         |

## Fluxo de trabalho

1. Crie a branch a partir da `main` atualizada:
   ```bash
   git checkout main && git pull
   git checkout -b feature/nome-da-feature
   ```
2. Faça commits pequenos e descritivos (ver convenção abaixo).
3. Envie a branch e abra uma Pull Request para a `main`.
4. Após revisão/aprovação, faça o merge na `main`.
5. O deploy para produção acontece automaticamente na Vercel após o merge.

## Convenção de mensagens de commit

Seguimos o padrão **Conventional Commits**:

```
<tipo>: <resumo em português, no imperativo>

<corpo opcional explicando o quê e o porquê>
```

Tipos comuns: `feat`, `fix`, `docs`, `chore`, `refactor`, `style`, `test`.

Exemplo:
```
feat: navegador de meses no controle financeiro

Substitui o list box de período por uma faixa com os 12 meses,
permitindo abrir qualquer mês com um clique.
```

## Quando considerar o Git Flow completo

O modelo mais elaborado (`develop`, `release/*`, `hotfix/*`) só compensa quando o
projeto tiver **todos** estes traços:

- Releases versionadas de verdade (v1.2.0, v1.3.0, ...).
- Ambiente de homologação separado da produção.
- Time maior com trabalho paralelo intenso e necessidade de manter versões
  antigas em produção.

Sem esses fatores, prefira o GitHub Flow descrito acima.
