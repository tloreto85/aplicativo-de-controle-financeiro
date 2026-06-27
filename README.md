# Controle Financeiro

Sistema de controle financeiro pessoal inspirado em planilhas de orçamento doméstico, com lançamento de despesas por categoria, datas, totais automáticos e painel consolidado baseado na regra **50-30-20**.

Os dados são salvos automaticamente no **navegador (localStorage)** — não há servidor nem login. Cada navegador/dispositivo mantém seus próprios dados.

## Funcionalidades

- **Despesas por categoria** — cada categoria tem cabeçalho colorido, itens com descrição, valor (R$) e data, além de total automático.
- **Categorias editáveis** — crie, renomeie, troque a cor e o grupo (Essenciais, Dívidas/Cartões, Pessoal, Investimentos), ou exclua categorias.
- **Receitas e metas** — cadastre fontes de renda e ajuste os percentuais da regra 50-30-20.
- **Painel consolidado** — compara o valor *Estimado* x *Realizado* por grupo, com status (Ok / Acima), percentual de uso e o saldo final (*Diff*).
- **Filtro por mês** — visualize apenas as despesas de um período específico; todos os totais, gráficos e o consolidado recalculam automaticamente.
- **Exportação CSV/Excel** — baixe os lançamentos do período filtrado em um arquivo `.csv` pronto para abrir no Excel (pt-BR).
- **Gráfico de distribuição** — donut com a participação percentual de cada categoria no total de despesas.
- **Limpar todos os dados** — botão no topo (com confirmação) que zera categorias, despesas e receitas a qualquer momento, voltando as metas ao padrão.
- **Virada de ano automática** — ao abrir o app em um ano novo, os dados do ano anterior são exportados automaticamente em um arquivo Excel/CSV e uma base em branco é criada para o novo ano, com um aviso explicando o que aconteceu.

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
  layout.tsx          # Layout raiz, fontes e metadata
  page.tsx            # Página principal que monta o dashboard
  globals.css         # Tema (cores, tokens) e Tailwind
components/
  category-card.tsx       # Card de uma categoria com seus itens
  category-dialog.tsx     # Diálogo de criar/editar categoria
  consolidated-panel.tsx  # Painel da regra 50-30-20
  distribution-chart.tsx  # Gráfico de pizza/donut
  filter-bar.tsx          # Filtro por mês + exportar CSV
  income-panel.tsx        # Cadastro de receitas
  targets-editor.tsx      # Ajuste dos percentuais das metas
  ui/                     # Componentes shadcn/ui
lib/
  types.ts            # Tipos do domínio (categorias, despesas, etc.)
  use-finance.ts      # Estado da aplicação + persistência local
  format.ts           # Formatação de moeda e datas
  export.ts           # Geração do arquivo CSV
```
