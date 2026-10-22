# 07. वैलिडेशन और वेब सिक्योरिटी (Validation & Web Security)

---

## 1. `src/validators/todo.validator.js` का अवलोकन

वैलिडेशन लेयर हमारे एप्लिकेशन का मुख्य सुरक्षा घेरा (Firewall) है। यह **Fail-Fast सिद्धांत** पर काम करता है: यानी अगर इनपुट डेटा में कोई भी कमी या खराबी है, तो उसे तुरंत सबसे पहले कदम पर ही अस्वीकार (Reject) कर दो, ताकि वह अंदर जाकर कंट्रोलर या डेटाबेस का समय और रिसोर्सेज बर्बाद न करे।

यहाँ [`src/validators/todo.validator.js`](file:///d:/node_project/todo-app/src/validators/todo.validator.js) का पूरा कोड है:

```javascript
const allowedStatuses = [
  "pending",
  "in_progress",
  "completed",
];

export const validateCreateTodo = (body) => {
  if (
    typeof body.title !== "string" ||
    !body.title.trim()
  ) {
    return "Title is required.";
  }

  if (body.title.trim().length > 255) {
    return "Title cannot exceed 255 characters.";
  }

  if (
    body.description !== undefined &&
    body.description !== null &&
    typeof body.description !== "string"
  ) {
    return "Description must be a string.";
  }

  if (
    body.status !== undefined &&
    !allowedStatuses.includes(body.status)
  ) {
    return "Invalid todo status.";
  }

  return null;
};

export const validateUpdateTodo = (body) => {
  const keys = ["title", "description", "status"];

  if (!keys.some((key) => Object.hasOwn(body, key))) {
    return "At least one field is required.";
  }

  if (
    Object.hasOwn(body, "title") &&
    (typeof body.title !== "string" ||
      !body.title.trim() ||
      body.title.trim().length > 255)
  ) {
    return "Title must contain 1-255 characters.";
  }

  if (
    Object.hasOwn(body, "description") &&
    body.description !== null &&
    typeof body.description !== "string"
  ) {
    return "Description must be a string or null.";
  }

  if (
    Object.hasOwn(body, "status") &&
    !allowedStatuses.includes(body.status)
  ) {
    return "Invalid todo status.";
  }

  return null;
};
```

---

## 2. रियल-लाइफ उदाहरण: एम्बेसी का वीज़ा काउंटर

- अगर आप विदेश यात्रा के लिए वीज़ा फॉर्म भरने जाते हैं और अपना नाम खाली छोड़ देते हैं या जाली तारीख डाल देते हैं, तो रिसेप्शन पर बैठा क्लर्क फॉर्म तुरंत आपकी तरफ वापस बढ़ा देता है।
- वह आपके गलत फॉर्म को राजदूत (Ambassador) या वीज़ा ऑफिसर के पास नहीं भेजता।
- **क्यों?** ताकि बड़े अफसरों का कीमती वक्त बर्बाद न हो। हमारे प्रोजेक्ट में भी वैलिडेटर गलत रिक्वेस्ट को डेटाबेस तक पहुंचने से पहले ही 400 Bad Request के साथ लौटा देता है।

---

## 3. वैलिडेशन के महत्वपूर्ण सुरक्षा बिंदु

### 3.1 खाली ऑब्जेक्ट से सुरक्षा (`keys.some(...)`)
```javascript
const keys = ["title", "description", "status"];
if (!keys.some((key) => Object.hasOwn(body, key))) {
  return "At least one field is required.";
}
```
- अगर कोई यूजर या बॉट `PUT /api/todos/1` पर खाली बॉडी `{}` या फालतू डेटा `{ "abc": 123 }` भेजता है, तो `some()` चेक करता है कि क्या हमारे काम की कम से कम एक फ़ील्ड मौजूद है? अगर नहीं, तो रिक्वेस्ट तुरंत ब्लॉक हो जाती है।

### 3.2 255 अक्षरों की सीमा (Database DOS अटैक से बचाव)
```javascript
if (body.title.trim().length > 255) {
  return "Title cannot exceed 255 characters.";
}
```
- अगर कोई हैकर 10 लाख अक्षरों की विशाल स्ट्रिंग भेज दे, तो सर्वर की रैम भर सकती है और डेटाबेस क्रैश हो सकता है। यह 255 की सीमा डेटाबेस के `VARCHAR(255)` कॉलम से मेल खाती है और सर्वर को ओवरलोड होने से बचाती है।

### 3.3 स्पेस की सफाई (`.trim()`)
- जावास्क्रिप्ट में `"   "` (सिर्फ स्पेस) की लंबाई 3 होती है और उसका `typeof` भी `"string"` होता है।
- अगर हम `.trim()` न लगाएं, तो सिर्फ स्पेस दबाकर कोई खाली टास्क सेव कर देगा। `!body.title.trim()` यह पक्का करता है कि टास्क का कोई असली नाम जरूर हो।

---

## 4. हमारे प्रोजेक्ट द्वारा रोके गए टॉप 5 सुरक्षा खतरे

| सुरक्षा खतरा (Vulnerability) | हैकर की चाल | हमारे प्रोजेक्ट का सुरक्षा घेरा |
|---|---|---|
| **SQL Injection (SQLi)** | इनपुट में `' OR '1'='1` डालकर डेटा चुराना | **Prepared Statements**: `db.execute()` में `?` का इस्तेमाल डेटा और कोड को पूरी तरह अलग रखता है। |
| **Mass Assignment** | पेलोड में `{ "id": 5, "is_admin": true }` भेजना | **फ़ील्ड व्हाइटलिस्टिंग**: केवल वही फ़ील्ड ली जाती हैं जो `allowedFields` लिस्ट में हैं। |
| **Prototype Pollution** | `{ "__proto__": ... }` भेजकर जावास्क्रिप्ट ऑब्जेक्ट्स को दूषित करना | **`Object.hasOwn(body, key)`**: यह सिर्फ अपनी प्रॉपर्टी चेक करता है, प्रोटोटाइप चेन में नहीं झांकता। |
| **Integer Overflow / NaN** | ID में `NaN` या $2^{60}$ जैसा बड़ा नंबर भेजना | **Regex + Safe Integer**: `/^[1-9]\d*$/` और `Number.isSafeInteger()`. |
| **Information Disclosure** | सर्वर क्रैश होने पर हैकर को डेटाबेस पासवर्ड और कोड पाथ दिखना | **Generic Error Masking**: कंसोल में एरर लॉग होती है, लेकिन यूजर को सिर्फ साफ-सुथरा `"Internal server error."` दिखता है। |

---

## 5. इंटरव्यू प्रश्न और उत्तर (Q&A)

### प्र. 1: Mass Assignment हमला क्या होता है और आपने इससे कैसे बचाया?
> **उत्तर**: Mass Assignment तब होता है जब डेवलपर बिना जांचे क्लाइंट से आए सारे डेटा को सीधे डेटाबेस ऑब्जेक्ट में असाइन कर देता है (जैसे `Todo.update(req.body)`). इससे कोई हैकर ऐसे फ़ील्ड्स भी बदल सकता है जिनका उसे अधिकार नहीं है (जैसे `user_role` या `id`). 
> हमारे प्रोजेक्ट में हमने मॉडल और वैलिडेटर में **व्हाइटलिस्ट (Whitelist)** लगाई है:
> ```javascript
> const allowedFields = ["title", "description", "status"];
> ```
> इसके बाहर का कोई भी फ़ील्ड डेटाबेस में कभी नहीं पहुंच सकता।

### प्र. 2: `Object.hasOwn(body, key)` और `body.hasOwnProperty(key)` में सुरक्षा का क्या अंतर है?
> **उत्तर**: अगर किसी ऑब्जेक्ट को `Object.create(null)` से बनाया गया हो, तो उसमें `hasOwnProperty` मेथड मौजूद ही नहीं होता और कोड क्रैश हो जाता है। दूसरा, अगर किसी क्लाइंट ने JSON में `{ "hasOwnProperty": "hack" }` नाम की प्रॉपर्टी भेज दी, तो ओरिजिनल मेथड ओवरराइड हो जाता है। `Object.hasOwn()` ES2022 का स्टैटिक मेथड है जो हर हाल में सुरक्षित रहता है।
