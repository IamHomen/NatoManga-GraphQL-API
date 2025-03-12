# 📘 Natomanga GraphQL API

![GraphQL API](https://img.shields.io/badge/GraphQL-API-blueviolet?style=for-the-badge&logo=graphql)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge&logo=javascript)
![Express.js](https://img.shields.io/badge/Express.js-API-green?style=for-the-badge&logo=express)

A **lightweight** GraphQL API for fetching manga updates from [Natomanga](https://www.natomanga.com). This API scrapes the latest manga updates using **Cheerio** and **Axios** with built-in **caching** for efficiency.

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
- **Node.js** `v14+`
- **NPM** `v6+`

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
      "title": "Mamono Kurai no Boukensha",
      "cover": "https://imgs-2.2xstorage.com/thumb/mamono-kurai-no-boukensha.webp",
      "author": "John Doe",
      "status": "Ongoing",
      "genres": ["Action", "Adventure"],
      "description": "A story of a lone adventurer...",
      "chapters": [
        {
          "title": "Chapter 15",
          "url": "https://www.natomanga.com/manga/mamono-kurai-no-boukensha/chapter-15",
          "views": "120,000",
          "upload_time": "5 minutes ago"
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
        "title": "The Older Sister Should Raise Her Younger Sister",
        "cover": "https://imgs-2.2xstorage.com/thumb/the-older-sister-should-raise-her-younger-sister.webp",
        "url": "https://www.natomanga.com/manga/the-older-sister-should-raise-her-younger-sister",
        "latest_chapter": "Chapter 82",
        "latest_chapter_url": "https://www.natomanga.com/manga/the-older-sister-should-raise-her-younger-sister/chapter-82",
        "upload_time": "1 minute ago"
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
        "title": "Martial Peak",
        "cover": "https://imgs-2.2xstorage.com/thumb/martial-peak.webp",
        "url": "https://www.natomanga.com/manga/martial-peak",
        "latest_chapter": "Chapter 3823",
        "latest_chapter_url": "https://www.natomanga.com/manga/martial-peak/chapter-3823",
        "views": "725,516,484",
        "description": "The journey to the martial peak is a lonely, solitary and long one..."
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
📧 Email: `your@email.com`  
🐙 GitHub: [YourUsername](https://github.com/yourusername)

