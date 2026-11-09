# Excelência dos Pés · Sistema da clínica (com banco de dados)

Sistema de agenda e gestão da clínica de podologia, com **login** e **banco de dados na nuvem**
(Supabase, que usa PostgreSQL). Os dados aparecem em qualquer aparelho em que ela entrar
com o mesmo e-mail e senha.

## Como funciona

- O site (HTML, CSS e JavaScript) fica hospedado na **Vercel**.
- Os dados ficam no **Supabase**, protegidos por login. Cada conta só enxerga os próprios dados.
- Uma cópia fica no aparelho: o sistema abre rápido e funciona **mesmo sem internet**.
  O que for feito offline vai para uma fila e é enviado sozinho quando a internet voltar.
- Ao trocar de aparelho, basta entrar com o e-mail e a senha.

## Estrutura

```
excelencia-dos-pes/
├── index.html
├── manifest.webmanifest       instalar no celular como aplicativo
├── banco/
│   └── supabase-banco.sql     cria as tabelas e a segurança no Supabase
├── css/estilo.css
├── icones/
└── js/
    ├── config.js              ⇦ você cola aqui o endereço e a chave do Supabase
    ├── banco.js               login, leitura, gravação e fila sem internet
    ├── util.js, dados.js, interface.js, app.js
    └── telas/                 um arquivo por tela
```

## Passo a passo

### 1. Criar o banco no Supabase (grátis)
1. Acesse **supabase.com**, clique em **Start your project** e entre com o GitHub.
2. Clique em **New project**:
   - *Name:* `excelencia-dos-pes`
   - *Database Password:* crie uma senha forte e guarde.
   - *Region:* **South America (São Paulo)**.
3. Espere uns 2 minutos até o projeto ficar pronto.

### 2. Criar as tabelas
1. No menu da esquerda, abra **SQL Editor** → **New query**.
2. Cole todo o conteúdo de `banco/supabase-banco.sql` e clique em **Run**.
3. Deve aparecer *Success. No rows returned*. Em **Table Editor** surgem as tabelas
   `pacientes`, `agenda`, `evolucoes`, `servicos`, `caixa`, `estoque`, `esterilizacao` e `config`.

### 3. Criar o login da clínica
1. Abra **Authentication → Users → Add user → Create new user**.
2. Coloque o e-mail da Maria Jucélia e uma senha, e marque **Auto Confirm User**.
3. Em **Authentication → Sign In / Providers** (ou *Settings*), **desligue "Allow new users to sign up"**.
   Assim ninguém de fora consegue criar conta no sistema.
4. Em **Authentication → URL Configuration**, coloque em *Site URL* o endereço do site na Vercel
   (passo 5). Isso faz o "Esqueci minha senha" funcionar.

### 4. Ligar o site ao banco
1. Abra **Project Settings → API** (ou **Data API**).
2. Copie o **Project URL** e a chave **anon public** (ou *publishable*).
   **Nunca** use a chave `service_role` / `secret` no site.
3. Cole os dois em `js/config.js`:
   ```js
   window.SUPABASE_URL = 'https://xxxxxxxx.supabase.co';
   window.SUPABASE_ANON_KEY = 'eyJhbGciOi...';
   ```
   A chave *anon* pode ficar no site: quem protege os dados é o login + a segurança (RLS) criada no passo 2.

### 5. Publicar na Vercel
1. Envie a pasta para um repositório no GitHub.
2. Na Vercel: **Add New → Project**, importe o repositório, *Framework Preset*: **Other**, **Deploy**.
3. Cada `git push` atualiza o site.

### 6. Usar
1. Abra o site, entre com o e-mail e a senha do passo 3.
2. Se já havia dados cadastrados naquele aparelho (versão sem banco), eles são enviados ao banco
   automaticamente no primeiro login.
3. No celular: **Instalar aplicativo** (Android) ou **Adicionar à Tela de Início** (iPhone).

## Ver os dados no painel

No **SQL Editor** do Supabase:
```sql
SELECT nome, telefone, nascimento FROM vw_pacientes ORDER BY nome;
SELECT hora, paciente, situacao FROM vw_agenda WHERE data = current_date ORDER BY hora;
```

## Bom saber

- **Plano grátis do Supabase:** o projeto é pausado se ficar **7 dias sem nenhum acesso**.
  Com uso diário da clínica isso não acontece; se acontecer, é só clicar em *Restore* no painel.
- **Backup:** o plano grátis não oferece cópia de segurança para baixar. Use de vez em quando
  **Configurações → Exportar backup** no sistema e guarde o arquivo no Google Drive.
- **Trocar senha / Sair:** em **Configurações → Conta**.
- **Sem banco:** se `js/config.js` ficar em branco, o sistema funciona só no aparelho, como antes.
