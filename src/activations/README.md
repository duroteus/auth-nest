# Módulo de Activations

Este módulo gerencia a ativação de contas de usuários através de tokens de ativação.

## Estrutura

```
activations/
├── repositories/
│   ├── activations.repository.interface.ts   # Interface do repository
│   └── drizzle-activations.repository.ts      # Implementação Drizzle
├── activations.controller.ts                  # Controller HTTP
├── activations.service.ts                     # Lógica de negócio
├── activations.module.ts                      # Módulo NestJS
└── README.md
```

## Funcionalidades

### ActivationsService

- **`createActivationToken(userId: string)`**: Cria um token de ativação que expira em 15 minutos
- **`activateAccount(tokenId: string)`**: Ativa uma conta de usuário
  - Valida se o token existe, não foi usado e não expirou
  - Atualiza as features do usuário para: `['create:session', 'read:session', 'update:user']`
  - Marca o token como usado
- **`cleanupExpiredTokens()`**: Remove tokens expirados do banco de dados

### ActivationsController

#### `PATCH /activations/:tokenId`

Ativa uma conta de usuário usando um token de ativação.

**Autenticação**: Requer feature `read:activation_token`

**Parâmetros**:
- `tokenId` (path): ID do token de ativação

**Respostas**:
- `200 OK`: Conta ativada com sucesso
  ```json
  {
    "message": "Account activated successfully",
    "user": {
      "id": "uuid",
      "username": "username",
      "email": "email@example.com",
      "features": ["create:session", "read:session", "update:user"],
      "createdAt": "2026-02-11T12:00:00.000Z",
      "updatedAt": "2026-02-11T12:00:00.000Z"
    }
  }
  ```
- `404 Not Found`: Token não encontrado
- `403 Forbidden`: Token já usado ou expirado

## Schema do Banco de Dados

Tabela `activation_tokens`:

```sql
CREATE TABLE activation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## Fluxo de Ativação

1. Um usuário é criado com features: `['read:activation_token']`
2. Um token de ativação é criado (expira em 15 minutos)
3. O usuário recebe um email com o link de ativação contendo o `tokenId`
4. O usuário acessa o link e faz `PATCH /activations/:tokenId`
5. O sistema valida o token e atualiza as features do usuário
6. O usuário agora pode fazer login e usar o sistema

## Integração com Outros Módulos

- **UsersModule**: Utiliza o `IUsersRepository` para buscar e atualizar features dos usuários
- **DrizzleModule**: Utiliza o `DrizzleService` para acessar o banco de dados

## Exemplo de Uso

```typescript
// No service de criação de usuários
const user = await this.usersService.create(createUserDto);

// Criar token de ativação
const token = await this.activationsService.createActivationToken(user.id);

// Enviar email com o link de ativação
await this.emailService.sendActivationEmail(user.email, token.id);
```

## Testes

Os testes e2e cobrem os seguintes cenários:

- ✅ Ativação com token válido
- ✅ Falha quando token não existe
- ✅ Falha quando token já foi usado
- ✅ Falha quando token está expirado

Executar testes:

```bash
npm run test:e2e -- activations.e2e-spec.ts
```
