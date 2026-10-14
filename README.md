# Controle Financeiro

Sistema de controle financeiro pessoal inspirado em planilhas de orçamento doméstico. Reúne o **Controle Financeiro** (despesas por categoria e regra **35-20-45** ou **50-30-20**, à sua escolha), a **Gestão de Dívidas** (parcelamentos e impacto no orçamento) e um **Calendário** visual que consolida todos os lançamentos por dia.

Os dados são salvos automaticamente em um **banco de dados Postgres (Neon)**, vinculados à sua conta (login com e-mail e senha). Assim, você acessa as mesmas informações de qualquer computador ou navegador.

## Ano de trabalho

No topo de todas as telas há o seletor **Ano de trabalho**. Escolha o ano (ou use as setas) e o Controle Financeiro, a Gestão de Dívidas, o Consolidado e o Calendário passam a mostrar os dados daquele ano. Cada ano tem sua própria base, e a escolha fica salva na sua conta.

## Módulos

O app é organizado em módulos acessíveis pelo menu inicial:

- **Controle Financeiro** — orçamento mensal por categoria, receitas, metas e consolidado 35-20-45.
- **Gestão de Dívidas** — cadastro de dívidas parceladas, registro de pagamentos e análise de impacto na renda.
- **Consolidado Anual** — visão de todas as receitas e despesas do ano, com filtros de categoria e gráficos.
- **Calendário** — visão mensal estilo agenda que reúne receitas e despesas do Controle Financeiro e eventos próprios.

## Funcionalidades

### Controle Financeiro

- **Despesas por categoria** — cada categoria tem cabeçalho colorido, itens com descrição, valor (R$) e data, além de total automático.
- **Categorias editáveis** — crie, renomeie, troque a cor e o grupo da regra escolhida, ou exclua categorias.
- **Receitas por mês** — cada receita pertence ao mês em que foi cadastrada. Ao trocar de mês, o novo período começa sem receitas, em vez de repetir os valores do mês anterior.
- **Forma de distribuição escolhida por você** — no painel **Metas por grupo**, alterne entre as regras (por ano). Ao trocar, as categorias são remapeadas para os grupos equivalentes e as metas voltam ao padrão da regra, sem perder despesas:
  - **35-20-45**: Necessidades/Obrigações (35%), Qualidade de vida/Lazer (20%), Patrimônio/Objetivos (45%).
  - **50-30-20**: Necessidades (50%), Desejos/Estilo de vida (30%), Poupança/Investimentos (20%).
  - Categorias padrão: Moradia, Pessoal, Filho, Dívidas, Carro, Alimentação/Supermercado (necessidades); Lazer/Restaurante/Compras (lazer); Reserva Imprevistos e Investimentos (patrimônio).
  - Os percentuais de cada grupo continuam ajustáveis.
- **Painel consolidado** — compara o valor *Estimado* x *Realizado* por grupo, com status (Ok / Acima), percentual de uso e o saldo final (*Diff*).
- **Mês atual pré-selecionado** — ao abrir a tela, o mês corrente já vem selecionado; use o seletor de período para navegar entre os meses.
- **Exportação CSV/Excel** — baixe os lançamentos do período filtrado em um arquivo `.csv` pronto para abrir no Excel (pt-BR).
- **Gráfico de distribuição** — donut com a participação percentual de cada categoria no total de despesas.
- **Limpar dados do ano** — botão no topo (com confirmação) que zera categorias, despesas e receitas do ano selecionado, voltando as metas ao padrão.

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
- **Lançamentos por dia** do Controle Financeiro, com cores distintas: receitas (verde), despesas (vermelho) e eventos próprios (azul). A Gestão de Dívidas é mantida separada e não aparece aqui.
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

> **Instalação rápida:** siga o guia [docs/INSTALACAO.md](docs/INSTALACAO.md) e use `iniciar.cmd` (Windows) ou `./iniciar.sh` (macOS/Linux). O script instala as dependências, cria o `.env.local`, prepara o banco e inicia o app.

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

4. **Configure as variáveis de ambiente.** Crie um arquivo `.env.local` na raiz com:

   ```bash
   DATABASE_URL="postgresql://..."      # string de conexão do banco Neon
   BETTER_AUTH_SECRET="..."             # gere com: openssl rand -base64 32
   BETTER_AUTH_URL="http://localhost:3000"
   ```

   Usando o mesmo `DATABASE_URL` em qualquer computador, você acessa os mesmos dados.

5. **Inicie o servidor de desenvolvimento:**

   ```bash
   pnpm dev
   # ou: npm run dev
   # ou: yarn dev
   ```

6. **Abra no navegador:** acesse [http://localhost:3000](http://localhost:3000) e crie sua conta.

   A página recarrega automaticamente sempre que você salvar uma alteração no código.

### Scripts disponíveis

| Comando        | Descrição                                          |
| -------------- | -------------------------------------------------- |
| `pnpm dev`     | Inicia o servidor de desenvolvimento (porta 3000). |
| `pnpm build`   | Gera a versão de produção otimizada.               |
| `pnpm start`   | Executa a versão de produção (após o `build`).     |
| `pnpm lint`    | Roda o linter para verificar o código.             |
| `pnpm setup`   | Cria o `.env.local` (se faltar) e as tabelas do banco. |

---

## Como usar no dia a dia

1. **Cadastre suas receitas.** No painel **Receitas**, adicione cada fonte de renda (ex: salário, pró-labore). A soma é a base da regra 35-20-45.

2. **Escolha a regra e ajuste as metas (opcional).** No painel **Metas por grupo**, escolha entre 35-20-45 e 50-30-20 e, se quiser, ajuste os percentuais. A soma ideal é 100%.

3. **Organize suas categorias.** Use **Nova categoria** para criar blocos (ex: Aluguel, Alimentação, Cartão). Para cada uma, escolha a cor e a qual grupo da regra ela pertence. É possível editar ou excluir pelos ícones no cabeçalho do card.

4. **Lance as despesas.** Em cada card, preencha a descrição, o valor e a **data em que a despesa foi realizada ou vence**, e adicione. Passe o mouse sobre um item para **editar** (lápis) ou **remover** (X). O total da categoria é calculado sozinho.

5. **Acompanhe o consolidado.** O painel **Consolidado** mostra, por grupo, quanto você planejou gastar (*Estimado*) versus quanto realmente gastou (*Realizado*), o status e o saldo restante (*Diff*).

6. **Filtre por mês.** Use o seletor de período no topo para ver apenas um mês. Útil para fechar o orçamento mês a mês.

7. **Exporte quando precisar.** O botão **Exportar CSV** baixa os lançamentos do período selecionado para guardar ou analisar no Excel/Google Sheets.

8. **Analise a distribuição.** O **gráfico de distribuição** mostra rapidamente para onde o seu dinheiro está indo.

9. **Comece do zero quando quiser.** Use **Limpar dados** (no topo) para zerar tudo a qualquer momento. Há uma confirmação antes de apagar — exporte o CSV antes, se quiser manter um histórico.

### Trabalhando com vários anos

Use o seletor **Ano de trabalho** no topo para alternar entre anos. Um ano novo começa com as categorias padrão e sem lançamentos; os anos anteriores continuam salvos e podem ser consultados a qualquer momento.

> **Dados antigos do navegador:** se você usava a versão anterior (que salvava no navegador), esses dados são importados automaticamente para sua conta no primeiro acesso de cada módulo.

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
  consolidated-panel.tsx        # Painel da regra 35-20-45
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
  calendar-utils.ts             # Agregação do Controle Financeiro e montagem da grade
  format.ts                     # Formatação de moeda e datas
  export.ts                     # Geração do arquivo CSV
```
