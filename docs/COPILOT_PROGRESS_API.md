# AI Copilot Progress Tracking API

This document describes the API endpoints for tracking AI Driver Coach copilot progress.

## Overview

The AI Copilot Progress Tracking system monitors and records how drivers are improving based on AI coaching recommendations. It tracks metrics such as:

- Overall progress scores
- Goals completed vs assigned
- Improvement rates over time
- Consistency of improvements
- Engagement with coaching suggestions
- Effectiveness of coaching interventions

## Authentication & Scopes

All endpoints require JWT authentication with specific scopes:

- `copilot:read` - Read progress data for drivers
- `copilot:write` - Create and update progress records
- `copilot:admin` - Access aggregated statistics

## Endpoints

### 1. Get Driver Progress

**Endpoint:** `GET /api/copilot/progress/:driverId`

**Scope:** `copilot:read`

**Description:** Retrieves the latest AI copilot progress record for a specific driver.

**Parameters:**
- `driverId` (path parameter) - The unique identifier of the driver

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "progress-123",
    "driverId": "driver-456",
    "overallProgressScore": 85.5,
    "goalsCompleted": 5,
    "goalsTotal": 10,
    "improvementRate": 15.2,
    "consistencyScore": 90.0,
    "activeRecommendations": 3,
    "completedRecommendations": 7,
    "progressDetails": {
      "safety": { "score": 92, "trend": "improving" },
      "efficiency": { "score": 78, "trend": "stable" }
    },
    "milestones": [
      {
        "milestone": "First safety goal achieved",
        "achievedAt": "2024-01-15T10:00:00Z",
        "description": "Reduced hard braking by 50%"
      }
    ],
    "engagementScore": 88.0,
    "lastInteraction": "2024-01-20T14:30:00Z",
    "confidenceLevel": 92.0,
    "effectivenessScore": 87.5,
    "coachingNotes": "Great progress this week",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-20T14:30:00Z",
    "driver": {
      "id": "driver-456",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "DRIVER"
    }
  }
}
```

**Error Responses:**
- `404 Not Found` - No progress tracking found for this driver
- `401 Unauthorized` - Invalid or missing authentication
- `403 Forbidden` - Insufficient scope permissions

---

### 2. Get Driver Progress History

**Endpoint:** `GET /api/copilot/progress/:driverId/history`

**Scope:** `copilot:read`

**Description:** Retrieves historical AI copilot progress records for a specific driver.

**Parameters:**
- `driverId` (path parameter) - The unique identifier of the driver
- `limit` (query parameter, optional) - Number of records to return (default: 10, max: 100)
- `offset` (query parameter, optional) - Number of records to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "progress-123",
      "driverId": "driver-456",
      "overallProgressScore": 85.5,
      "goalsCompleted": 5,
      "goalsTotal": 10,
      "createdAt": "2024-01-20T00:00:00Z",
      ...
    },
    {
      "id": "progress-122",
      "driverId": "driver-456",
      "overallProgressScore": 80.0,
      "goalsCompleted": 4,
      "goalsTotal": 10,
      "createdAt": "2024-01-15T00:00:00Z",
      ...
    }
  ],
  "count": 2
}
```

---

### 3. Create Progress Record

**Endpoint:** `POST /api/copilot/progress`

**Scope:** `copilot:write`

**Description:** Creates a new AI copilot progress record for a driver.

**Request Body:**
```json
{
  "driverId": "driver-456",
  "overallProgressScore": 85.5,
  "goalsCompleted": 5,
  "goalsTotal": 10,
  "improvementRate": 15.2,
  "consistencyScore": 90.0,
  "activeRecommendations": 3,
  "completedRecommendations": 7,
  "progressDetails": {
    "safety": { "score": 92, "trend": "improving" }
  },
  "milestones": [
    {
      "milestone": "First goal completed",
      "achievedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "engagementScore": 88.0,
  "lastInteraction": "2024-01-20T14:30:00Z",
  "confidenceLevel": 92.0,
  "effectivenessScore": 87.5,
  "coachingNotes": "Great progress",
  "performancePeriodId": "period-789"
}
```

**Required Fields:**
- `driverId` - Must be a valid user ID with DRIVER role

**Optional Fields:**
All other fields are optional and will use default values if not provided:
- Numeric scores default to 0
- `confidenceLevel` defaults to 85
- JSON fields default to null

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "progress-124",
    "driverId": "driver-456",
    "overallProgressScore": 85.5,
    ...
  }
}
```

**Error Responses:**
- `404 Not Found` - Driver not found
- `400 Bad Request` - Validation error (e.g., missing driverId)
- `401 Unauthorized` - Invalid or missing authentication
- `403 Forbidden` - Insufficient scope permissions

---

### 4. Update Progress Record

**Endpoint:** `PATCH /api/copilot/progress/:progressId`

**Scope:** `copilot:write`

**Description:** Updates an existing AI copilot progress record.

**Parameters:**
- `progressId` (path parameter) - The unique identifier of the progress record

**Request Body:**
Any fields from the create endpoint can be updated except:
- `id`
- `driverId`
- `createdAt`

**Example:**
```json
{
  "overallProgressScore": 90.0,
  "goalsCompleted": 6,
  "coachingNotes": "Excellent improvement this week"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "progress-124",
    "overallProgressScore": 90.0,
    ...
  }
}
```

**Error Responses:**
- `404 Not Found` - Progress record not found
- `401 Unauthorized` - Invalid or missing authentication
- `403 Forbidden` - Insufficient scope permissions

---

### 5. Get Copilot Statistics

**Endpoint:** `GET /api/copilot/stats`

**Scope:** `copilot:admin`

**Description:** Retrieves aggregated AI copilot statistics across all drivers.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalDriversTracked": 150,
    "averageProgressScore": 82.3,
    "averageImprovementRate": 12.5,
    "averageConsistencyScore": 85.7,
    "averageEngagementScore": 88.2,
    "averageEffectivenessScore": 84.6,
    "totalGoalsCompleted": 450,
    "totalGoalsActive": 800,
    "totalActiveRecommendations": 320,
    "totalCompletedRecommendations": 1250
  }
}
```

---

## Rate Limits

All endpoints use the `general` rate limiter:
- **100 requests per 15 minutes** per authenticated user

## Audit Logging

All requests to these endpoints are logged for audit purposes, recording:
- User ID making the request
- Timestamp
- Action performed
- Resources accessed

## Data Types

### Progress Details
A flexible JSON object containing detailed progress information broken down by category. Structure is not enforced but commonly includes:

```json
{
  "safety": {
    "score": 92,
    "trend": "improving",
    "details": "Reduced hard braking by 50%"
  },
  "efficiency": {
    "score": 78,
    "trend": "stable",
    "details": "Maintaining steady fuel consumption"
  },
  "compliance": {
    "score": 95,
    "trend": "stable",
    "details": "No violations this period"
  }
}
```

### Milestones
An array of milestone objects:

```json
[
  {
    "milestone": "First safety goal achieved",
    "achievedAt": "2024-01-15T10:00:00Z",
    "description": "Reduced hard braking by 50%"
  }
]
```

## Integration Example

### TypeScript Client

```typescript
import { CopilotProgress, ApiResponse } from '@infamous-freight/shared';

async function getDriverProgress(driverId: string): Promise<CopilotProgress> {
  const response = await fetch(`/api/copilot/progress/${driverId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const result: ApiResponse<CopilotProgress> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  return result.data!;
}

async function updateProgress(progressId: string, updates: Partial<CopilotProgress>) {
  const response = await fetch(`/api/copilot/progress/${progressId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  
  return await response.json();
}
```

## Best Practices

1. **Regular Updates**: Update progress records at regular intervals (e.g., daily or weekly) to maintain accurate tracking.

2. **Confidence Levels**: Always include confidence levels when creating progress records to indicate AI certainty.

3. **Milestone Tracking**: Record significant achievements as milestones to provide clear progress indicators.

4. **Engagement Monitoring**: Track `lastInteraction` to identify drivers who may need additional engagement.

5. **Trend Analysis**: Use the history endpoint to analyze trends over time and identify patterns.

## Security Considerations

- All endpoints require authentication with valid JWT tokens
- Scope-based access control ensures proper authorization
- Driver-specific data is isolated and requires appropriate permissions
- Audit logging tracks all access to progress data
- Rate limiting prevents abuse
- Sensitive driver information is never exposed through these endpoints

## Related Documentation

- [AI Boundaries and Governance](./ai-boundaries.md)
- [API Routes Overview](./API_ROUTES.md)
- [Authentication Guide](./ADVANCED_AUTHENTICATION_GUIDE.md)
