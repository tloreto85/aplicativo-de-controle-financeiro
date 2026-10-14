# Instalação em uma nova máquina

Este guia instala o Controle Financeiro do zero em outro computador, com um **banco de dados novo e vazio** para outro usuário. Ninguém compartilha dados: cada instalação aponta para o próprio banco.

O resumo:

1. Instalar Node.js e Git
2. Criar um banco gratuito no Neon
3. Clonar o projeto
4. Rodar `iniciar.cmd` (Windows) ou `./iniciar.sh` (macOS/Linux)

---

## 1. Instalar os programas necessários

| Programa | Versão | Onde baixar |
| --- | --- | --- |
| Node.js | 20.9 ou superior (recomendado: **LTS**) | https://nodejs.org |
| Git | qualquer versão recente | https://git-scm.com/downloads |

Depois de instalar, abra um **novo** terminal (Prompt de Comando, PowerShell ou Terminal) e confira:

```bash
node -v
git --version
```

O **pnpm** (gerenciador de pacotes do projeto) é instalado automaticamente pelo script de inicialização, se ainda não existir. Para instalar manualmente: `npm install -g pnpm`.

---

## 2. Criar o banco de dados (Neon)

O app guarda os dados no **Neon**, um PostgreSQL na nuvem com plano gratuito.

1. Acesse https://console.neon.tech e crie uma conta.
2. Clique em **New Project**, dê um nome (ex.: `controle-financeiro`) e escolha a região mais próxima (ex.: *AWS São Paulo*).
3. No painel do projeto, clique em **Connect**.
4. Copie a **connection string**. Ela tem este formato:

   ```
   postgresql://usuario:senha@ep-xxxx-xxxx.sa-east-1.aws.neon.tech/neondb?sslmode=require
   ```

Guarde esse valor: ele será pedido no passo 4. **Não compartilhe**, pois dá acesso total ao banco.

Não é preciso criar tabelas manualmente: o script de inicialização faz isso.

---

## 3. Clonar o projeto

```bash
git clone https://github.com/tloreto85/aplicativo-de-controle-financeiro.git
cd aplicativo-de-controle-financeiro
```

---

## 4. Primeira execução

### Windows

Dê dois cliques no arquivo **`iniciar.cmd`** na pasta do projeto (ou rode `iniciar.cmd` no terminal).

### macOS / Linux

```bash
chmod +x iniciar.sh   # só na primeira vez
./iniciar.sh
```

### O que o script faz

1. Verifica se o Node.js está instalado e instala o pnpm, se faltar.
2. Instala as dependências (`pnpm install`).
3. Cria o arquivo **`.env.local`**, se ele não existir:
   - pede que você cole o `DATABASE_URL` do Neon (passo 2);
   - gera automaticamente um `BETTER_AUTH_SECRET` seguro;
   - define `BETTER_AUTH_URL="http://localhost:3000"`.
4. Conecta ao banco e cria as tabelas que faltam (`user`, `session`, `account`, `verification`, `app_data`). Tabelas e dados existentes **nunca são apagados**.
5. Abre o navegador em http://localhost:3000 e inicia a aplicação.

---

## 5. Criar a conta de acesso

Como o banco é novo, ainda não existe nenhum usuário. Na tela de login:

1. Clique em **Criar conta**.
2. Informe nome, e-mail e uma senha (mínimo de 8 caracteres).

Pronto: esse e-mail e senha passam a ser o login desse usuário. A senha é armazenada criptografada no banco.

---

## Uso no dia a dia

Sempre que quiser usar o app, rode o mesmo script:

- **Windows:** dois cliques em `iniciar.cmd`
- **macOS/Linux:** `./iniciar.sh`

Nas próximas vezes ele não pede nada: só confere as dependências e o banco e sobe a aplicação. Para encerrar, pressione **Ctrl+C** no terminal (ou feche a janela).

Também é possível rodar as etapas manualmente:

```bash
pnpm install    # dependências
pnpm setup      # cria .env.local (se faltar) e as tabelas do banco
pnpm dev        # inicia em http://localhost:3000
```

---

## Atualizar para uma nova versão

```bash
git pull
```

Depois rode o script de inicialização normalmente: ele instala dependências novas e cria tabelas novas, se houver.

---

## O arquivo `.env.local`

Fica na raiz do projeto (ao lado do `package.json`) e **não vai para o Git**. Exemplo:

```bash
DATABASE_URL="postgresql://usuario:senha@ep-xxxx.sa-east-1.aws.neon.tech/neondb?sslmode=require"
BETTER_AUTH_SECRET="valor-aleatorio-com-pelo-menos-32-caracteres"
BETTER_AUTH_URL="http://localhost:3000"
```

- Para trocar de banco, edite o `DATABASE_URL` (ou apague o arquivo e rode o script de novo).
- Se você trocar o `BETTER_AUTH_SECRET`, os logins ativos são encerrados e será preciso entrar de novo. Os dados não são perdidos.

---

## Solução de problemas

| Mensagem | Causa e solução |
| --- | --- |
| `Node.js não encontrado` | Instale o Node.js LTS e abra um novo terminal. |
| `'pnpm' não é reconhecido` | Rode `npm install -g pnpm` e abra um novo terminal. |
| `ERR_PNPM_IGNORED_BUILDS` | Rode `git pull` para obter a versão mais recente do `pnpm-workspace.yaml`. |
| `DATABASE_URL ausente ou inválido` | O `.env.local` tem o texto de exemplo ou um valor incompleto. Cole a connection string completa do Neon. |
| `Não foi possível conectar ao banco (ENOTFOUND)` | O host do `DATABASE_URL` está errado ou não há internet. Copie de novo a string no Neon (**Connect**). |
| `password authentication failed` | Senha do banco incorreta. Gere/copie a string novamente no Neon. |
| `Port 3000 is in use` | Já existe outra instância rodando. Feche-a ou acesse a porta indicada no terminal. |
| Login volta para a tela de entrada | Confira se `BETTER_AUTH_URL` é `http://localhost:3000` e se você está acessando exatamente esse endereço. |
