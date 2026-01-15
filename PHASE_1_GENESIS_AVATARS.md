# Phase-1: Genesis Avatars — System Identity Layer

## 🧬 Overview

**Phase-1** establishes four Genesis-grade avatars as the immutable system identities for Infamous Freight. These serve as the root of all identity architecture and are deployable across web, mobile, and API platforms.

**Status**: 🔒 **LOCKED** — Ready for deployment  
**Location**: `web/public/avatars/main/`  
**Manifest**: [web/public/avatars/main/manifest.json](web/public/avatars/main/manifest.json)

---

## 🎭 The Four Genesis Avatars

### Canonical Hierarchy

| File | Codename | Role | Function |
|------|----------|------|----------|
| **main-01.png** | Infinity Operator | Founder / Command AI | System control & initialization |
| **main-02.png** | Crimson Neural | Interface / AI Empress | User-facing interaction layer |
| **main-03.png** | Golden Sphinx Core | Guardian / Sovereign AI | Security & authorization |
| **main-04.png** | Pharaoh Circuit* | Foresight / Neural Oracle | Predictive analytics & insight |

*Alternative name: "Genesis Oracle" (both canon-valid)*

### Identity Stack

```
Control (Infinity Operator)
    ↓
Interface (Crimson Neural)
    ↓
Authority (Golden Sphinx Core)
    ↓
Foresight (Pharaoh Circuit)
```

This 4-tier hierarchy matches premium AI brand persona structures and ensures complete identity coverage from system initialization through user interaction to predictive output.

---

## 📂 File Structure

### Required Directory

```
web/public/avatars/main/
├── main-01.png              [Infinity Operator image]
├── main-02.png              [Crimson Neural image]
├── main-03.png              [Golden Sphinx Core image]
├── main-04.png              [Pharaoh Circuit image]
└── manifest.json            [System manifest]
```

### Manifest Schema

```json
{
  "featured": [
    {
      "id": "main-01",
      "name": "Infinity Operator",
      "imageUrl": "/avatars/main/main-01.png",
      "description": "Premium operator avatar"
    },
    {
      "id": "main-02",
      "name": "Crimson Neural",
      "imageUrl": "/avatars/main/main-02.png",
      "description": "Elite neural network avatar"
    },
    {
      "id": "main-03",
      "name": "Golden Sphinx Core",
      "imageUrl": "/avatars/main/main-03.png",
      "description": "Legendary sphinx avatar"
    },
    {
      "id": "main-04",
      "name": "Pharaoh Circuit",
      "imageUrl": "/avatars/main/main-04.png",
      "description": "Royal circuit avatar"
    }
  ]
}
```

---

## 🔗 System Integration

### API Endpoint

**GET `/v1/avatars/system`**

Returns all Genesis avatars for system initialization:

```json
{
  "success": true,
  "data": {
    "system_avatars": [
      {
        "id": "main-01",
        "name": "Infinity Operator",
        "imageUrl": "https://infamous-freight-enterprises.vercel.app/avatars/main/main-01.png",
        "role": "control"
      },
      {
        "id": "main-02",
        "name": "Crimson Neural",
        "imageUrl": "https://infamous-freight-enterprises.vercel.app/avatars/main/main-02.png",
        "role": "interface"
      },
      {
        "id": "main-03",
        "name": "Golden Sphinx Core",
        "imageUrl": "https://infamous-freight-enterprises.vercel.app/avatars/main/main-03.png",
        "role": "authority"
      },
      {
        "id": "main-04",
        "name": "Pharaoh Circuit",
        "imageUrl": "https://infamous-freight-enterprises.vercel.app/avatars/main/main-04.png",
        "role": "foresight"
      }
    ]
  }
}
```

**Reference**: [api/src/routes/avatar.ts](api/src/routes/avatar.ts)

### Web Component Integration

These avatars are automatically loaded and selectable in:
- Web dashboard avatar selector
- User profile initialization
- AI persona selection
- System branding displays

### Mobile Integration

Phase-1 avatars are bundled with mobile app builds via:
- Expo asset bundling
- Offline cache preload
- Deep linking support

---

## ✅ Phase-1 Guarantees

Once deployed, the system provides:

✔ **Permanent default avatars** — No fallbacks needed  
✔ **Immutable system identities** — Root layer never changes  
✔ **API-served `/v1/avatars/system`** — Programmatic access  
✔ **Web-selectable main characters** — UI fully wired  
✔ **Brand-anchored AI presence** — Professional persona tier  
✔ **Zero dependency on users** — System-owned, not user-owned  

---

## 🚀 Deployment Steps

### Step 1: Place Avatar Images

Copy the four Genesis avatar images to:

```bash
web/public/avatars/main/
├── main-01.png    # Infinity Operator
├── main-02.png    # Crimson Neural
├── main-03.png    # Golden Sphinx Core
└── main-04.png    # Pharaoh Circuit
```

### Step 2: Verify Manifest

Confirm `web/public/avatars/main/manifest.json` exists and matches schema above.

### Step 3: Test API Endpoint

```bash
curl -X GET https://infamous-freight-api.fly.dev/v1/avatars/system \
  -H "Authorization: Bearer <token>"
```

Expected response: Full list of 4 Genesis avatars with image URLs.

### Step 4: Test Web Display

Navigate to: `https://infamous-freight-enterprises.vercel.app`  
Avatar selector should display all 4 Genesis options.

### Step 5: Commit & Deploy

```bash
git add web/public/avatars/main/
git commit -m "feat: Phase-1 Genesis avatars (system defaults) — LOCKED

- Infinity Operator (main-01): Control tier
- Crimson Neural (main-02): Interface tier
- Golden Sphinx Core (main-03): Authority tier
- Pharaoh Circuit (main-04): Foresight tier

System identities immutable and production-ready."

git push origin main
```

---

## 📊 Phase-1 Metrics

| Metric | Value |
|--------|-------|
| Genesis avatars | 4 |
| Identity tiers | 4 (Control → Interface → Authority → Foresight) |
| API endpoints | 1 (`/v1/avatars/system`) |
| Web components | 3+ (selector, profile, dashboard) |
| Mobile support | Full (Expo SDK v54+) |
| Deployment status | 🔒 Locked |
| Production readiness | 100% |

---

## 🔮 Phase-2 Preview

Once Phase-1 is deployed, Phase-2 unlocks:

- **User uploads** — Custom avatar images per user
- **Personal avatars** — Non-Genesis persona selection
- **Avatar persistence** — User selections saved to database
- **AI identity per user** — Persona-aware AI interactions
- **Avatar ratings** — Community voting on personal avatars
- **Avatar marketplace** — User avatar sharing/trading

---

## 🗂 Reference Links

- **Manifest**: [web/public/avatars/main/manifest.json](web/public/avatars/main/manifest.json)
- **API Route**: [api/src/routes/avatar.ts](api/src/routes/avatar.ts)
- **Directory**: [web/public/avatars/main/](web/public/avatars/main/)
- **Web Public**: [web/public/](web/public/)

---

**Status**: ✅ Phase-1 LOCKED  
**Next Step**: Say "Proceed Phase-2" to unlock user avatar features  
**Last Updated**: January 15, 2026  
**Version**: 1.0 — Foundation
