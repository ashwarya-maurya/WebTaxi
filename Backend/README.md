# WebTaxi - API Documentation

## Base URL
```
http://localhost:3000
```

---

## User Routes

### Register User
- **POST** `/users/register`

**Request Body:**
```json
{
  "fullname": {
    "firstname": "String | required | min 3 chars",
    "lastname": "String | optional | min 3 chars"
  },
  "email": "String | required | valid email",
  "password": "String | required | min 6 chars"
}
```

**Response:**
```json
{
  "token": "String",
  "user": {
    "_id": "String",
    "fullname": {
      "firstname": "String",
      "lastname": "String"
    },
    "email": "String",
    "socketId": "String | null"
  }
}
```

---

### Login User
- **POST** `/users/login`

**Request Body:**
```json
{
  "email": "String | required | valid email",
  "password": "String | required | min 6 chars"
}
```

**Response:**
```json
{
  "token": "String",
  "user": {
    "_id": "String",
    "fullname": {
      "firstname": "String",
      "lastname": "String"
    },
    "email": "String",
    "socketId": "String | null"
  }
}
```

---

### Get User Profile
- **GET** `/users/profile`
- **Auth Required** — `Authorization: Bearer <token>`

**Response:**
```json
{
  "_id": "String",
  "fullname": {
    "firstname": "String",
    "lastname": "String"
  },
  "email": "String",
  "socketId": "String | null"
}
```

---

### Logout User
- **GET** `/users/logout`
- **Auth Required** — `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Logout successful"
}
```

---

## Captain Routes

### Register Captain
- **POST** `/captains/register`

**Request Body:**
```json
{
  "fullname": {
    "firstname": "String | required | min 3 chars",
    "lastname": "String | optional | min 3 chars"
  },
  "email": "String | required | valid email",
  "password": "String | required | min 6 chars",
  "vehicle": {
    "color": "String | required | min 3 chars",
    "plate": "String | required | min 5 chars",
    "capacity": "Number | required | min 1",
    "vehicleType": "String | required | Car | Bike | Auto"
  }
}
```

**Response:**
```json
{
  "token": "String",
  "captain": {
    "_id": "String",
    "fullname": {
      "firstname": "String",
      "lastname": "String"
    },
    "email": "String",
    "status": "active | inactive",
    "vehicle": {
      "color": "String",
      "plate": "String",
      "capacity": "Number",
      "vehicleType": "Car | Bike | Auto"
    },
    "location": {
      "lat": "Number | null",
      "lng": "Number | null"
    },
    "socketId": "String | null"
  }
}
```

---

### Login Captain
- **POST** `/captains/login`

**Request Body:**
```json
{
  "email": "String | required | valid email",
  "password": "String | required | min 6 chars"
}
```

**Response:**
```json
{
  "token": "String",
  "captain": {
    "_id": "String",
    "fullname": {
      "firstname": "String",
      "lastname": "String"
    },
    "email": "String",
    "status": "active | inactive",
    "vehicle": {
      "color": "String",
      "plate": "String",
      "capacity": "Number",
      "vehicleType": "Car | Bike | Auto"
    },
    "location": {
      "lat": "Number | null",
      "lng": "Number | null"
    },
    "socketId": "String | null"
  }
}
```

---

### Get Captain Profile
- **GET** `/captains/profile`
- **Auth Required** — `Authorization: Bearer <token>`

**Response:**
```json
{
  "_id": "String",
  "fullname": {
    "firstname": "String",
    "lastname": "String"
  },
  "email": "String",
  "status": "active | inactive",
  "vehicle": {
    "color": "String",
    "plate": "String",
    "capacity": "Number",
    "vehicleType": "Car | Bike | Auto"
  },
  "location": {
    "lat": "Number | null",
    "lng": "Number | null"
  },
  "socketId": "String | null"
}
```

---

### Logout Captain
- **GET** `/captains/logout`
- **Auth Required** — `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Logout successful"
}
```