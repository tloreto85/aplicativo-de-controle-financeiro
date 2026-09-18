# Controle Financeiro

Sistema de controle financeiro pessoal inspirado em planilhas de orçamento doméstico. Reúne o **Controle Financeiro** (despesas por categoria e regra **50-30-20**), a **Gestão de Dívidas** (parcelamentos e impacto no orçamento) e um **Calendário** visual que consolida todos os lançamentos por dia.

Os dados são salvos automaticamente no **navegador (localStorage)** — não há servidor nem login. Cada navegador/dispositivo mantém seus próprios dados.

## Módulos

O app é organizado em módulos acessíveis pelo menu inicial:

- **Controle Financeiro** — orçamento mensal por categoria, receitas, metas e consolidado 50-30-20.
- **Gestão de Dívidas** — cadastro de dívidas parceladas, registro de pagamentos e análise de impacto na renda.
- **Consolidado Anual** — visão de todas as receitas e despesas do ano, com filtros de categoria e gráficos.
- **Calendário** — visão mensal estilo agenda que reúne receitas, despesas, vencimentos de dívidas e eventos próprios.

## Funcionalidades

### Controle Financeiro

- **Despesas por categoria** — cada categoria tem cabeçalho colorido, itens com descrição, valor (R$) e data, além de total automático.
- **Categorias editáveis** — crie, renomeie, troque a cor e o grupo (Essenciais, Dívidas/Cartões, Pessoal, Investimentos), ou exclua categorias.
- **Receitas por mês** — cada receita pertence ao mês em que foi cadastrada. Ao trocar de mês, o novo período começa sem receitas, em vez de repetir os valores do mês anterior.
- **Metas 50-30-20** — ajuste os percentuais de cada grupo da regra.
- **Painel consolidado** — compara o valor *Estimado* x *Realizado* por grupo, com status (Ok / Acima), percentual de uso e o saldo final (*Diff*).
- **Mês atual pré-selecionado** — ao abrir a tela, o mês corrente já vem selecionado; use o seletor de período para navegar entre os meses.
- **Exportação CSV/Excel** — baixe os lançamentos do período filtrado em um arquivo `.csv` pronto para abrir no Excel (pt-BR).
- **Gráfico de distribuição** — donut com a participação percentual de cada categoria no total de despesas.
- **Limpar todos os dados** — botão no topo (com confirmação) que zera categorias, despesas e receitas a qualquer momento, voltando as metas ao padrão.
- **Virada de ano automática** — ao abrir o app em um ano novo, os dados do ano anterior são exportados automaticamente em um arquivo Excel/CSV e uma base em branco é criada para o novo ano, com um aviso explicando o que aconteceu.

### Gestão de Dívidas

- **Cadastro de dívidas** — registre dívidas com valor total, número de parcelas, valor da parcela e data de vencimento.
- **Registro de pagamentos** — marque parcelas como pagas e acompanhe o saldo devedor.
- **Análise de impacto** — veja o quanto as parcelas comprometem da renda do mês corrente.

### Consolidado Anual

- **Resumo do ano** — cartões com receita, despesa e saldo totais do ano.
- **Filtro por categoria** — chips coloridos que recalculam despesas, gráficos e resumo em tempo real.
- **Receita × despesa por mês** — gráfico de barras com os 12 meses do ano.
- **Distribuição por categoria** — gráfico de pizza e ranking com barras e percentuais.
- **Detalhamento mês a mês** — receitas, despesas e saldo de cada mês com lançamentos.

### Calendário

- **Visão mensal** estilo Google Agenda, com destaque para o dia atual e navegação entre meses.
- **Lançamentos por dia** vindos de três origens, com cores distintas: receitas (verde) e despesas (vermelho) do Controle Financeiro, parcelas da Gestão de Dívidas (roxo, pelo vencimento) e eventos próprios (azul).
- **Resumo do mês** com receitas, despesas e saldo previsto.
- **Eventos próprios** — cadastre, edite e exclua lançamentos direto no dia (receita, despesa ou evento).

## Tecnologias

- [Next.js 16](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) + [Recharts](https://recharts.org/) para os gráficos

---

## Como rodar o projeto localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18.18 ou superior (recomendado: versão LTS mais recente)
- Um gerenciador de pacotes: **pnpm** (recomendado), npm ou yarn
- [VSCode](https://code.visualstudio.com/) (ou o editor de sua preferência)

### Passo a passo

1. **Clone o repositório** (substitua pela URL do seu repositório no GitHub):

   ```bash
   git clone https://github.com/SEU-USUARIO/controle-financeiro.git
   cd controle-financeiro
   ```

2. **Abra no VSCode:**

   ```bash
   code .
   ```

3. **Instale as dependências:**

   ```bash
   pnpm install
   # ou: npm install
   # ou: yarn
   ```

4. **Inicie o servidor de desenvolvimento:**

   ```bash
   pnpm dev
   # ou: npm run dev
   # ou: yarn dev
   ```

5. **Abra no navegador:** acesse [http://localhost:3000](http://localhost:3000).

   A página recarrega automaticamente sempre que você salvar uma alteração no código.

### Scripts disponíveis

| Comando        | Descrição                                          |
| -------------- | -------------------------------------------------- |
| `pnpm dev`     | Inicia o servidor de desenvolvimento (porta 3000). |
| `pnpm build`   | Gera a versão de produção otimizada.               |
| `pnpm start`   | Executa a versão de produção (após o `build`).     |
| `pnpm lint`    | Roda o linter para verificar o código.             |

---

## Como usar no dia a dia

1. **Cadastre suas receitas.** No painel **Receitas**, adicione cada fonte de renda (ex: salário, pró-labore). A soma é a base da regra 50-30-20.

2. **Ajuste suas metas (opcional).** No painel **Metas**, defina os percentuais de cada grupo (por padrão Essenciais, Dívidas/Cartões, Pessoal e Investimentos). A soma ideal é 100%.

3. **Organize suas categorias.** Use **Nova categoria** para criar blocos (ex: Aluguel, Alimentação, Cartão). Para cada uma, escolha a cor e a qual grupo da regra ela pertence. É possível editar ou excluir pelos ícones no cabeçalho do card.

4. **Lance as despesas.** Em cada card, preencha a descrição, o valor e a **data em que a despesa foi realizada ou vence**, e adicione. Passe o mouse sobre um item para **editar** (lápis) ou **remover** (X). O total da categoria é calculado sozinho.

5. **Acompanhe o consolidado.** O painel **Consolidado** mostra, por grupo, quanto você planejou gastar (*Estimado*) versus quanto realmente gastou (*Realizado*), o status e o saldo restante (*Diff*).

6. **Filtre por mês.** Use o seletor de período no topo para ver apenas um mês. Útil para fechar o orçamento mês a mês.

7. **Exporte quando precisar.** O botão **Exportar CSV** baixa os lançamentos do período selecionado para guardar ou analisar no Excel/Google Sheets.

8. **Analise a distribuição.** O **gráfico de distribuição** mostra rapidamente para onde o seu dinheiro está indo.

9. **Comece do zero quando quiser.** Use **Limpar dados** (no topo) para zerar tudo a qualquer momento. Há uma confirmação antes de apagar — exporte o CSV antes, se quiser manter um histórico.

### Fechamento de ano automático

Ao abrir o aplicativo já em um novo ano (ex: a primeira vez que você acessar em 2027 com dados de 2026), o app automaticamente:

1. **Exporta** todos os lançamentos do ano anterior em um arquivo `controle-financeiro-ANO.csv` (download imediato; se o navegador bloquear, há um botão para baixar manualmente).
2. **Cria uma base em branco** para o novo ano.
3. **Exibe um aviso** confirmando que os dados foram arquivados e que uma nova base foi iniciada.

> **Importante:** os dados ficam salvos somente no navegador onde foram inseridos. Se limpar os dados do navegador, ou usar outro dispositivo/navegador, os lançamentos não estarão disponíveis. Use a exportação CSV como cópia de segurança.

---

## Estrutura do projeto

```
app/
  layout.tsx                    # Layout raiz, fontes e metadata
  page.tsx                      # Menu inicial com os módulos
  globals.css                   # Tema (cores, tokens) e Tailwind
  financeiro/
    page.tsx                    # Controle Financeiro (dashboard mensal)
    consolidado/page.tsx        # Consolidado Anual
    dividas/page.tsx            # Gestão de Dívidas
  calendario/
    page.tsx                    # Calendário mensal
components/
  category-card.tsx             # Card de uma categoria com seus itens
  category-dialog.tsx           # Diálogo de criar/editar categoria
  consolidated-panel.tsx        # Painel da regra 50-30-20
  annual-consolidation.tsx      # Consolidado anual com filtros e gráficos
  distribution-chart.tsx        # Gráfico de pizza/donut
  filter-bar.tsx                # Filtro por mês + exportar CSV
  income-panel.tsx              # Cadastro de receitas do mês
  targets-editor.tsx            # Ajuste dos percentuais das metas
  debts/                        # Componentes da Gestão de Dívidas
  calendar/
    calendar-grid.tsx           # Grade mensal do calendário
    day-dialog.tsx              # Detalhe e eventos de um dia
  ui/                           # Componentes shadcn/ui
lib/
  types.ts                      # Tipos do domínio (categorias, despesas, receitas)
  use-finance.ts                # Estado do Controle Financeiro + persistência local
  debt-types.ts                 # Tipos da Gestão de Dívidas
  use-debts.ts                  # Estado das dívidas + persistência local
  calendar-types.ts             # Tipos dos eventos do calendário
  use-calendar-events.ts        # Estado dos eventos próprios + persistência local
  calendar-utils.ts             # Agregação das origens e montagem da grade
  format.ts                     # Formatação de moeda e datas
  export.ts                     # Geração do arquivo CSV
```
