# API Documentation

## Content Endpoints

### Get Content by Type
```
GET /api/content/:type?page=1&limit=20
```

**Parameters:**
- `type` (required): Content type (joke, fact, idea, quote)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "content": [
    {
      "_id": "string",
      "text": "string",
      "type": "string",
      "author": "string",
      "createdAt": "string",
      "isApproved": "boolean",
      "aiGenerated": "boolean"
    }
  ],
  "page": 1,
  "hasMore": true
}
```

### Submit Content
```
POST /api/content
```

**Body:**
```json
{
  "text": "string",
  "type": "string",
  "author": "string"
}
```

**Response:**
```json
{
  "_id": "string",
  "text": "string",
  "type": "string",
  "author": "string",
  "createdAt": "string",
  "isApproved": true,
  "aiGenerated": false
}
```

### Get Random Content
```
GET /api/content/:type/random?count=1
```

**Parameters:**
- `type` (required): Content type (joke, fact, idea, quote)
- `count` (optional): Number of random items (default: 1)

**Response:**
```json
[
  {
    "_id": "string",
    "text": "string",
    "type": "string",
    "author": "string",
    "createdAt": "string",
    "isApproved": "boolean",
    "aiGenerated": "boolean"
  }
]
```

### Generate AI Content
```
POST /api/generate/:type
```

**Body:**
```json
{
  "count": 5
}
```

**Response:**
```json
{
  "content": [
    {
      "_id": "string",
      "text": "string",
      "type": "string",
      "author": "string",
      "createdAt": "string",
      "isApproved": true,
      "aiGenerated": true
    }
  ],
  "generated": 5
}
```

### Health Check
```
GET /api/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2023-10-15T12:00:00.000Z"
}
```
