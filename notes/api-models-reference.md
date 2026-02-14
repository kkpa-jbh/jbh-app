# API Models Reference

This document lists all API endpoints called by the JBH App with their request and response model names.

**Purpose:** Verify that frontend model names match backend definitions to maintain consistency and avoid confusion during development.

**Date Generated:** 2026-02-14

---

## API Endpoints (Sorted by Path)

| API Path | Request Model | Response Model |
|----------|---------------|----------------|
| GET /auth/checkEmailAvailability | N/A (query param) | Inline: `{ available: boolean }` |
| GET /auth/checkUsernameAvailability | N/A (query param) | Inline: `{ available: boolean }` |
| POST /auth/refresh | Inline: `{ refreshToken?: string }` | `any` (mapped to AuthToken) |
| POST /auth/request-password-reset | Inline: `{ email: string }` | `void` |
| POST /auth/reset-password | Inline: `{ token: string, newPassword: string }` | `void` |
| POST /auth/signin | Inline: `{ usernameOrEmail: string, password: string }` | `any` (mapped to AuthToken) |
| POST /auth/signup | `any` | `any` (mapped to User) |
| POST /auth/verify-email | Inline: `{ token: string }` | `void` |
| POST /auth/logout | Inline: `{}` | `void` |
| GET /finance/categories/expenses | N/A | `CategoryApiResponse[]` |
| GET /finance/categories/incomes | N/A | `CategoryApiResponse[]` |
| GET /finance/product-types | N/A | `ProductTypeApiResponse[]` |
| GET /finance/products | N/A (optional teamId param) | `ProductListItemApiResponse[]` |
| GET /finance/products/metadata-config | N/A (productType query param) | `ProductMetadataConfigApiResponse[]` |
| POST /finance/products | `CreateProductRequest` | `CreateProductResponse` |
| DELETE /finance/products/{id} | N/A | `void` |
| GET /finance/products/{id} | N/A (optional teamId param) | `ProductListItemApiResponse` |
| PATCH /finance/products/{id}/status | Inline: `{ active: boolean }` | `void` |
| PUT /finance/products/{id} | `UpdateProductRequest` | `void` |
| DELETE /finance/products/movements/{productId}/{movementId} | N/A | `void` |
| GET /finance/products/movements/{productId} | N/A | `ProductMovementApiResponse[]` |
| POST /finance/products/movements/{productId} | `AddMovementRequest` | `AddMovementResponse` |
| POST /finance/products/monthly-balances/ | `MonthlyBalanceRequest` | `BalanceHistoryResponse` |
| POST /finance/products/monthly-balances/{productId} | `MonthlyBalanceRequest` | `BalanceHistoryResponse` |
| GET /preferences/v1 | N/A | `PreferencesApiResponse` |
| PUT /preferences/v1 | `UpdatePreferencesDto` (via `toApiRequest()`) | `PreferencesApiResponse` |
| DELETE /user-groups/{teamId} | N/A | `void` |
| PUT /user-groups/{teamId} | `UpdateTeamRequest` | `void` |
| DELETE /user-groups/{teamId}/members/{email} | N/A | `void` |
| POST /user-groups/{teamId}/reinvite | `InviteMemberRequest` | `void` |
| POST /user-groups | `CreateTeamRequest` | `CreateTeamResponse` |
| GET /user-groups | N/A | `CreateTeamResponse[]` |
| POST /user-groups/{groupId}/invitations | `InviteMemberRequest` | `void` |
| POST /user-groups/{groupId}/invitations/accept | Inline: `{}` | `AcceptInvitationResponse` |
| GET /user-groups/my-groups | N/A | `TeamWithMembersApiResponse[]` |
| GET /users/userinfo | N/A | `any` (mapped to User) |

---

## Summary Statistics

- **Total API Endpoints:** 38
- **Typed Request Models:** 11
- **Inline/Untyped Requests:** 16
- **No Request Body (GET/DELETE):** 11
- **Typed Response Models:** 18
- **Untyped Responses (any/void):** 20

---

## Issues & Recommendations

### 1. **Untyped `any` Responses**
The following endpoints return `any` instead of properly typed response interfaces:

- `POST /auth/signin` → Should use a typed response interface (e.g., `SignInResponse` or `AuthTokenResponse`)
- `POST /auth/refresh` → Should use a typed response interface
- `POST /auth/signup` → Should use a typed response interface (e.g., `SignUpResponse` or `UserResponse`)
- `GET /users/userinfo` → Should use a typed response interface (e.g., `UserInfoResponse`)

**Impact:** These are currently typed as `any` and manually mapped to domain models. Using explicit response interfaces would:
- Improve type safety
- Make API contracts clearer
- Help catch breaking changes from backend
- Ensure compliance with the naming standard

### 2. **Inline Request Objects**
Several endpoints use inline object types instead of dedicated request interfaces:

- `POST /auth/signin` → Create `SignInRequest` interface
- `POST /auth/refresh` → Create `RefreshTokenRequest` interface
- `POST /auth/verify-email` → Create `VerifyEmailRequest` interface
- `POST /auth/request-password-reset` → Create `RequestPasswordResetRequest` interface
- `POST /auth/reset-password` → Create `ResetPasswordRequest` interface
- `PATCH /finance/products/{id}/status` → Create `UpdateProductStatusRequest` interface
- `POST /user-groups/{groupId}/invitations/accept` → Create `AcceptInvitationRequest` interface (or use `void` if no body)

**Impact:** Inline types make it harder to:
- Reuse request types
- Validate against backend contracts
- Track API changes

### 3. **Missing Response Types for void Endpoints**
Consider if any `void` response endpoints should return confirmation/acknowledgment objects for better error handling and auditability.

---

## Compliance with Naming Standard

### ✅ **Compliant Response Models** (following `*Response` or `*ApiResponse` pattern):
- `ProductTypeApiResponse`
- `ProductMetadataConfigApiResponse`
- `CreateProductResponse`
- `ProductListItemApiResponse`
- `AddMovementResponse`
- `ProductMovementApiResponse`
- `CreateTeamResponse`
- `TeamWithMembersApiResponse`
- `AcceptInvitationResponse`
- `CategoryApiResponse`
- `PreferencesApiResponse`
- `BalanceHistoryResponse`

### ⚠️ **Non-Compliant or Untyped Responses:**
- Auth endpoints using `any` instead of typed response interfaces
- Various endpoints returning `void` (acceptable for DELETE/UPDATE operations)
- Inline types instead of named interfaces

---

## Next Steps

1. **Verify Backend Naming:** Compare these frontend model names with actual backend response object names
2. **Create Missing Response Interfaces:** Add proper response types for auth endpoints currently using `any`
3. **Create Missing Request Interfaces:** Replace inline request types with dedicated interfaces
4. **Document Discrepancies:** If backend uses different names, update frontend to match per CLAUDE.md standards

---

**Related Files:**
- Request/Response Interfaces: `src/app/core/domain/models/*.model.ts`
- Repository Implementations: `src/app/core/infrastructure/repositories/*.repository.impl.ts`
- API Base Service: `src/app/core/infrastructure/api/api-base.service.ts`
