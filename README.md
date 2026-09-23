# Food Delivery — Microservices Platform

Node.js/Express microservices backend, PostgreSQL (one DB per service),
JWT auth, and an API gateway in front. Built as the application layer for
you to wrap in Docker/K8s/Terraform/Jenkins/ArgoCD/monitoring on your own.

## Architecture

```
                        ┌─────────────────┐
   client  ───────────▶ │   api-gateway    │  :4000
                        └─────────┬────────┘
              ┌───────────────────┼───────────────────┬──────────────┐
              ▼                   ▼                    ▼              ▼
      user-service        restaurant-service     order-service   delivery-service
         :4001                  :4002                :4003            :4004
      (userdb)              (restaurantdb)         (orderdb)      (deliverydb)
                                                        │                │
                                                        └───────┬────────┘
                                                                ▼
                                                      notification-service
                                                             :4005
                                                        (in-memory log)
```

- **Database-per-service**: each service owns its schema; no service reaches into
  another's tables. `order-service` calls `restaurant-service` over HTTP to validate
  menu items/pricing; `delivery-service` calls `order-service` to keep order status
  in sync. This is the seam you'll want to replace with async messaging
  (RabbitMQ/SQS/Kafka) later if you want looser coupling.
- **Auth**: `user-service` issues JWTs (`JWT_SECRET`, shared across services via env
  var) on login. Other services verify the token locally — no auth service round-trip
  per request.
- **Notification-service** is intentionally simple (in-memory log + `/notify` endpoint)
  — swap it for a real provider or put a queue in front of it once you're building
  out the infra layer.
- One Postgres **instance** hosts 4 logical databases (`userdb`, `restaurantdb`,
  `orderdb`, `deliverydb`) for easy local dev — swap for 4 separate managed instances
  (RDS/CloudSQL) in your cloud setup; the app code doesn't change, only `PGHOST`/`PGPORT`.

## Run it

```bash
docker compose up --build
```

Gateway comes up at `http://localhost:4000`. Individual services are also exposed
directly (4001–4005) for debugging.

No `.env` files needed for local dev — compose sets everything. For local
non-Docker dev, copy `.env.example` in each service to `.env` and run `npm install && npm run dev`
inside each folder (with a local Postgres running on 5432).

## API reference (via gateway, prefix `/api`)

### user-service → `/api/users`
| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/register` | – | `{name,email,password,address?,phone?}` | |
| POST | `/login` | – | `{email,password}` | returns `{token, user}` |
| GET | `/me` | Bearer | – | current user |

### restaurant-service → `/api/restaurants`
| Method | Path | Auth | Body |
|---|---|---|---|
| GET | `/` | – | list active restaurants |
| GET | `/:id` | – | one restaurant |
| GET | `/:id/menu` | – | available menu items |
| POST | `/` | admin | `{name,address?,phone?}` |
| POST | `/:id/menu` | admin | `{name,description?,price}` |

### order-service → `/api/orders`
| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/` | Bearer | `{restaurantId, deliveryAddress?, items:[{menuItemId,quantity}]}` |
| GET | `/mine` | Bearer | your orders |
| GET | `/:id` | Bearer | order + items (owner or admin) |
| PATCH | `/:id/status` | Bearer | `{status}` |

### delivery-service → `/api/deliveries`
| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/` | admin | `{orderId, driverName?}` |
| GET | `/order/:orderId` | Bearer | delivery for an order |
| PATCH | `/:id/status` | Bearer | `{status}` — also syncs order status |

### notification-service → `/api/notifications`
| Method | Path | Notes |
|---|---|---|
| POST | `/notify` | internal, called by other services |
| GET | `/notifications` | last 50 events, for demoing |

## Smoke test

```bash
BASE=http://localhost:4000/api

# 1. register + login
curl -s $BASE/users/register -H 'Content-Type: application/json' \
  -d '{"name":"Atharva","email":"a@example.com","password":"pass1234"}'
TOKEN=$(curl -s $BASE/users/login -H 'Content-Type: application/json' \
  -d '{"email":"a@example.com","password":"pass1234"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

# 2. seed a restaurant + menu item as admin (register/login an admin user with role=admin first)
# ... then:
curl -s $BASE/restaurants -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Pizza Place","address":"Surat"}'
curl -s $BASE/restaurants/1/menu -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Margherita","price":9.99}'

# 3. place an order
curl -s $BASE/orders -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"restaurantId":1,"items":[{"menuItemId":1,"quantity":2}]}'

# 4. check notifications fired
curl -s $BASE/notifications
```

## What's deliberately left for you (the DevOps part)

- Dockerfiles are here and work as-is (`docker compose up --build`), but they're
  dev-grade (no multi-stage build, no non-root user) — harden for your image
  pipeline.
- No Kubernetes manifests/Helm charts, Terraform, Jenkinsfile, Ansible playbooks,
  ArgoCD app defs, or Prometheus/Grafana/ELK config — that's the stack you said
  you're building yourself.
- Secrets (`JWT_SECRET`, DB creds) are hardcoded dev defaults in compose — wire these
  to your secrets manager / K8s secrets.
- No rate limiting, request logging middleware, or centralized tracing (would pair
  well with your observability layer — trace IDs propagated through the
  `axios` calls between services is a natural next step).
