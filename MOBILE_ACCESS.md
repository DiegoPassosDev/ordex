# 🔧 Acessando a aplicação pelo celular na mesma rede

## Passo 1: Obter o IP do seu computador

**Windows:**

```bash
ipconfig
```

Procure por "IPv4 Address" (algo como `192.168.1.100`)

**Mac/Linux:**

```bash
ifconfig
```

## Passo 2: Configurar variáveis de ambiente

### Frontend (`frontend/.env.local`)

Crie ou edite o arquivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://192.168.1.100:3001
```

Substitua `192.168.1.100` pelo IP obtido no Passo 1.

### Backend (`backend/.env`)

Certifique-se que o backend está configurado para ouvir em todos os IPs:

```env
NODE_ENV=development
FRONTEND_URL=http://192.168.1.100:3000
```

## Passo 3: Iniciar o servidor backend

```bash
cd backend
pnpm run dev
```

O backend rodará em `http://0.0.0.0:3001` (acessível em qualquer IP)

## Passo 4: Iniciar o servidor frontend

```bash
cd frontend
# Use --host 0.0.0.0 (NÃO --hostname)
pnpm run dev --host 0.0.0.0
```

Você verá algo como:

```
> Local:        http://localhost:3000
> Network:      http://192.168.1.100:3000
```

## Passo 5: No celular

1. Acesse: `http://192.168.1.100:3000` (substitua pelo IP)
2. Os botões agora devem responder ao toque

## ⚠️ Problemas comuns

### "Não consigo acessar"

- Verifique se ambos os dispositivos estão na **mesma rede Wi-Fi**
- Verifique o firewall do computador (pode estar bloqueando a porta 3000 e 3001)
- Teste: `ping 192.168.1.100` do celular

### "Conexão recusada ao tentar fazer login"

- Confirme que `NEXT_PUBLIC_API_URL` está correto no `.env.local`
- Reinicie o servidor frontend após editar `.env.local`
- Verifique que o backend está rodando (`pnpm run dev` no diretório `/backend`)

### "Botões ainda não funcionam"

- Limpe o cache do navegador (Ctrl+Shift+Del)
- Force refresh: `Ctrl+Shift+R` ou `Cmd+Shift+R`
- Tente novamente após os passos acima
