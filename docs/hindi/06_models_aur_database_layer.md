# 06. मॉडल और डेटाबेस लेयर (Models & Database Layer)

---

## 1. डेटाबेस लेयर का परिचय

यह लेयर हमारे एप्लिकेशन का दिल है जहाँ डेटा सचमुच MySQL के अंदर लिखा और पढ़ा जाता है।
इसमें 3 मुख्य फाइलें हैं:
1. **[`src/db/schema.sql`](file:///d:/node_project/todo-app/src/db/schema.sql)**: टेबल का स्ट्रक्चर और डेटा टाइप तय करता है।
2. **[`src/config/db.js`](file:///d:/node_project/todo-app/src/config/db.js)**: डेटाबेस कनेक्शन पूल (`mysql2/promise`) बनाता है।
3. **[`src/models/todo.model.js`](file:///d:/node_project/todo-app/src/models/todo.model.js)**: SQL क्वेरीज़ चलाता है और डेटा लाता है।

---

## 2. डेटाबेस स्कीमा (`schema.sql`)

```sql
CREATE DATABASE IF NOT EXISTS todo_app;

USE todo_app;

CREATE TABLE IF NOT EXISTS todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    status ENUM(
        'pending',
        'in_progress',
        'completed'
    ) NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);
```

### कॉलम की खूबियां:
- **`id INT AUTO_INCREMENT PRIMARY KEY`**: 4 बाइट का पूर्णांक (2 अरब से ज्यादा रिकॉर्ड्स संभाल सकता है)। प्राइमरी की होने से MySQL खुद-ब-खुद इसके ऊपर एक **B-Tree इंडेक्स** बना देता है, जिससे ID से सर्च करने पर डेटा पलक झपकते मिल जाता है ($O(\log N)$ स्पीड)।
- **`title VARCHAR(255) NOT NULL`**: 255 अक्षरों तक की जगह लेता है। `NOT NULL` यह पक्का करता है कि बिना नाम का टास्क डेटाबेस में कभी न घुसे।
- **`description TEXT NULL`**: बड़ा टेक्स्ट (64 KB तक) रखने के लिए। यह वैकल्पिक (Nullable) है।
- **`status ENUM(...)`**: इसमें सिर्फ तय किए गए तीन स्टेटस ही आ सकते हैं। MySQL इसे अंदरूनी तौर पर 1 बाइट के नंबर (1, 2, 3) के रूप में स्टोर करता है, जिससे मेमोरी की बहुत बचत होती है।
- **`created_at` व `updated_at`**: टाइमस्टैम्प जो MySQL के इन-बिल्ट `NOW()` फंक्शन से भरे जाते हैं।

---

## 3. कनेक्शन पूल (`src/config/db.js`) — रेंट-ए-कार एनालॉजी

```javascript
import mysql from "mysql2/promise";

const env = process.env;

const db = mysql.createPool({
  host: env.DB_HOST,
  port: Number(env.DB_PORT || 3306),
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
});

export default db;
```

### कनेक्शन पूल की रियल-लाइफ एनालॉजी:
- **बिना पूल के (`createConnection`)**: जब भी किसी को बाजार जाना हो (क्वेरी चलानी हो), तो वह शोरूम जाकर नई कार खरीदे, कागजात बनवाए (TCP हैंडशेक और पासवर्ड ऑथेंटिकेशन), 2 मिनट चलाए और फिर कार को कबाड़ में फेंक दे (`conn.end()`). यह सर्वर को बर्बाद कर देगा!
- **पूल के साथ (`createPool`)**: यह एक टैक्सी स्टैंड या कार रेंटल एजेंसी की तरह है जहाँ 10 कारें हमेशा तैयार खड़ी रहती हैं। रिक्वेस्ट आई, खाली कार ली, काम किया, और कार वापस पार्किंग में खड़ी कर दी।
- **`waitForConnections: true`**: अगर सारी 10 कारें व्यस्त हैं और 11वीं रिक्वेस्ट आई, तो एरर देने की बजाय उसे लाइन में खड़ा रखता है जैसे ही कोई कार खाली होगी, उसे मिल जाएगी।

---

## 4. मॉडल फंक्शन्स का गहरा विश्लेषण (`todo.model.js`)

```javascript
import db from "../config/db.js";

export const create = async ({ title, description, status }) => {
  const [result] = await db.execute(
    `INSERT INTO todos
      (title, description, status, created_at, updated_at)
     VALUES (?, ?, ?, NOW(), NOW())`,
    [title, description ?? null, status ?? "pending"]
  );

  return findById(result.insertId);
};

export const findAll = async () => {
  const [rows] = await db.execute(
    "SELECT * FROM todos ORDER BY id DESC"
  );

  return rows;
};

export const findById = async (id) => {
  const [rows] = await db.execute(
    "SELECT * FROM todos WHERE id = ?",
    [id]
  );

  return rows[0] ?? null;
};

export const update = async (id, fields) => {
  const allowedFields = ["title", "description", "status"];
  const keys = allowedFields.filter((key) =>
    Object.hasOwn(fields, key)
  );

  if (keys.length === 0) return findById(id);

  const setClause = keys
    .map((key) => `\`${key}\` = ?`)
    .join(", ");

  const values = keys.map((key) => fields[key]);

  await db.execute(
    `UPDATE todos SET ${setClause} WHERE id = ?`,
    [...values, id]
  );

  return findById(id);
};

export const remove = async (id) => {
  const [result] = await db.execute(
    "DELETE FROM todos WHERE id = ?",
    [id]
  );

  return result.affectedRows > 0;
};
```

---

## 5. सबसे बड़ा इंटरव्यू सवाल: `db.execute()` बनाम `db.query()`

इंटरव्यूअर पूछता है: *"आपने `db.query` की जगह `db.execute` क्यों इस्तेमाल किया और यह SQL इंजेक्शन कैसे रोकता है?"*

### सटीक उत्तर:
1. **`db.query`**: पूरी SQL क्वेरी को एक साधारण टेक्स्ट स्ट्रिंग बनाकर डेटाबेस को भेजता है। अगर किसी ने `title` में `' OR '1'='1` लिख दिया, तो डेटाबेस उसे SQL का हिस्सा समझकर गलत क्वेरी चला देता है।
2. **`db.execute` (Prepared Statement)**:
   - यह MySQL के **बाइनरी प्रोटोकॉल** का उपयोग करता है।
   - पहले SQL का ढांचा `(?, ?, ?)` डेटाबेस के पास जाता है। डेटाबेस उसका ग्रामर ट्री और एग्जीक्यूशन प्लान बना लेता है।
   - इसके बाद यूजर का डेटा अलग पैकेट में जाता है।
   - चूंकि ढांचा पहले ही फिक्स हो चुका है, इसलिए यूजर का इनपुट चाहे कुछ भी हो, डेटाबेस उसे सिर्फ एक सादा टेक्स्ट ही मानता है, कोई कमांड नहीं! इससे **SQL इंजेक्शन का खतरा 100% खत्म** हो जाता है।

---

## 6. डायनामिक SQL और `Object.hasOwn()`

`update` फंक्शन में ध्यान से देखिए:
```javascript
const allowedFields = ["title", "description", "status"];
const keys = allowedFields.filter((key) => Object.hasOwn(fields, key));
```
- **व्हाइटलिस्टिंग (Whitelisting)**: अगर कोई हैकर `{ "id": 100, "is_admin": true }` भेजने की कोशिश करे, तो यह फ़िल्टर सिर्फ `title`, `description`, `status` को ही चुनेगा, बाकी सब कचरा बाहर फेंक देगा।
- **`Object.hasOwn(fields, key)`**: यह ES2022 का नया तरीका है जो यह चेक करता है कि क्या यह प्रॉपर्टी सच में उस ऑब्जेक्ट की अपनी है। यह प्रोटोटाइप पॉल्यूशन हमलों से बचाता है।

---

## 7. इंटरव्यू प्रश्न और उत्तर (Q&A)

### प्र. 1: `const [rows] = await db.execute(...)` में ब्रैकेट `[rows]` क्यों लगाया गया है?
> **उत्तर**: इसे 'एरे डिस्ट्रक्चरिंग (Array Destructuring)' कहते हैं। `mysql2/promise` जब कोई क्वेरी चलाता है, तो वह 2 चीजों का एक टुपल (Tuple/Array) लौटाता है: पहला एलिमेंट होता है असली डेटा की पंक्तियां (`rows`), और दूसरा एलिमेंट होता है टेबल का मेटाडेटा (कॉलम की जानकारी)। हमें सिर्फ डेटा चाहिए, इसलिए हम `[rows]` लिखकर पहला एलिमेंट निकाल लेते हैं।

### प्र. 2: `remove` फंक्शन में `result.affectedRows > 0` क्यों लौटाया गया है?
> **उत्तर**: MySQL में जब कोई `DELETE` क्वेरी चलती है, तो वह यह नहीं बताती कि रिकॉर्ड मिला या नहीं। वह बस यह बताती है कि कितनी पंक्तियों पर असर पड़ा (`affectedRows`)। अगर ID मौजूद थी और डिलीट हो गई, तो `affectedRows` 1 होगा (जो 0 से बड़ा है, यानी `true`)। अगर उस ID का कोई रिकॉर्ड ही नहीं था, तो `affectedRows` 0 होगा (यानी `false`)। इसी से कंट्रोलर तय करता है कि 200 OK भेजना है या 404 Not Found।
