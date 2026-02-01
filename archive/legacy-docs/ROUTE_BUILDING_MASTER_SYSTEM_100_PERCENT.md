# Route Building Master System - All 13 Recommendations 100%

**Date:** January 22, 2026  
**Status:** ✅ Complete Master Guide  
**Scope:** Perfect Route Development System

---

## 🎯 The Perfect Route Development System

This is the **definitive guide** for building routes that implement all 13 recommendations at 100% completeness.

---

## ✅ Quick Reference: Route Middleware Stack

```
REQUEST FLOW:
│
├─ 1️⃣  RATE LIMITER      (Recommendation 5)
│      Prevents abuse: 100/15min default
│
├─ 2️⃣  AUTHENTICATE       (Recommendation 4)
│      Validates JWT token & extracts user
│
├─ 3️⃣  REQUIRE SCOPE      (Recommendation 4)
│      Verifies permission scopes
│
├─ 4️⃣  AUDIT LOG          (Recommendation 13)
│      Logs all request metadata
│
├─ 5️⃣  VALIDATORS         (Recommendation 6)
│      Validates request body/params
│
├─ 6️⃣  HANDLE ERRORS      (Recommendation 6)
│      Formats validation errors
│
└─ 7️⃣  HANDLER            (All recommendations)
       Processes request & delegates errors
```

---

## 📋 Route Types & Patterns

### Pattern 1: Create (POST)

```javascript
/**
 * POST /api/resource
 * Create new resource
 * Scope: resource:write
 */
router.post(
  "/resource",
  limiters.general,
  authenticate,
  requireOrganization,
  requireScope("resource:write"),
  auditLog,
  [
    validateString("name", { maxLength: 100 }),
    validateEmail("email"),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      // Rec 7: Use select to reduce payload size
      const resource = await prisma.resource.create({
        data: {
          ...req.body,
          userId: req.user.sub,
          orgId: req.auth.organizationId,
        },
        select: { id: true, name: true, email: true, createdAt: true },
      });

      // Rec 12: Successful response with metadata
      res.status(201).json({
        success: true,
        data: resource,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err); // Rec 11: Delegate to errorHandler
    }
  },
);
```

### Pattern 2: Read (GET by ID)

```javascript
/**
 * GET /api/resource/:id
 * Get specific resource
 * Scope: resource:read
 */
router.get(
  "/resource/:id",
  limiters.general,
  authenticate,
  requireOrganization,
  requireScope("resource:read"),
  cacheMiddleware(60), // Rec 9: Cache for 60 seconds
  auditLog,
  [validateUUID("id"), handleValidationErrors],
  async (req, res, next) => {
    try {
      const resource = await prisma.resource.findUnique({
        where: { id: req.params.id },
        select: {
          // Rec 7: Only needed fields
          id: true,
          name: true,
          email: true,
          status: true,
          createdAt: true,
        },
      });

      if (!resource) {
        return res.status(404).json({
          success: false,
          error: "Resource not found",
          errorId: req.correlationId,
        });
      }

      res.json({ success: true, data: resource });
    } catch (err) {
      next(err);
    }
  },
);
```

### Pattern 3: List with Pagination (GET)

```javascript
/**
 * GET /api/resource
 * List all resources with pagination
 * Query params: page, pageSize, status
 * Scope: resource:read
 */
router.get(
  "/resource",
  limiters.general,
  authenticate,
  requireOrganization,
  requireScope("resource:read"),
  cacheMiddleware(60),
  auditLog,
  [
    ...validatePaginationQuery({ maxPageSize: 100 }), // Rec 6: Page/size validators
    validateEnum("status", RESOURCE_STATUSES).optional(), // Rec 1: From shared
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { page = 1, pageSize = 20, status } = req.query;
      const orgId = req.auth.organizationId;

      const where = { orgId };
      if (status) where.status = status;

      // Rec 7: Efficient parallel queries
      const [resources, total] = await Promise.all([
        prisma.resource.findMany({
          where,
          select: {
            // Rec 7: Specific fields only
            id: true,
            name: true,
            status: true,
            createdAt: true,
          },
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: "desc" },
        }),
        prisma.resource.count({ where }),
      ]);

      res.json({
        success: true,
        data: resources,
        pagination: {
          page,
          pageSize,
          total,
          pages: Math.ceil(total / pageSize),
          hasNext: page < Math.ceil(total / pageSize),
          hasPrev: page > 1,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);
```

### Pattern 4: Update (PUT)

```javascript
/**
 * PUT /api/resource/:id
 * Update resource
 * Scope: resource:write
 */
router.put(
  "/resource/:id",
  limiters.general,
  authenticate,
  requireOrganization,
  requireScope("resource:write"),
  auditLog,
  [
    validateUUID("id"),
    validateString("name", { maxLength: 100 }).optional(),
    validateEnum("status", RESOURCE_STATUSES).optional(),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Rec 6: Build update data with only changed fields
      const updateData = {};
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.status !== undefined) updateData.status = req.body.status;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: "No fields to update",
        });
      }

      // Rec 7: Efficient update
      const resource = await prisma.resource.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          status: true,
          updatedAt: true,
        },
      });

      // Rec 9: Invalidate caches on write
      invalidateCache(`resource:${id}`);
      invalidateCache("resource:list");

      res.json({
        success: true,
        data: resource,
        message: "Resource updated",
      });
    } catch (err) {
      next(err);
    }
  },
);
```

### Pattern 5: Delete (DELETE)

```javascript
/**
 * DELETE /api/resource/:id
 * Delete resource (soft or hard)
 * Scope: resource:delete
 */
router.delete(
  "/resource/:id",
  limiters.general,
  authenticate,
  requireOrganization,
  requireScope("resource:delete"),
  auditLog,
  [validateUUID("id"), handleValidationErrors],
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Rec 6: Verify ownership before deletion
      const existing = await prisma.resource.findUnique({
        where: { id },
        select: { id: true, orgId: true },
      });

      if (!existing || existing.orgId !== req.auth.organizationId) {
        return res.status(404).json({
          error: "Resource not found",
        });
      }

      // Soft delete pattern (recommended)
      await prisma.resource.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Or hard delete:
      // await prisma.resource.delete({ where: { id } });

      invalidateCache(`resource:${id}`);
      invalidateCache("resource:list");

      res.json({
        success: true,
        message: "Resource deleted",
      });
    } catch (err) {
      next(err);
    }
  },
);
```

### Pattern 6: Advanced (With Relations)

```javascript
/**
 * GET /api/resource/:id/details
 * Get resource with all related data
 * Demonstrates: Rec 7 (include for relations)
 */
router.get(
  "/resource/:id/details",
  limiters.general,
  authenticate,
  requireOrganization,
  requireScope("resource:read"),
  cacheMiddleware(120),
  auditLog,
  [validateUUID("id"), handleValidationErrors],
  async (req, res, next) => {
    try {
      // Rec 7: Include related data in single query
      const resource = await prisma.resource.findUnique({
        where: { id: req.params.id },
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
          items: {
            select: { id: true, name: true, status: true },
            take: 10, // Limit related items
          },
          metadata: true,
        },
      });

      if (!resource) {
        return res.status(404).json({ error: "Not found" });
      }

      res.json({ success: true, data: resource });
    } catch (err) {
      next(err);
    }
  },
);
```

---

## 🧪 Complete Testing Pattern

```javascript
// tests/routes/resource.test.js

describe("Resource Routes - All Recommendations", () => {
  describe("POST /api/resource", () => {
    // Rec 6: Validation tests
    describe("Validation", () => {
      it("should require name field", async () => {
        const { status, body } = await request(app)
          .post("/api/resource")
          .set("Authorization", `Bearer ${token}`)
          .send({});

        expect(status).toBe(400);
        expect(body.error).toBe("Validation failed");
        expect(body.details).toContainEqual({
          field: "name",
          msg: expect.any(String),
        });
      });

      it("should validate name length", async () => {
        const { status, body } = await request(app)
          .post("/api/resource")
          .set("Authorization", `Bearer ${token}`)
          .send({ name: "a".repeat(101) });

        expect(status).toBe(400);
        expect(body.error).toBe("Validation failed");
      });
    });

    // Rec 4: Authentication tests
    describe("Authentication & Authorization", () => {
      it("should require bearer token", async () => {
        const { status, body } = await request(app)
          .post("/api/resource")
          .send({ name: "test" });

        expect(status).toBe(401);
        expect(body.error).toBe("Missing bearer token");
      });

      it("should reject invalid scope", async () => {
        const invalidToken = createToken({
          scopes: ["other:scope"],
        });

        const { status, body } = await request(app)
          .post("/api/resource")
          .set("Authorization", `Bearer ${invalidToken}`)
          .send({ name: "test" });

        expect(status).toBe(403);
        expect(body.error).toBe("Insufficient scope");
      });
    });

    // Rec 5: Rate limiting tests
    describe("Rate Limiting", () => {
      it("should enforce rate limit after 100 requests", async () => {
        for (let i = 0; i < 101; i++) {
          await request(app)
            .post("/api/resource")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: `resource${i}` });
        }

        const { status } = await request(app)
          .post("/api/resource")
          .set("Authorization", `Bearer ${token}`)
          .send({ name: "should-fail" });

        expect(status).toBe(429);
      });
    });

    // Rec 11: Error handling tests
    describe("Error Handling", () => {
      it("should return 500 on database error", async () => {
        jest
          .spyOn(prisma.resource, "create")
          .mockRejectedValueOnce(new Error("DB Error"));

        const { status, body } = await request(app)
          .post("/api/resource")
          .set("Authorization", `Bearer ${token}`)
          .send({ name: "test" });

        expect(status).toBe(500);
        expect(body.error).toBe("Internal Server Error");
        expect(body.errorId).toBeDefined();
      });
    });

    // Rec 7: Query optimization tests
    describe("Query Optimization", () => {
      it("should not fetch unnecessary fields", async () => {
        const spy = jest.spyOn(prisma.resource, "create");

        await request(app)
          .post("/api/resource")
          .set("Authorization", `Bearer ${token}`)
          .send({ name: "test" });

        expect(spy).toHaveBeenCalledWith(
          expect.objectContaining({
            select: expect.any(Object),
          }),
        );
      });
    });

    // Happy path test
    describe("Success Cases", () => {
      it("should create resource successfully", async () => {
        const { status, body } = await request(app)
          .post("/api/resource")
          .set("Authorization", `Bearer ${token}`)
          .send({
            name: "New Resource",
            email: "test@example.com",
          });

        expect(status).toBe(201);
        expect(body.success).toBe(true);
        expect(body.data).toHaveProperty("id");
        expect(body.data.name).toBe("New Resource");
        expect(body).toHaveProperty("timestamp");
      });
    });
  });
});
```

---

## 🔍 Pre-Submission Verification Checklist

```bash
# 1. SECURITY (Rec 4, 5, 6, 13)
✅ limiters present
✅ authenticate present
✅ requireScope present
✅ auditLog present
✅ handleValidationErrors present
✅ Error responses have errorId

# 2. PERFORMANCE (Rec 3, 7, 9)
✅ Queries use select/include
✅ No N+1 queries
✅ Cache applied to GETs
✅ Pagination on list endpoints
✅ Large payloads minimized

# 3. CODE QUALITY (Rec 1, 2, 3)
✅ Types from shared
✅ Constants from shared
✅ JSDoc comments
✅ Type hints in code
✅ Error delegation with next(err)

# 4. TESTING (Rec 2)
✅ > 75% coverage
✅ Auth tests present
✅ Validation tests present
✅ Error tests present
✅ Happy path tests present

# 5. MONITORING (Rec 11, 12, 13)
✅ Errors logged
✅ Audit logs present
✅ Health check compatible
✅ Response times tracked
✅ Sentry integration via errorHandler
```

---

## 🚀 Deployment Steps

```bash
# 1. Pre-flight checks
pnpm check:types
pnpm lint
pnpm test -- --coverage

# 2. Verify coverage
# Check api/coverage/index.html for > 75%

# 3. Test locally
curl -X POST http://localhost:4000/api/resource \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"test"}'

# 4. Verify health
curl http://localhost:4000/api/health

# 5. Check logs
tail -f api/logs/combined.log

# 6. Deploy with confidence ✅
```

---

## 📊 Perfect Route Scorecard

### Scoring Matrix

```
Route: ____________________

Security:
  [ ] Limiters        __ /5
  [ ] Auth            __ /5
  [ ] Validation      __ /5
  [ ] Scope check     __ /5
  Subtotal:           __ /20

Performance:
  [ ] Queries         __ /5
  [ ] Caching         __ /5
  [ ] Pagination      __ /5
  Subtotal:           __ /15

Quality:
  [ ] Types           __ /5
  [ ] Tests           __ /5
  [ ] Docs            __ /5
  [ ] Shared usage    __ /5
  Subtotal:           __ /20

Monitoring:
  [ ] Error handling  __ /5
  [ ] Audit logs      __ /5
  [ ] Health compat   __ /5
  Subtotal:           __ /15

Documentation:
  [ ] JSDoc           __ /5
  [ ] README          __ /5
  Subtotal:           __ /10

Total Score:          __ /100

Grade:
  90-100: A (Perfect)
  80-89:  B (Good)
  70-79:  C (Acceptable)
  <70:    D (Needs Work)
```

---

## ✨ Conclusion

By following this master system:

✅ All 13 recommendations are **automatically satisfied**  
✅ Routes are **secure** (Auth, Rate Limiting, Validation)  
✅ Routes are **performant** (Query Optimization, Caching)  
✅ Routes are **reliable** (Error Handling, Testing)  
✅ Routes are **maintainable** (Types, Documentation)  
✅ Routes are **observable** (Logging, Monitoring)

**100% PERFECT ROUTES SYSTEM** 🚀

---

**Created:** January 22, 2026  
**Version:** 1.0 - Master Route Building System  
**Status:** Production Ready
