# User Management API Documentation

This document describes the User Management API endpoints for creating and managing users with Solana public addresses, usernames, and profile pictures.

## Base URL

- **Production**: `https://panicafe.bondum.xyz/api`
- **Development**: `http://localhost:3000/api`

## Authentication

Currently, these endpoints do not require authentication. However, it is recommended to implement authentication in production environments.

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users` | Create a new user |
| GET | `/users/:id` | Get user by Solana public address |
| PUT | `/users/:id/username` | Update user's username |
| PUT | `/users/:id/profile-picture` | Upload/update user's profile picture |

---

## 1. Create User

Creates a new user with a Solana public address as the unique identifier and a username.

### Endpoint

```
POST /api/users
```

### Request Body

```json
{
  "id": "string (Solana public address)",
  "username": "string"
}
```

### Parameters

- `id` (required): A valid Solana public address (base58-encoded). This will be the user's unique identifier.
- `username` (required): A unique display name for the user. Must be non-empty after trimming.

### Response

**Success (200 OK)**

```json
{
  "id": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "username": "johndoe",
  "profilePictureUrl": "",
  "createdAt": 1704067200000,
  "updatedAt": null
}
```

### Error Responses

**400 Bad Request** - Invalid Solana address or missing fields
```json
{
  "error": "BadRequestError",
  "message": "Invalid Solana public address"
}
```

**409 Conflict** - User ID or username already exists
```json
{
  "error": "ConflictError",
  "message": "User with this address already exists"
}
```

or

```json
{
  "error": "ConflictError",
  "message": "Username already taken"
}
```

### Example Request

**cURL**
```bash
curl -X POST https://panicafe.bondum.xyz/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "id": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "username": "johndoe"
  }'
```

**JavaScript (Fetch)**
```javascript
const response = await fetch('https://panicafe.bondum.xyz/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    id: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    username: 'johndoe'
  })
});

const user = await response.json();
```

**React Native (Axios)**
```javascript
import axios from 'axios';

const createUser = async (solanaAddress, username) => {
  try {
    const response = await axios.post('https://panicafe.bondum.xyz/api/users', {
      id: solanaAddress,
      username: username
    });
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error.response?.data);
    throw error;
  }
};
```

---

## 2. Get User

Retrieves a user by their Solana public address.

### Endpoint

```
GET /api/users/:id
```

### URL Parameters

- `id` (required): The Solana public address of the user to retrieve.

### Response

**Success (200 OK)**

```json
{
  "id": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "username": "johndoe",
  "profilePictureUrl": "https://bucket.s3.region.amazonaws.com/profile-pictures/...",
  "createdAt": 1704067200000,
  "updatedAt": 1704067300000
}
```

### Error Responses

**400 Bad Request** - Missing ID parameter
```json
{
  "error": "BadRequestError",
  "message": "id is required"
}
```

**404 Not Found** - User does not exist
```json
{
  "error": "NotFoundError",
  "message": "User not found"
}
```

### Example Request

**cURL**
```bash
curl https://panicafe.bondum.xyz/api/users/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

**JavaScript (Fetch)**
```javascript
const userId = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
const response = await fetch(`https://panicafe.bondum.xyz/api/users/${userId}`);
const user = await response.json();
```

**React Native (Axios)**
```javascript
import axios from 'axios';

const getUser = async (solanaAddress) => {
  try {
    const response = await axios.get(
      `https://panicafe.bondum.xyz/api/users/${solanaAddress}`
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('User not found');
    }
    throw error;
  }
};
```

---

## 3. Update Username

Updates the username for an existing user.

### Endpoint

```
PUT /api/users/:id/username
```

### URL Parameters

- `id` (required): The Solana public address of the user to update.

### Request Body

```json
{
  "username": "string"
}
```

### Parameters

- `username` (required): The new username. Must be unique and non-empty after trimming.

### Response

**Success (200 OK)**

```json
{
  "id": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "username": "newusername",
  "profilePictureUrl": "https://bucket.s3.region.amazonaws.com/profile-pictures/...",
  "createdAt": 1704067200000,
  "updatedAt": 1704067400000
}
```

### Error Responses

**400 Bad Request** - Missing username or invalid request
```json
{
  "error": "BadRequestError",
  "message": "Username is required"
}
```

**404 Not Found** - User does not exist
```json
{
  "error": "NotFoundError",
  "message": "User not found"
}
```

**409 Conflict** - Username already taken
```json
{
  "error": "ConflictError",
  "message": "Username already taken"
}
```

### Example Request

**cURL**
```bash
curl -X PUT https://panicafe.bondum.xyz/api/users/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU/username \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newusername"
  }'
```

**JavaScript (Fetch)**
```javascript
const userId = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
const response = await fetch(`https://panicafe.bondum.xyz/api/users/${userId}/username`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'newusername'
  })
});

const updatedUser = await response.json();
```

**React Native (Axios)**
```javascript
import axios from 'axios';

const updateUsername = async (solanaAddress, newUsername) => {
  try {
    const response = await axios.put(
      `https://panicafe.bondum.xyz/api/users/${solanaAddress}/username`,
      { username: newUsername }
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('Username already taken');
    }
    throw error;
  }
};
```

---

## 4. Upload Profile Picture

Uploads a profile picture for a user and updates their profile picture URL. The image is stored in AWS S3.

### Endpoint

```
PUT /api/users/:id/profile-picture
```

### URL Parameters

- `id` (required): The Solana public address of the user.

### Request

This endpoint expects a **multipart/form-data** request with a file field named `file`.

### File Requirements

- **Field name**: `file`
- **Accepted formats**: JPEG, JPG, PNG, GIF, WebP
- **Maximum file size**: 5MB
- **Content-Type**: `multipart/form-data`

### Response

**Success (200 OK)**

```json
{
  "id": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "username": "johndoe",
  "profilePictureUrl": "https://bucket.s3.region.amazonaws.com/profile-pictures/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU/uuid.jpg",
  "createdAt": 1704067200000,
  "updatedAt": 1704067500000
}
```

### Error Responses

**400 Bad Request** - Missing file or invalid file type
```json
{
  "error": "BadRequestError",
  "message": "file is required"
}
```

or

```json
{
  "error": "BadRequestError",
  "message": "Invalid file type. Only images are allowed."
}
```

**404 Not Found** - User does not exist
```json
{
  "error": "NotFoundError",
  "message": "User not found"
}
```

**500 Internal Server Error** - S3 upload failed
```json
{
  "error": "InternalError",
  "message": "Failed to upload profile picture to S3: [error details]"
}
```

### Example Request

**cURL**
```bash
curl -X PUT https://panicafe.bondum.xyz/api/users/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU/profile-picture \
  -F "file=@/path/to/image.jpg"
```

**JavaScript (Fetch)**
```javascript
const userId = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

const formData = new FormData();
formData.append('file', file);

const response = await fetch(`https://panicafe.bondum.xyz/api/users/${userId}/profile-picture`, {
  method: 'PUT',
  body: formData
});

const updatedUser = await response.json();
```

**React Native (Expo)**
```javascript
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const uploadProfilePicture = async (solanaAddress) => {
  try {
    // Request permission and pick image
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission denied');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      // Create FormData
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: filename,
        type,
      } as any);

      // Upload
      const response = await axios.put(
        `https://panicafe.bondum.xyz/api/users/${solanaAddress}/profile-picture`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    }
  } catch (error) {
    console.error('Error uploading profile picture:', error.response?.data);
    throw error;
  }
};
```

**React Native (React Native CLI)**
```javascript
import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';

const uploadProfilePicture = async (solanaAddress) => {
  return new Promise((resolve, reject) => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
      },
      async (response) => {
        if (response.didCancel || response.errorCode) {
          reject(new Error('Image selection cancelled or failed'));
          return;
        }

        const asset = response.assets[0];
        if (!asset) {
          reject(new Error('No image selected'));
          return;
        }

        try {
          const formData = new FormData();
          formData.append('file', {
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            name: asset.fileName || 'image.jpg',
          });

          const apiResponse = await axios.put(
            `https://panicafe.bondum.xyz/api/users/${solanaAddress}/profile-picture`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );

          resolve(apiResponse.data);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};
```

---

## Data Models

### User Object

```typescript
interface User {
  id: string;                    // Solana public address (base58-encoded)
  username: string;              // Unique display name
  profilePictureUrl: string;     // S3 URL or empty string
  createdAt: number;            // Unix timestamp in milliseconds
  updatedAt: number | null;     // Unix timestamp in milliseconds, or null
}
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "error": "ErrorClassName",
  "message": "Human-readable error message",
  "details": { }  // Optional, may contain additional error details
}
```

### Common HTTP Status Codes

- `200 OK` - Request successful
- `400 Bad Request` - Invalid request parameters or missing required fields
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate username)
- `500 Internal Server Error` - Server error

---

## CORS Configuration

The API is configured to accept requests from any origin with the following settings:

- **Origin**: `*` (reflects request origin)
- **Methods**: `GET`, `POST`, `PUT`, `DELETE`
- **Headers**: `Content-Type`, `Authorization`
- **Credentials**: Enabled

This allows mobile apps and web applications to make requests without CORS issues.

---

## Rate Limiting

Currently, there is no rate limiting implemented. Consider implementing rate limiting in production to prevent abuse.

---

## Best Practices

1. **Validate Solana Addresses**: Always validate Solana public addresses on the client side before making requests.

2. **Handle Errors Gracefully**: Implement proper error handling for all API calls, especially for network errors and validation failures.

3. **Image Optimization**: Compress images before uploading to reduce upload time and storage costs.

4. **Username Validation**: Implement client-side validation for usernames (e.g., length limits, allowed characters) before submitting.

5. **Caching**: Consider caching user data on the client side to reduce API calls.

---

## Testing

### Using Postman

1. **Create User**:
   - Method: `POST`
   - URL: `https://panicafe.bondum.xyz/api/users`
   - Body (raw JSON):
     ```json
     {
       "id": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
       "username": "testuser"
     }
     ```

2. **Get User**:
   - Method: `GET`
   - URL: `https://panicafe.bondum.xyz/api/users/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU`

3. **Update Username**:
   - Method: `PUT`
   - URL: `https://panicafe.bondum.xyz/api/users/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU/username`
   - Body (raw JSON):
     ```json
     {
       "username": "newusername"
     }
     ```

4. **Upload Profile Picture**:
   - Method: `PUT`
   - URL: `https://panicafe.bondum.xyz/api/users/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU/profile-picture`
   - Body (form-data):
     - Key: `file`
     - Type: `File`
     - Value: Select an image file

---

## Production Setup Requirements

### S3 Configuration

1. **Create S3 Bucket**: Create an S3 bucket for storing profile pictures.

2. **Bucket Policy**: Ensure the bucket allows public read access for uploaded objects, or configure CloudFront/CDN for serving images.

3. **CORS Configuration**: Configure S3 bucket CORS if accessing images directly from web applications.

4. **Environment Variables**: Set the following environment variables:
   - `S3_BUCKET`: Your S3 bucket name
   - `S3_REGION`: AWS region (e.g., `us-east-1`)

5. **AWS Credentials**: Add to `secrets/secrets.json`:
   ```json
   {
     "awsAccessKeyId": "your-access-key-id",
     "awsSecretAccessKey": "your-secret-access-key"
   }
   ```

### Security Considerations

1. **Authentication**: Consider implementing authentication/authorization for these endpoints in production.

2. **Rate Limiting**: Implement rate limiting to prevent abuse.

3. **File Validation**: The server validates file types, but consider additional validation (e.g., file content scanning).

4. **Input Sanitization**: Usernames are trimmed but not sanitized. Consider implementing additional validation rules.

---

## Support

For issues or questions, please contact the development team or refer to the main project documentation.

