# 03. एक्सप्रेस 5 और मिडलवेयर पाइपलाइन (Express 5 & Middlewares)

---

## 1. `src/app.js` का अवलोकन

`src/app.js` हमारे एप्लिकेशन का मुख्य कंट्रोल रूम है। यह तय करता है कि आने वाली रिक्वेस्ट को कैसे पढ़ा जाएगा, व्यूज (HTML) कहाँ से रेंडर होंगे, API रूट्स कहाँ जुड़ेंगे, अगर कोई गलत URL डाले (404) तो क्या होगा, और अगर कोई एरर आ जाए (500) तो उसे कैसे संभाला जाएगा।

यहाँ [`src/app.js`](file:///d:/node_project/todo-app/src/app.js) का पूरा कोड है:

```javascript
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import todoRoutes from "./routes/todo.routes.js";
import * as response from "./utils/api-response.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => {
  res.render("index", {
    title: "Todo App",
    message: "Welcome to my Todo App"
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/todos", todoRoutes);

app.use((req, res) => {
  return response.error(res, "Route not found.", 404);
});

app.use((err, req, res, next) => {
  console.error(err);

  if (res.headersSent) return next(err);

  return response.error(res, "Internal server error.", 500);
});

export default app;
```

---

## 2. मिडलवेयर क्या है? (रियल-लाइफ एयरपोर्ट सिक्योरिटी एनालॉजी)

एक्सप्रेस में **मिडलवेयर** एक ऐसा फंक्शन होता है जो आने वाली रिक्वेस्ट (`req`) और जाने वाले रिस्पांस (`res`) के बीच में खड़ा होकर काम करता है।

### एयरपोर्ट का उदाहरण:
1. **गेट 1 (बैगेज स्कैनर - `express.json()`)**: आपके बैग को स्कैन करके उसका सारा सामान एक ट्रॉली में व्यवस्थित रखता है (`req.body`)।
2. **गेट 2 (टिकट चेकर - Routes)**: देखता है कि आपको दिल्ली जाना है या मुंबई (`/api/todos`)।
3. **लापता यात्री डेस्क (404 Not Found)**: अगर कोई यात्री ऐसे गेट पर चला जाए जो एयरपोर्ट में है ही नहीं, तो यह डेस्क उसे रोकती है कि "यह रास्ता गलत है"।
4. **इमरजेंसी मेडिकल टीम (ग्लोबल एरर हैंडलर)**: अगर पूरे रास्ते में किसी यात्री को चक्कर आ जाए या कोई एक्सीडेंट हो जाए, तो एम्बुलेंस तुरंत आकर उसे संभालती है ताकि बाकी एयरपोर्ट में भगदड़ न मचे (500 Internal Server Error)।

---

## 3. कोड के महत्वपूर्ण हिस्सों की विस्तृत व्याख्या

### 3.1 ES Modules में `__dirname` का निर्माण
```javascript
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```
- पुराने Node.js (CommonJS) में `__dirname` पहले से बना मिलता था।
- लेकिन जब हम `"type": "module"` इस्तेमाल करते हैं, तो `__dirname` गायब हो जाता है!
- इसलिए हम `import.meta.url` (फ़ाइल का URL) को `fileURLToPath` से असली पाथ में बदलते हैं, और `path.dirname` से फोल्डर का पाथ निकाल लेते हैं।

### 3.2 बॉडी पार्सर (`express.json()`)
```javascript
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```
- जब क्लाइंट पोस्टमैन या ब्राउज़र से JSON डाटा भेजता है, तो वह नेटवर्क पर छोटे-छोटे टुकड़ों (Chunks/Buffers) में आता है।
- `express.json()` उन सारे टुकड़ों को जोड़ता है, JSON को पार्स करता है और जावास्क्रिप्ट ऑब्जेक्ट बना कर `req.body` में डाल देता है।
- **चेतावनी**: अगर आप इस लाइन को रूट्स के नीचे लिख देंगे, तो आपके कंट्रोलर में `req.body` हमेशा `undefined` मिलेगा और कोड क्रैश हो जाएगा!

### 3.3 404 रूट हैंडलर
```javascript
app.use((req, res) => {
  return response.error(res, "Route not found.", 404);
});
```
- यह सारे वैलिड रूट्स के **सबसे नीचे** लिखा जाता है।
- अगर कोई क्लाइंट `/api/xyz` पर रिक्वेस्ट भेजता है जो हमारे कोड में कहीं नहीं है, तो रिक्वेस्ट बहते-बहते यहाँ आकर रुकती है और 404 एरर मिल जाती है।

### 3.4 4-आर्गुमेंट ग्लोबल एरर हैंडलर और `res.headersSent`
```javascript
app.use((err, req, res, next) => {
  console.error(err);

  if (res.headersSent) return next(err);

  return response.error(res, "Internal server error.", 500);
});
```
- **4 आर्गुमेंट्स का नियम**: एक्सप्रेस सिर्फ तभी किसी फंक्शन को एरर हैंडलर मानता है जब उसमें पूरे 4 पैरामीटर हों: `(err, req, res, next)`. अगर आपने गलती से सिर्फ `(err, req, res)` लिखा, तो एक्सप्रेस इसे नार्मल मिडलवेयर समझ लेगा और एरर कभी यहाँ नहीं आएगी!
- **`if (res.headersSent) return next(err)` का राज**:
  - `headersSent` का मतलब है कि क्या सर्वर ब्राउज़र को आधा रिस्पांस भेज चुका है?
  - HTTP प्रोटोकॉल में स्टेटस कोड (जैसे 200 या 500) सिर्फ एक बार भेजा जा सकता है। अगर आधा डाटा जाने के बाद कोई एरर आई और हमने फिर से `res.status(500)` भेजने की कोशिश की, तो Node.js क्रैश हो जाएगा (`ERR_HTTP_HEADERS_SENT`)। इसलिए अगर हेडर पहले ही जा चुके हैं, तो हम `next(err)` करके काम डिफ़ॉल्ट हैंडलर को सौंप देते हैं।

---

## 4. एक्सप्रेस 5 में नया क्या है?

- **Express 4 में**: अगर किसी `async` कंट्रोलर में एरर आती थी, तो कोड अटक जाता था या सर्वर क्रैश हो जाता था जब तक कि हर जगह `try/catch` न लगाया जाए।
- **Express 5 में**: एक्सप्रेस 5 अपने आप प्रॉमिस रिजेक्शन को पकड़ लेता है और सीधे हमारे 4-आर्गुमेंट वाले ग्लोबल एरर हैंडलर के पास भेज देता है!

---

## 5. इंटरव्यू प्रश्न और उत्तर (Q&A)

### प्र. 1: एक्सप्रेस कैसे पहचानता है कि कोई मिडलवेयर एरर हैंडलिंग मिडलवेयर है?
> **उत्तर**: एक्सप्रेस जावास्क्रिप्ट के फंक्शन की लंबाई (`fn.length` यानी पैरामीटर्स की संख्या) चेक करता है। अगर फंक्शन में पूरे 4 पैरामीटर हैं `(err, req, res, next)`, तभी एक्सप्रेस उसे एरर हैंडलर मानता है।

### प्र. 2: `express.json()` और `express.urlencoded()` में क्या अंतर है?
> **उत्तर**: 
> - `express.json()` उन रिक्वेस्ट्स के लिए है जिनका `Content-Type: application/json` होता है (जैसे मोबाइल ऐप या रिएक्ट/फेच से भेजा गया JSON डेटा)।
> - `express.urlencoded()` उन रिक्वेस्ट्स के लिए है जिनका `Content-Type: application/x-www-form-urlencoded` होता है (जैसे पारंपरिक HTML फॉर्म सबमिशन)। `{ extended: true }` लिखने से यह नेस्टेड ऑब्जेक्ट्स को भी पार्स कर पाता है।
