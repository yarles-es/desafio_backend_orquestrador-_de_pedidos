# Orquestrador de Pedidos · NestJS + Prisma + BullMQ

API de **webhook de pedidos** com **processamento assíncrono** via fila, **enriquecimento** chamando
serviço externo (câmbio), **retries** com **backoff**, **DLQ** (dead-letter queue), **idempotência** e
**métricas** da fila.

# Funcionalidades

- `POST /webhooks/orders` — recebe pedidos (validação + idempotência)
- Enfileira para **processamento assíncrono** (BullMQ/Redis)
- Enriquecimento chamando API externa (ex.: conversão de moeda)
- **Retries** com backoff exponencial; falhas definitivas vão para **DLQ**
- `GET /orders` e `GET /orders/:id` — consulta de pedidos
- `GET /queue/metrics` — métricas básicas da fila

# Stacks

- **NestJS** (API, módulos, validação)
- **Prisma** + **PostgreSQL** (persistência)
- **BullMQ** + **Redis** (fila)
- **Axios** (integração externa)
- **class-validator / class-transformer** (DTOs)

# Pré-requisitos

- **Node.js** 18+
- **npm** 10+
- **PostgreSQL** 13+
- **Redis** 6/7
- **Docker**

# Configuração

1. **Clone e instale**

# Orquestrador de Pedidos · NestJS + Prisma + BullMQ

API de **webhook de pedidos** com **processamento assíncrono** via fila, **enriquecimento** chamando
serviço externo (câmbio), **retries** com **backoff**, **DLQ** (dead-letter queue), **idempotência** e
**métricas** da fila.

# Funcionalidades

- `POST /webhooks/orders` — recebe pedidos (validação + idempotência)
- Enfileira para **processamento assíncrono** (BullMQ/Redis)
- Enriquecimento chamando API externa (ex.: conversão de moeda)
- **Retries** com backoff exponencial; falhas definitivas vão para **DLQ**
- `GET /orders` e `GET /orders/:id` — consulta de pedidos
- `GET /queue/metrics` — métricas básicas da fila

# Stacks

- **NestJS** (API, módulos, validação)
- **Prisma** + **PostgreSQL** (persistência)
- **BullMQ** + **Redis** (fila)
- **Axios** (integração externa)
- **class-validator / class-transformer** (DTOs)

# Pré-requisitos

- **Node.js** 18+
- **npm** 10+
- **PostgreSQL** 13+
- **Redis** 6/7
- **Docker**

# Configuração

## 1. Clone e instale dependências

```bash
git clone <repository-url>
cd desafio_backend_orquestrador-_de_pedidos
npm install
```

## 2. Configuração de ambiente

Copie o arquivo de exemplo e configure as variáveis:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Server
PORT=3000
GLOBAL_PREFIX='/api'

# Database
DATABASE_URL='postgresql://postgres:postgres@localhost:5432/ordersdb'

# Redis
REDIS_URL='redis://localhost:6379'

# External API
TARGET_CURRENCY='BRL'
EXCHANGE_API_BASE='https://api.frankfurter.dev/v1'
```

## 3. Configuração do banco de dados (Prisma)

Inicialize o Prisma para configurar e criar o banco de dados:

```bash
# Aplica as migrações e cria o banco de dados
npx prisma migrate dev --name init

# Gera o cliente Prisma
npx prisma generate
```

> **Nota**: Certifique-se de que o PostgreSQL está rodando e acessível com as credenciais configuradas no arquivo `.env`.

## 4. Executando a aplicação

### Desenvolvimento

```bash
npm start:dev
```

A aplicação será executada em `http://localhost:3000` com prefixo `/api`.

# Endpoints da API

## 1. Receber Pedido (Webhook)

**POST** `/api/webhooks/orders`

### Payload

```json
{
  "order_id": "ext-123",
  "customer": {
    "email": "user@example.com",
    "name": "Ana"
  },
  "items": [
    {
      "sku": "ABC123",
      "qty": 2,
      "unit_price": 59.9
    }
  ],
  "currency": "USD",
  "idempotency_key": "c3e5f6e8-0d67-4a6c-8b8a-111111111111"
}
```

### Resposta

```json
{
  "id": "ord_cuid",
  "status": "RECEIVED"
}
```

> **Nota**: Utiliza **HTTP 202 Accepted** para indicar que o pedido foi recebido e será processado de forma assíncrona.

## 2. Listar Pedidos

**GET** `/api/orders?status=ENRICHED`

**GET** `/api/orders/:id`

## 3. Métricas da Fila

**GET** `/api/queue/metrics`

### Exemplo de resposta

```json
{
  "orders": {
    "waiting": 2,
    "active": 1,
    "completed": 10,
    "failed": 0,
    "delayed": 0,
    "paused": 0
  },
  "dlq": {
    "waiting": 1,
    "active": 0,
    "completed": 0,
    "failed": 0,
    "delayed": 0,
    "paused": 0
  }
}
```
