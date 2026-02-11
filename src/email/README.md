# Módulo de Email

Este módulo gerencia o envio de emails utilizando Nodemailer.

## Estrutura

```
email/
├── email.service.ts      # Serviço de envio de emails
├── email.module.ts       # Módulo NestJS
├── index.ts              # Exports
└── README.md
```

## Configuração

### Variáveis de Ambiente

As seguintes variáveis devem ser configuradas no arquivo `.env.development` ou `.env.production`:

```bash
# Email configuration
SMTP_HOST=localhost           # Host do servidor SMTP
SMTP_PORT=1025               # Porta do servidor SMTP
SMTP_USER=                   # Usuário SMTP (opcional)
SMTP_PASSWORD=               # Senha SMTP (opcional)
SMTP_FROM_EMAIL=noreply@auth-nest.local  # Email remetente
SMTP_FROM_NAME=Auth Nest     # Nome do remetente
APP_BASE_URL=http://localhost:3000       # URL base da aplicação
```

### Mailcatcher (Desenvolvimento)

Para desenvolvimento, usamos o [Mailcatcher](https://mailcatcher.me/) que captura emails enviados e exibe em uma interface web.

O Mailcatcher já está configurado no `compose.yml`:

```yaml
mailcatcher:
  container_name: nest-mailcatcher-dev
  image: 'sj26/mailcatcher:v0.10.0'
  ports:
    - '1080:1080' # Web UI
    - '1025:1025' # SMTP
```

#### Iniciar serviços

```bash
npm run services:up
```

#### Acessar interface web

Abra o navegador em: http://localhost:1080

## Funcionalidades

### EmailService

#### `sendEmail(options: SendEmailOptions): Promise<void>`

Envia um email genérico.

**Parâmetros**:
```typescript
interface SendEmailOptions {
  to: string;      // Destinatário
  subject: string; // Assunto
  text: string;    // Texto plano
  html?: string;   // HTML (opcional)
}
```

**Exemplo**:
```typescript
await this.emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Welcome',
  text: 'Welcome to our app!',
  html: '<p>Welcome to our app!</p>',
});
```

#### `sendActivationEmail(to: string, username: string, activationTokenId: string): Promise<void>`

Envia um email de ativação de conta com link contendo o token.

**Parâmetros**:
- `to`: Email do destinatário
- `username`: Nome de usuário para personalização
- `activationTokenId`: ID do token de ativação

**Exemplo**:
```typescript
await this.emailService.sendActivationEmail(
  'user@example.com',
  'johndoe',
  'uuid-token-id'
);
```

O email gerado contém:
- Saudação personalizada com o username
- Botão/link para ativação: `{APP_BASE_URL}/activations/{tokenId}`
- Aviso de expiração (15 minutos)
- Texto alternativo em HTML e plain text

## Integração com Outros Módulos

O `EmailModule` é importado por:

- **UsersModule**: Para enviar email de ativação ao criar usuário
- **ActivationsModule**: Para funcionalidades futuras de reenvio de email

## Exemplo de Uso

### No UsersService

```typescript
import { EmailService } from '../email/email.service';
import { ActivationsService } from '../activations/activations.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly emailService: EmailService,
    private readonly activationsService: ActivationsService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // Criar usuário
    const newUser = await this.usersRepository.create({...});

    // Criar token de ativação
    const activationToken = await this.activationsService.createActivationToken(
      newUser.id
    );

    // Enviar email de ativação
    await this.emailService.sendActivationEmail(
      newUser.email,
      newUser.username,
      activationToken.id
    );

    return newUser;
  }
}
```

## Testes

Para testar o envio de emails em desenvolvimento:

1. Inicie os serviços: `npm run services:up`
2. Crie um usuário via API: `POST /users`
3. Acesse o Mailcatcher: http://localhost:1080
4. Verifique se o email de ativação foi recebido

## Produção

Em produção, configure as variáveis de ambiente para um servidor SMTP real:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@yourapp.com
SMTP_FROM_NAME=Your App Name
APP_BASE_URL=https://yourapp.com
```

**Nota**: Para Gmail, você precisará gerar uma senha de aplicativo. Para outros provedores, consulte a documentação específica.
