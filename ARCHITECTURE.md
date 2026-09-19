# Cookify Backend Architecture Documentation

## 1. Architectural Patterns & Core Technology

Cookify Backend is a RESTful Web API built on Node.js and Express.js, utilizing MongoDB as its primary persistence layer through Mongoose ORM. The application adopts a Layered (N-Tier) Architectural Pattern with clear separation of concerns across Routing, Request Validation, Controllers, Services, and Data Access Models.

```mermaid
graph TD
    Client[Client Applications / Mobile / Web]
    API Gateway/Router[Express Router Layer]
    Auth[Auth & Admin Middleware]
    Validation[Validation Middleware]
    Controller[Controller Layer]
    Service[Service Layer / Domain Logic]
    Models[Mongoose Models Layer]
    MongoDB[(MongoDB Database)]
    SMTP[External SMTP / Nodemailer]
    FatSecret[FatSecret REST API]

    Client -->|HTTP / Cookies| Router
    Router --> Auth
    Auth --> Validation
    Validation --> Controller
    Controller --> Service
    Service --> Models
    Service --> SMTP
    Models --> MongoDB
    s.js[FatSecret Data Ingestion Script] --> FatSecret
    s.js --> Models
```

### Core Technologies & Libraries
- **Runtime**: Node.js (CommonJS module system)
- **Web Framework**: Express.js (v5.x)
- **Database**: MongoDB via Mongoose ORM (v9.x)
- **Authentication & Security**: JSON Web Tokens (`jsonwebtoken`), Password Hashing (`bcryptjs`), Cookie Parser (`cookie-parser`)
- **Email Delivery**: Nodemailer (`nodemailer`) for password reset OTP generation and verification
- **Utility Tooling**: `slugify` (URL slug generation), `axios` & `oauth-1.0a` (FatSecret external API integration in `s.js`)

### Architectural Decisions & Design Principles
1. **Layered Decoupling**: Routers handle endpoint definitions, Middleware handles JWT verification & request validation, Controllers manage HTTP request/response lifecycles, Services contain business logic, and Models handle MongoDB schema constraints.
2. **Stateless JWT Session Management with Cookie & Header Fallback**: Access tokens and Refresh tokens can be passed either via `Authorization: Bearer <token>` headers or HTTP-only cookies (`token`, `accessToken`, `refreshToken`). Token auto-refresh is handled seamlessly inside the authentication middleware.
3. **Precomputed & Snapshot Nutrition Model**: Rather than dynamically recalculating full nutritional trees on every read request, recipe nutrition values per 100g are auto-calculated and stored upon recipe modification. Daily food intake entries store static `nutritionSnapshot` objects to preserve historical accuracy even if master recipe definitions change.

---

## 2. Directory Structure & Component Boundaries

```
cookify-backend/
├── app.js                   # Application entrypoint & Express setup
├── config/
│   └── db.js                # MongoDB connection handler
├── controller/              # Route controllers (HTTP request/response handling)
│   ├── auth.controller.js
│   ├── favourite.controller.js
│   ├── ingredient.controller.js
│   ├── inventory.controller.js
│   ├── mealSchedule.controller.js
│   ├── nutrition.controller.js
│   ├── passwordReset.controller.js
│   ├── profile.controller.js
│   ├── recipe.controller.js
│   └── user.controller.js
├── middleware/
│   ├── admin.middleware.js   # Authorization check for admin role
│   └── auth.middleware.js    # JWT authentication & session refresh middleware
├── models/                  # Mongoose data schemas
│   ├── DailyIntake.model.js
│   ├── Favourite.model.js
│   ├── Ingredient.model.js
│   ├── Inventory.model.js
│   ├── MealSchedule.model.js
│   ├── NutritionGoals.model.js
│   ├── OTP.model.js
│   ├── Rating.model.js
│   ├── Recipe.model.js
│   ├── User.model.js
│   └── UserProfile.model.js
├── router/                  # API route definitions
│   ├── auth.routes.js
│   ├── calorieTrack.route.js # Backward-compatible aliases for nutrition routes
│   ├── favourite.routes.js
│   ├── ingredient.routes.js
│   ├── inventory.routes.js
│   ├── mealSchedule.routes.js
│   ├── nutrition.routes.js
│   ├── profile.routes.js
│   ├── recipe.routes.js
│   └── user.routes.js
├── service/                 # Domain business logic
│   ├── auth.service.js
│   ├── ingredient.service.js
│   ├── inventory.service.js
│   ├── mealSchedule.service.js
│   ├── nutrition.service.js
│   ├── passwordReset.service.js
│   └── recipe.service.js
├── validation/              # Input payload validation middleware
│   ├── auth.validation.js
│   ├── ingredient.validation.js
│   ├── inventory.validation.js
│   ├── passwordReset.validation.js
│   ├── profile.validation.js
│   ├── recipe.validation.js
│   └── user.validation.js
└── s.js                     # FatSecret OAuth food search & DB seed utility
```

---

## 3. Data Models & Persistence Architecture

MongoDB stores document collections defined via Mongoose schemas.

```mermaid
erDiagram
    User ||--o| UserProfile : 