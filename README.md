# 🍽️ FoodieK

<div align="center">

### A Modern Full-Stack Food Discovery & Ordering Platform

Discover restaurants, explore dishes, place orders, and manage everything through dedicated User, Restaurant Partner, and Admin dashboards.

Built using the **MERN Stack** with **Redis**, **BullMQ**, **Socket.IO**, **Stripe**, **Docker**, **AWS**, and **GitHub Actions CI/CD**.

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-22.x-green)
![Express](https://img.shields.io/badge/Express-5.x-black)
![React](https://img.shields.io/badge/React-19-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green)
![Docker](https://img.shields.io/badge/Docker-Containerized-blue)
![Redis](https://img.shields.io/badge/Redis-Caching-red)
![BullMQ](https://img.shields.io/badge/BullMQ-Background%20Jobs-orange)
![AWS](https://img.shields.io/badge/AWS-EC2-yellow)

</div>

---

# 📖 Table of Contents

* Overview
* Features
* Tech Stack
* Architecture
* Folder Structure
* Getting Started
* Environment Variables
* Running with Docker
* Security Features
* Background Jobs
* Real-Time Communication
* API Modules
* Deployment
* Future Enhancements
* Screenshots
* Author

---

# 🚀 Overview

FoodieK is a full-stack food ordering platform inspired by modern food delivery applications.

The project was built to gain hands-on experience with production-ready backend engineering concepts rather than only implementing CRUD operations.

It demonstrates:

* Authentication & Authorization
* Payment Integration
* Background Job Processing
* Real-time Communication
* Redis Caching
* Docker Containerization
* AWS Deployment
* CI/CD Pipeline
* Secure REST APIs

---

# ✨ Features

## 👤 User

* User Registration
* Secure Login
* JWT Authentication
* Refresh Token Support
* Browse Restaurants
* Browse Categories
* Search Food
* Cart Management
* Place Orders
* Stripe Payment
* Order History
* Live Order Updates
* Profile Management

---

## 🍴 Restaurant Partner

* Restaurant Dashboard
* Add Food Items
* Edit Food Items
* Delete Food Items
* Upload Images
* Order Management
* Revenue Overview
* Update Order Status

---

## 🛡️ Admin

* Dashboard
* User Management
* Restaurant Management
* Category Management
* Order Monitoring
* Platform Analytics
* Content Moderation

---

# 🛠 Tech Stack

## Frontend

* React
* Vite
* React Router
* Axios
* Tailwind CSS
* Context API

---

## Backend

* Node.js
* Express.js
* MongoDB
* Mongoose

---

## Authentication

* JWT
* HTTP Only Cookies
* Refresh Tokens
* Protected Routes

---

## Storage

* MongoDB Atlas
* Cloudinary

---

## Payments

* Stripe

---

## Performance

* Redis
* BullMQ

---

## Real-Time

* Socket.IO

---

## DevOps

* Docker
* Docker Compose
* GitHub Actions
* AWS EC2

---

# 🏗 System Architecture

```text
                React Frontend
                      │
                      ▼
               Express REST API
                      │
       ┌──────────────┼──────────────┐
       ▼              ▼              ▼
   MongoDB         Redis         Socket.IO
       │              │
       ▼              ▼
 Cloudinary       BullMQ Workers
                      │
                      ▼
                 Email / Jobs
```

---

# 📁 Project Structure

```text
FoodieK
│
├── backend
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── services
│   ├── workers
│   ├── jobs
│   ├── socket
│   ├── utils
│   └── server.js
│
├── frontend
│   ├── src
│   ├── public
│   ├── components
│   ├── pages
│   ├── hooks
│   ├── context
│   └── assets
│
├── docker-compose.yml
├── README.md
└── docs
```

---

# ⚙️ Getting Started

## Clone Repository

```bash
git clone https://github.com/apoorvy711/FoodieK.git

cd FoodieK
```

---

## Backend

```bash
cd backend

npm install

npm run dev
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# 🔑 Environment Variables

Backend

```env
PORT=

NODE_ENV=

MONGODB_URI=

JWT_SECRET=

JWT_REFRESH_SECRET=

ACCESS_TOKEN_EXPIRY=

REFRESH_TOKEN_EXPIRY=

COOKIE_SECRET=

REDIS_URL=

STRIPE_SECRET_KEY=

STRIPE_WEBHOOK_SECRET=

CLOUDINARY_CLOUD_NAME=

CLOUDINARY_API_KEY=

CLOUDINARY_API_SECRET=
```

Frontend

```env
VITE_API_URL=
VITE_STRIPE_PUBLISHABLE_KEY=
```

---

# 🐳 Running with Docker

Build containers

```bash
docker compose build
```

Start containers

```bash
docker compose up
```

Detached mode

```bash
docker compose up -d
```

Stop

```bash
docker compose down
```

---

# 🔒 Security Features

* JWT Authentication
* Refresh Token Rotation
* HTTP Only Cookies
* Password Hashing using bcrypt
* Helmet Security Headers
* Rate Limiting
* Request Validation
* MongoDB Sanitization
* XSS Protection
* CORS Configuration
* Secure Error Handling

---

# ⚡ Redis

Redis is used for:

* Performance optimization
* Frequently accessed data caching
* Queue support
* Session-related operations

---

# ⚙️ BullMQ

Background jobs include:

* Email Processing
* Notification Jobs
* Retry Mechanism
* Delayed Tasks
* Failed Job Recovery

---

# 🔔 Socket.IO

Real-time functionality includes:

* Live Order Updates
* Order Status Changes
* Instant Notifications
* Dashboard Refresh Events

---

# 💳 Stripe Integration

Supports

* Secure Checkout
* Payment Verification
* Order Confirmation
* Transaction Recording

---

# 📡 API Modules

Authentication

```text
/api/auth
```

Users

```text
/api/users
```

Restaurants

```text
/api/restaurants
```

Food

```text
/api/foods
```

Categories

```text
/api/categories
```

Orders

```text
/api/orders
```

Payments

```text
/api/payments
```

Admin

```text
/api/admin
```

Partner

```text
/api/partner
```

Notifications

```text
/api/notifications
```

---

# 🚀 Deployment

The project is containerized using Docker and deployed on an AWS EC2 instance.

Deployment workflow includes:

* Docker Build
* Docker Compose
* GitHub Actions
* Automatic Deployment on Push
* Environment Variable Management
* Production Reverse Proxy (optional)
* Secure Server Configuration

---

# 📈 Highlights

* Full MERN Stack Application
* Production-Oriented Architecture
* Secure Authentication System
* Dockerized Services
* CI/CD Pipeline
* Redis Integration
* Background Workers
* Payment Gateway
* Real-Time Updates
* Cloud Image Storage
* RESTful APIs
* Responsive UI

---

# 🔮 Future Enhancements

* AI Food Recommendations
* Coupon System
* Wishlist
* Referral Program
* Push Notifications
* Progressive Web App (PWA)
* Restaurant Analytics
* Delivery Partner Module
* Google Maps Integration
* Advanced Search & Filtering

---

# 📸 Screenshots

> Add screenshots here after deployment.

Example:

text
Home Page
<img width="1910" height="984" alt="image" src="https://github.com/user-attachments/assets/8b2c3a8b-4717-43a6-8dfe-71824e44912a" />


Restaurant Dashboard


Admin Dashboard
<img width="1907" height="970" alt="image" src="https://github.com/user-attachments/assets/7aa36891-0a2c-4ace-820b-2850035417dd" />


Food Details
<img width="1896" height="914" alt="image" src="https://github.com/user-attachments/assets/c620f558-cc49-4030-83b5-3b2ae17a9eb9" />


Checkout
<img width="1909" height="910" alt="image" src="https://github.com/user-attachments/assets/1a6b61f0-3666-4544-8e1e-8e90b3cfdb99" />


Orders
<img width="1907" height="910" alt="image" src="https://github.com/user-attachments/assets/4cfb9def-49ad-403d-89ad-c6229da32f9d" />


Payment
<img width="1910" height="952" alt="image" src="https://github.com/user-attachments/assets/e87bbb32-7624-43a9-a44d-b920730f6498" />



Mobile View
<img width="794" height="1600" alt="MobileView" src="https://github.com/user-attachments/assets/b907a771-0ffe-4b1b-a483-fb675348765a" />



---

# 📚 Documentation

Detailed documentation is available inside the `docs/` directory.

* PROJECT_DOCUMENTATION.md
* API.md
* DATABASE.md
* ARCHITECTURE.md
* DEPLOYMENT.md
* SECURITY.md

---

# 🤝 Contributing

Contributions, suggestions, and bug reports are welcome.

1. Fork the repository.
2. Create a new branch.
3. Commit your changes.
4. Push the branch.
5. Open a Pull Request.

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

**Apoorv Yadav**

**GitHub:** https://github.com/apoorvy711

If you found this project helpful, consider giving it a ⭐ on GitHub.

---

<div align="center">

### ⭐ If you like this project, don't forget to star the repository!

</div>
