# Backend Alignment Audit - API Response Interfaces

**Date:** 2026-02-14
**Purpose:** Verify all frontend response interface names match backend response object names before reorganization

## ⚠️ ACTION REQUIRED

Please review this list and verify each interface name matches your backend API response objects. Mark any discrepancies that need to be fixed **before** the model reorganization.

---

## Products Feature

### Response Interfaces

| Frontend Interface | File | Status | Backend Name |
|-------------------|------|--------|--------------|
| `CreateProductResponse` | product.model.ts | ⏳ Verify | ❓ |
| `ProductTypeApiResponse` | product-type.model.ts | ⏳ Verify | ❓ |
| `ProductIdApiResponse` | product-list-item.model.ts | ⏳ Verify | ❓ |
| `ProductMetadataApiResponse` | product-list-item.model.ts | ⏳ Verify | ❓ |
| `ProductListItemApiResponse` | product-list-item.model.ts | ⏳ Verify | ❓ |
| `ProductMetadataConfigApiResponse` | product-metadata-config.model.ts | ⏳ Verify | ❓ |

### Request Interfaces

| Frontend Interface | File | Notes |
|-------------------|------|-------|
| `CreateProductRequest` | product.model.ts | - |
| `UpdateProductRequest` | product.model.ts | - |

---

## Teams Feature

### Response Interfaces

| Frontend Interface | File | Status | Backend Name |
|-------------------|------|--------|--------------|
| `CreateTeamResponse` | team.model.ts | ⏳ Verify | ❓ |
| `TeamMemberApiResponse` | team.model.ts | ⏳ Verify | ❓ |
| `TeamWithMembersApiResponse` | team.model.ts | ⏳ Verify | ❓ |
| `AcceptInvitationResponse` | team.model.ts | ⏳ Verify | ❓ |

### Request Interfaces

| Frontend Interface | File | Notes |
|-------------------|------|-------|
| `CreateTeamRequest` | team.model.ts | - |
| `UpdateTeamRequest` | team.model.ts | - |

---

## Movements Feature

### Response Interfaces

| Frontend Interface | File | Status | Backend Name |
|-------------------|------|--------|--------------|
| `AddMovementResponse` | movement.model.ts | ⏳ Verify | ❓ |
| `ProductMovementApiResponse` | product-movement-api-response.interface.ts | ⏳ Verify | ❓ |

### Request Interfaces

| Frontend Interface | File | Notes |
|-------------------|------|-------|
| `AddMovementRequest` | movement.model.ts | - |

### ⚠️ DUPLICATE TYPE DETECTED

**`MovementType`** is defined in **TWO** files:
- `movement.model.ts` (line 1)
- `product-movement-api-response.interface.ts` (line 1)

**Resolution:** Will consolidate into single `features/movements/types/movement.types.ts` during migration

---

## Categories Feature

### Response Interfaces

| Frontend Interface | File | Status | Backend Name |
|-------------------|------|--------|--------------|
| `CategoryApiResponse` | category.model.ts | ⏳ Verify | ❓ |

### Types

| Type | File | Notes |
|------|------|-------|
| `CategorySource` | category.model.ts | Union type: 'INCOME' \| 'EXPENSE' |
| `CategoryType` | product-movement-api-response.interface.ts | Different from `CategorySource` - used in movements |

---

## Balance History Feature

### Response Interfaces

| Frontend Interface | File | Status | Backend Name |
|-------------------|------|--------|--------------|
| `BalanceHistoryResponse` | balance-history-response.interface.ts | ⏳ Verify | ❓ |
| `BalanceHistorySummaryResponse` | balance-history-response.interface.ts | ⏳ Verify | ❓ |
| `BalanceHistoryEntryResponse` | balance-history-response.interface.ts | ⏳ Verify | ❓ |

### Request Interfaces

| Frontend Interface | File | Notes |
|-------------------|------|-------|
| `MonthlyBalanceRequest` | balance-history.model.ts | - |

**Note:** This feature already has good separation between responses (`.interface.ts` file) and models (`.model.ts` file)

---

## Preferences Feature

### Response Interfaces

| Frontend Interface | File | Status | Backend Name |
|-------------------|------|--------|--------------|
| `PreferencesApiResponse` | preferences.model.ts | ⏳ Verify | ❓ |

### Request Interfaces

| Frontend Interface | File | Notes |
|-------------------|------|-------|
| `UpdatePreferencesDto` | preferences.model.ts | Application-level DTO |
| `UpdatePreferencesApiRequest` | preferences.model.ts | HTTP boundary DTO |

**Note:** Includes `toApiRequest()` helper function to convert DTO to API request

---

## Shared/Core Models (Will NOT be moved)

These are cross-cutting concerns used across all features:

| Model | File | Type | Notes |
|-------|------|------|-------|
| `User` | user.model.ts | class | User authentication model |
| `AuthToken` | auth-token.model.ts | class | JWT token model |
| `LoginCredentials` | login-credentials.model.ts | interface | Login request |
| `JBHError` | jbh-error.model.ts | class | Error handling |
| `PortfolioContext` | portfolio-context.model.ts | class | Portfolio context |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| **Total Response Interfaces** | **16** |
| **Total Request Interfaces** | **8** |
| **Duplicate Types Found** | **1** (`MovementType`) |
| **Features to Migrate** | **6** |
| **Shared Models (Stay in Core)** | **5** |

---

## Next Steps

1. ✅ **User Review:** Verify all response interface names match backend
2. ⏳ **Fix Mismatches:** Rename any interfaces that don't match backend (BEFORE migration)
3. ⏳ **Proceed with Migration:** Once aligned, start feature-by-feature reorganization

---

## Verification Checklist

Please mark each response interface after verifying against backend code:

- [ ] Products: All 6 response interfaces verified
- [ ] Teams: All 4 response interfaces verified
- [ ] Movements: All 2 response interfaces verified
- [ ] Categories: CategoryApiResponse verified
- [ ] Balance History: All 3 response interfaces verified
- [ ] Preferences: PreferencesApiResponse verified

---

## Questions for Backend Alignment

1. **Auth Responses:** Currently using `any` in auth repository - what are the actual backend response object names for:
   - Login response
   - Refresh token response
   - Register response

2. **Naming Convention:** Does backend use `*Response` or `*ApiResponse` suffix? Should frontend standardize?

3. **Value Objects:** Are nested objects like `ProductIdApiResponse` { value: string } actually backend value objects, or frontend additions?

