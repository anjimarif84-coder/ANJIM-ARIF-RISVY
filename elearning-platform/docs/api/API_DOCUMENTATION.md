# API Documentation

This document provides comprehensive documentation for the ELearning Platform REST API.

## 📋 Base Information

- **Base URL**: `https://api.yourdomain.com` (production) or `http://localhost:3001/api` (development)
- **Authentication**: JWT Bearer tokens
- **Content Type**: `application/json`
- **API Version**: v1

## 🔐 Authentication

### Overview
The API uses JWT (JSON Web Tokens) for authentication with both access and refresh tokens:
- **Access Token**: Short-lived (15 minutes), used for API requests
- **Refresh Token**: Long-lived (7 days), used to obtain new access tokens

### Token Usage
Include the access token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## 📚 Endpoints

### Authentication Endpoints

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "STUDENT" // Optional: STUDENT (default), TEACHER
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "STUDENT",
      "isEmailVerified": false,
      "createdAt": "2023-01-01T00:00:00.000Z"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  },
  "message": "User registered successfully"
}
```

#### POST /auth/login
Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "STUDENT"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  },
  "message": "Login successful"
}
```

#### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_access_token",
    "refreshToken": "new_jwt_refresh_token"
  }
}
```

#### POST /auth/logout
Logout user and invalidate refresh token.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET /auth/profile
Get current user profile.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STUDENT",
    "isEmailVerified": true,
    "profileImageUrl": "https://example.com/image.jpg",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

#### PUT /auth/profile
Update user profile.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "profileImageUrl": "https://example.com/new-image.jpg"
}
```

#### PUT /auth/change-password
Change user password.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

### Course Endpoints

#### GET /courses
Get list of published courses with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `search` (string): Search in title and description
- `category` (string): Filter by category ID
- `sortBy` (string): Sort field (default: createdAt)
- `sortOrder` (string): asc or desc (default: desc)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "course_id",
      "title": "React Fundamentals",
      "description": "Learn React from scratch",
      "shortDescription": "React basics",
      "thumbnailUrl": "https://example.com/thumbnail.jpg",
      "price": 99.99,
      "isPublished": true,
      "teacher": {
        "id": "teacher_id",
        "firstName": "Jane",
        "lastName": "Teacher",
        "profileImageUrl": "https://example.com/teacher.jpg"
      },
      "category": {
        "id": "category_id",
        "name": "Web Development"
      },
      "_count": {
        "enrollments": 150,
        "lessons": 12
      },
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### GET /courses/:id
Get detailed course information.

**Headers:** `Authorization: Bearer <access_token>` (optional)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "course_id",
    "title": "React Fundamentals",
    "description": "Complete React course description...",
    "shortDescription": "React basics",
    "thumbnailUrl": "https://example.com/thumbnail.jpg",
    "price": 99.99,
    "isPublished": true,
    "teacher": {
      "id": "teacher_id",
      "firstName": "Jane",
      "lastName": "Teacher",
      "profileImageUrl": "https://example.com/teacher.jpg"
    },
    "category": {
      "id": "category_id",
      "name": "Web Development"
    },
    "lessons": [
      {
        "id": "lesson_id",
        "title": "Introduction to React",
        "description": "Learn the basics",
        "duration": 1800,
        "order": 1,
        "progress": [
          {
            "isCompleted": false,
            "watchedTime": 300
          }
        ]
      }
    ],
    "quizzes": [
      {
        "id": "quiz_id",
        "title": "React Basics Quiz",
        "description": "Test your React knowledge",
        "passingScore": 70,
        "timeLimit": 30,
        "responses": [
          {
            "id": "response_id",
            "score": 85,
            "isCompleted": true,
            "completedAt": "2023-01-01T00:00:00.000Z"
          }
        ]
      }
    ],
    "_count": {
      "enrollments": 150
    },
    "isEnrolled": true
  }
}
```

#### POST /courses
Create a new course (Teacher/Admin only).

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "title": "Advanced React Patterns",
  "description": "Learn advanced React patterns and techniques",
  "shortDescription": "Advanced React",
  "price": 149.99,
  "categoryId": "category_id"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "new_course_id",
    "title": "Advanced React Patterns",
    "description": "Learn advanced React patterns and techniques",
    "price": 149.99,
    "isPublished": false,
    "teacherId": "teacher_id",
    "createdAt": "2023-01-01T00:00:00.000Z"
  },
  "message": "Course created successfully"
}
```

#### PUT /courses/:id
Update course information (Owner/Admin only).

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "title": "Updated Course Title",
  "description": "Updated description",
  "price": 199.99
}
```

#### DELETE /courses/:id
Delete a course (Owner/Admin only).

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Course deleted successfully"
}
```

#### GET /courses/my/courses
Get teacher's own courses (Teacher/Admin only).

**Headers:** `Authorization: Bearer <access_token>`

**Query Parameters:** Same as GET /courses

#### PATCH /courses/:id/publish
Publish a course (Owner/Admin only).

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "course_id",
    "isPublished": true
  },
  "message": "Course published successfully"
}
```

### Enrollment Endpoints

#### GET /enrollments/my
Get user's enrollments.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "enrollment_id",
      "status": "ACTIVE",
      "enrolledAt": "2023-01-01T00:00:00.000Z",
      "completedAt": null,
      "course": {
        "id": "course_id",
        "title": "React Fundamentals",
        "thumbnailUrl": "https://example.com/thumbnail.jpg",
        "teacher": {
          "firstName": "Jane",
          "lastName": "Teacher"
        }
      }
    }
  ]
}
```

#### POST /enrollments/:courseId
Enroll in a course.

**Headers:** `Authorization: Bearer <access_token>`

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "enrollment_id",
    "userId": "user_id",
    "courseId": "course_id",
    "status": "ACTIVE",
    "enrolledAt": "2023-01-01T00:00:00.000Z"
  },
  "message": "Successfully enrolled in course"
}
```

### Payment Endpoints

#### POST /payments/create-checkout-session
Create Stripe checkout session for course purchase.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "courseId": "course_id"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_stripe_session_id",
    "url": "https://checkout.stripe.com/pay/cs_..."
  }
}
```

#### POST /payments/webhook
Stripe webhook handler (called by Stripe).

**Headers:** `stripe-signature: webhook_signature`

#### GET /payments/my
Get user's payment history.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "payment_id",
      "amount": 99.99,
      "currency": "usd",
      "status": "COMPLETED",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "course": {
        "id": "course_id",
        "title": "React Fundamentals"
      }
    }
  ]
}
```

### Upload Endpoints

#### POST /upload/video-upload-url
Get signed URL for video upload (Teacher/Admin only).

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "courseId": "course_id",
  "lessonId": "lesson_id",
  "filename": "video.mp4",
  "contentType": "video/mp4"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "signedUrl": "https://s3.amazonaws.com/bucket/signed-url",
    "key": "courses/course_id/lessons/lesson_id/videos/video.mp4",
    "expiresIn": 3600
  }
}
```

#### POST /upload/thumbnail-upload-url
Get signed URL for course thumbnail upload (Teacher/Admin only).

#### POST /upload/profile-image-upload-url
Get signed URL for profile image upload.

### Quiz Endpoints

#### GET /quizzes/course/:courseId
Get quizzes for a course (enrolled users only).

#### POST /quizzes
Create a new quiz (Teacher/Admin only).

#### GET /quizzes/:id
Get quiz details.

#### POST /quizzes/:id/submit
Submit quiz answers.

#### GET /quizzes/:id/results
Get quiz results.

## 📊 Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE" // Optional
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200  | OK |
| 201  | Created |
| 400  | Bad Request |
| 401  | Unauthorized |
| 403  | Forbidden |
| 404  | Not Found |
| 409  | Conflict |
| 422  | Unprocessable Entity |
| 429  | Too Many Requests |
| 500  | Internal Server Error |

### Common Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE_RESOURCE` | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

## 🔒 Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **General endpoints**: 100 requests per 15 minutes per IP
- **Upload endpoints**: 10 requests per hour per IP

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

## 📝 Request/Response Examples

### Creating a Course with Lessons

1. **Create Course**
```bash
curl -X POST https://api.yourdomain.com/courses \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "JavaScript Masterclass",
    "description": "Complete JavaScript course",
    "price": 129.99
  }'
```

2. **Upload Video**
```bash
# Get signed URL
curl -X POST https://api.yourdomain.com/upload/video-upload-url \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "course_id",
    "lessonId": "lesson_id",
    "filename": "lesson1.mp4",
    "contentType": "video/mp4"
  }'

# Upload to S3 using signed URL
curl -X PUT "<signed_url>" \
  -H "Content-Type: video/mp4" \
  --data-binary @lesson1.mp4
```

### Student Enrollment Flow

1. **Browse Courses**
```bash
curl "https://api.yourdomain.com/courses?search=javascript&limit=5"
```

2. **Get Course Details**
```bash
curl "https://api.yourdomain.com/courses/course_id" \
  -H "Authorization: Bearer <token>"
```

3. **Purchase Course**
```bash
curl -X POST https://api.yourdomain.com/payments/create-checkout-session \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"courseId": "course_id"}'
```

## 🧪 Testing the API

### Using curl

```bash
# Set base URL
API_BASE="https://api.yourdomain.com"

# Register user
curl -X POST $API_BASE/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login and get token
TOKEN=$(curl -X POST $API_BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' | jq -r '.data.accessToken')

# Get courses
curl -H "Authorization: Bearer $TOKEN" $API_BASE/courses
```

### Using Postman

1. Import the API collection from `/docs/api/postman_collection.json`
2. Set environment variables:
   - `base_url`: API base URL
   - `access_token`: JWT access token
3. Run the collection tests

## 📖 OpenAPI Specification

The complete OpenAPI 3.0 specification is available at:
- Development: `http://localhost:3001/api/docs`
- Production: `https://api.yourdomain.com/docs`

You can also find the OpenAPI JSON file at `/docs/api/openapi.json`.

## 🔄 API Versioning

Currently using v1. Future versions will be handled via:
- URL versioning: `/api/v2/...`
- Header versioning: `API-Version: v2`

## 📞 Support

For API support:
- Documentation issues: docs@elearning.com
- API bugs: api-support@elearning.com
- Feature requests: features@elearning.com