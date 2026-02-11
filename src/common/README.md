# Common Module

Módulo compartilhado que fornece decorators, guards, exceptions e serviços para autenticação e autorização.

## Componentes

### Decorators

#### `@Public()`

Marca uma rota como pública, dispensando qualquer verificação de autenticação/autorização.

```typescript
@Public()
@Get('health')
getHealth() {
  return { status: 'ok' };
}
```

#### `@RequireFeature(feature: string)`

Exige que o usuário possua uma feature específica para acessar a rota.

```typescript
@RequireFeature('create:session')
@Post('sessions')
createSession(@Body() dto: CreateSessionDto) {
  // ...
}
```

#### `@CurrentUser()`

Injeta o usuário atual (autenticado ou anônimo) como parâmetro do método.

```typescript
@Get('user')
@RequireFeature('read:session')
getCurrentUser(@CurrentUser() user: UserWithFeatures) {
  return user;
}
```

### Guards

#### `SessionGuard`

Guard global que injeta o usuário em todas as requisições:
- Se existe cookie `session_id` válido: injeta usuário autenticado
- Caso contrário: injeta usuário anônimo com features padrão

**Features do usuário anônimo:**
- `read:activation_token`
- `create:session`
- `create:user`

#### `FeatureGuard`

Verifica se o usuário possui a feature requerida pelo decorator `@RequireFeature`.

### Exceptions

Classes de exceção customizadas que seguem o padrão do jc-app:

- `ValidationException` - Dados inválidos (400)
- `NotFoundException` - Recurso não encontrado (404)
- `UnauthorizedException` - Não autenticado (401)
- `ForbiddenException` - Sem permissão (403)
- `InternalServerException` - Erro interno (500)

**Uso:**

```typescript
throw new ForbiddenException({
  message: 'Você não possui permissão para executar esta ação.',
  action: 'Verifique se você possui a feature necessária.',
});
```

### Exception Filter

`HttpExceptionFilter` - Filter global que:
- Formata todas as exceções em JSON padronizado
- Limpa cookie de sessão em caso de `UnauthorizedException`
- Loga erros não tratados e envelopa em `InternalServerException`

### Services

#### `AuthorizationService`

Implementa a lógica de verificação de features, incluindo regras especiais.

**Método principal:**

```typescript
can(user: UserWithFeatures, feature: string, resource?: { id?: string }): boolean
```

**Lógica especial para `update:user`:**
- Se `resource` for fornecido, só permite se:
  - O usuário está editando a si mesmo (`resource.id === user.id`), OU
  - O usuário possui a feature `update:user:others`

**Uso:**

```typescript
constructor(private authorizationService: AuthorizationService) {}

updateUser(user: UserWithFeatures, targetUserId: string) {
  if (!this.authorizationService.can(user, 'update:user', { id: targetUserId })) {
    throw new ForbiddenException({
      message: 'Você não pode editar este usuário.',
    });
  }
  // ...
}
```

## Configuração no AppModule

```typescript
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { CommonModule, SessionGuard, FeatureGuard, HttpExceptionFilter } from './common';

@Module({
  imports: [CommonModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: SessionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: FeatureGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
```

## Sistema de Features

### Features por tipo de usuário

| Tipo de usuário | Features |
|-----------------|----------|
| **Anônimo** | `read:activation_token`, `create:session`, `create:user` |
| **Novo (não ativado)** | `read:activation_token` |
| **Ativado** | `create:session`, `read:session`, `update:user` |

### Convenção de nomenclatura

Features seguem o padrão `<ação>:<recurso>[:<modificador>]`:

- `create:user` - Criar usuário
- `read:session` - Ler sessão (usuário logado)
- `update:user` - Atualizar próprio usuário
- `update:user:others` - Atualizar outros usuários (admin)
- `create:session` - Criar sessão (login)
- `read:activation_token` - Usar token de ativação

## Fluxo de Autorização

1. **SessionGuard** (executa primeiro):
   - Verifica cookie `session_id`
   - Injeta usuário autenticado ou anônimo em `request.user`

2. **FeatureGuard** (executa depois):
   - Verifica se a rota tem decorator `@RequireFeature`
   - Se sim, verifica se `request.user` possui a feature
   - Lança `ForbiddenException` se não autorizado

3. **HttpExceptionFilter** (captura exceções):
   - Formata resposta JSON
   - Limpa cookie se `UnauthorizedException`
   - Loga erros inesperados
