# 📚 Natomanga GraphQL API

![GraphQL API](https://img.shields.io/badge/GraphQL-API-blueviolet?style=for-the-badge&logo=graphql)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge&logo=javascript)
![Express.js](https://img.shields.io/badge/Express.js-API-green?style=for-the-badge&logo=express)

A **lightweight** GraphQL API for fetching manga updates from [Natomanga](https://www.natomanga.com). This API scrapes the latest manga updates using **Cheerio** and **Axios** with built-in **caching** for efficiency.

---

## 📖 Table of Contents
- [🚀 Features](#-features)
- [🛠 Installation](#-installation)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
- [🔍 GraphQL Queries](#-graphql-queries)
  - [1️⃣ Fetch Manga by ID](#1%ef%b8%8f-fetch-manga-by-id)
  - [2️⃣ Fetch Latest Updated Manga](#2%ef%b8%8f-fetch-latest-updated-manga)
  - [3️⃣ Fetch Hot Manga List](#3%ef%b8%8f-fetch-hot-manga-list)
- [📜 License](#-license)
- [🤝 Contributing](#-contributing)
- [💬 Contact](#-contact)

---

## 🚀 Features
✅ Fetch manga details by ID

✅ Get latest updated manga

✅ Get hot manga list

✅ Efficient caching (10 mins)

✅ Fast and lightweight

---

## 🛠 Installation

### **Prerequisites**
- **Node.js** `v22+`
- **NPM** `v10+`

### **Setup**
```bash
# Clone the repo
git clone https://github.com/yourusername/natomanga-graphql-api.git

# Navigate to the project folder
cd natomanga-graphql-api

# Install dependencies
npm install

# Start the API server
npm start
```

The API will be available at: **`http://localhost:4000/graphql`**

---

## 🔍 GraphQL Queries

### **1️⃣ Fetch Manga by ID**
#### **Query:**
```graphql
{
  getManga(id: "mamono-kurai-no-boukensha") {
    title
    cover
    author
    status
    genres
    description
    chapters {
      title
      url
      views
      upload_time
    }
  }
}
```
#### **Example Response:**
```json
{
  "data": {
    "getManga": {
      "title": "String",
      "cover": "String",
      "author": "String",
      "status": "String",
      "genres": ["Action", "Adventure"],
      "description": "String",
      "chapters": [
        {
          "title": "String",
          "url": "String",
          "views": "String",
          "upload_time": "String"
        }
      ]
    }
  }
}
```

---

### **2️⃣ Fetch Latest Updated Manga**
#### **Query:**
```graphql
{
  getLatestManga {
    title
    cover
    url
    latest_chapter
    latest_chapter_url
    upload_time
  }
}
```
#### **Example Response:**
```json
{
  "data": {
    "getLatestManga": [
      {
        "title": "String",
        "cover": "String",
        "url": "String",
        "latest_chapter": "String",
        "latest_chapter_url": "String",
        "upload_time": "String"
      }
    ]
  }
}
```

---

### **3️⃣ Fetch Hot Manga List**
#### **Query:**
```graphql
{
  getHotManga {
    title
    cover
    url
    latest_chapter
    latest_chapter_url
    views
    description
  }
}
```
#### **Example Response:**
```json
{
  "data": {
    "getHotManga": [
      {
        "title": "String",
        "cover": "String",
        "url": "String",
        "latest_chapter": "String",
        "latest_chapter_url": "String",
        "views": "String",
        "description": "String"
      }
    ]
  }
}
```

---

## 📜 License
This project is **open-source** and available under the **MIT License**.

---

## 🤝 Contributing
Pull requests are welcome! If you have any improvements or bug fixes, feel free to open an issue.

---

## 💬 Contact
📧 Email: `homen0.00001@gmail.com`  
🐙 GitHub: [IamHomen](https://github.com/IamHomen)
