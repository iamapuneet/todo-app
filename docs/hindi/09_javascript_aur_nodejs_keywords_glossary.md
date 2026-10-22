# 09. जावास्क्रिप्ट और नोड.जेएस कीवर्ड एनसाइक्लोपीडिया (Keywords Encyclopedia)

इस गाइड में हमारे Todo प्रोजेक्ट में इस्तेमाल हुए जावास्क्रिप्ट और Node.js के **हर एक कीवर्ड, ऑपरेटर, और कॉन्सेप्ट** का पूरी गहराई में पोस्टमार्टम किया गया है। हर कीवर्ड के साथ उसकी परिभाषा, प्रोजेक्ट में उसका असली कोड, उसका अंदरूनी फ्लो, रियल-लाइफ उदाहरण और इंटरव्यू में फंसाने वाले सवाल शामिल हैं।

---

## 1. `import` और `export` (ES Modules)

### क्या है यह?
ES Modules (ESM) जावास्क्रिप्ट में कोड को अलग-अलग फाइलों में बांटने (Modularity) का आधुनिक मानक तरीका है। जब हम `package.json` में `"type": "module"` लिखते हैं, तो Node.js पुराने `require()` की जगह `import`/`export` को चालू कर देता है।

### हमारे प्रोजेक्ट में कहाँ इस्तेमाल हुआ?
- **Named Import**: `import { Router } from "express";` ([todo.routes.js:L1](file:///d:/node_project/todo-app/src/routes/todo.routes.js#L1))
- **Namespace Import**: `import * as Todo from "../models/todo.model.js";` ([todo.controller.js:L1](file:///d:/node_project/todo-app/src/controllers/todo.controller.js#L1))
- **Default Export**: `export default app;` ([app.js:L40](file:///d:/node_project/todo-app/src/app.js#L40))
- **Side-Effect Import**: `import "dotenv/config";` ([server.js:L1](file:///d:/node_project/todo-app/src/server.js#L1))

### रियल-लाइफ उदाहरण: कारखानों के बीच सामान का आदान-प्रदान
सोचिए कि हर फ़ाइल एक अलग कमरा है जिसके दरवाजे बंद हैं।
- `export`: कमरे में बना कोई खास औजार एक डिब्बे पर अपना नाम लिखकर बाहर रख देना।
- `import`: दूसरे कमरे में उस औजार को मंगाकर काम में लेना।
- `import "dotenv/config"`: कमरे से कोई औजार नहीं मंगाना, बल्कि सिर्फ बाहर लगे मेन जनरेटर का स्विच ऑन कर देना (Side-effect)।

### इंटरव्यू की गुगली (Trap):
ESM में `import` स्टेटमेंट्स **होइस्ट (Hoist)** होते हैं और कोड चलने से पहले ही पार्स हो जाते हैं। आप किसी `if (condition)` के अंदर सीधा `import ...` नहीं लिख सकते (उसके लिए डायनामिक `import()` फंक्शन का इस्तेमाल करना पड़ता है)।

---

## 2. `async` और `await`

### क्या है यह?
जावास्क्रिप्ट सिंगल-थ्रेडेड भाषा है। `async/await` प्रॉमिस (Promises) के ऊपर बनी एक ऐसी सुविधा है जिससे एसिंक्रोनस (टाइम लेने वाला) कोड भी देखने और पढ़ने में बिल्कुल सामान्य सीधे कोड जैसा लगता है, और Node.js का इवेंट लूप ब्लॉक नहीं होता।

### हमारे प्रोजेक्ट में कहाँ इस्तेमाल हुआ?
- [`src/server.js:L7-L18`](file:///d:/node_project/todo-app/src/server.js#L7-L18):
  ```javascript
  async function startServer() {
    try {
      await db.query("SELECT 1");
      app.listen(PORT, ...);
    } catch (err) { ... }
  }
  ```
- [`src/models/todo.model.js:L3-L9`](file:///d:/node_project/todo-app/src/models/todo.model.js#L3-L9):
  ```javascript
  export const create = async ({ title, description, status }) => {
    const [result] = await db.execute(SQL, [...]);
    return findById(result.insertId);
  };
  ```

### रियल-लाइफ उदाहरण: कॉफी शॉप का टोकन/बजर
- **सिंक्रोनस (ब्लॉकिंग)**: आप कॉफी काउंटर पर खड़े हो गए जब तक बरिस्ता 5 मिनट में कॉफी नहीं बना देता, तब तक आप काउंटर नहीं छोड़ेंगे। पीछे खड़े 20 लोग भूखे-प्यासे लाइन में अटक जाएंगे।
- **`async/await`**: कैशियर ने आपको एक कंपन करने वाला बजर (टोकन) दिया। आप साइड में बैठ गए (`await`)। कैशियर बाकी 20 लोगों के आर्डर लेने लगा। जैसे ही आपकी कॉफी तैयार हुई, बजर बजा और आप जाकर कॉफी उठा लाए।

### इंटरव्यू की गुगली:
- अगर किसी फंक्शन के आगे `async` लगा है, तो वह **हमेशा एक Promise ही लौटाएगा**, भले ही आप अंदर से साधारण नंबर `return 5;` लिखें।
- अगर आप किसी प्रॉमिस के आगे `await` लगाना भूल गए, तो आपको डेटा नहीं मिलेगा बल्कि `Promise { <pending> }` ऑब्जेक्ट मिलेगा!

---

## 3. `const`, `let`, और `var`

### क्या है यह?
वेरिएबल बनाने के कीवर्ड्स:
- `const`: ब्लॉक-स्कोप्ड (`{ }`)। इसे दोबारा री-असाइन नहीं किया जा सकता।
- `let`: ब्लॉक-स्कोप्ड। इसकी वैल्यू बाद में बदली (Re-assign) जा सकती है।
- `var`: पुराना तरीका (फंक्शन-स्कोप्ड), जो कई बग्स पैदा करता था। आधुनिक कोड में इसका उपयोग नहीं किया जाता।

### हमारे प्रोजेक्ट में कहाँ इस्तेमाल हुआ?
- `const app = express();` ([app.js:L7](file:///d:/node_project/todo-app/src/app.js#L7))
- `const PORT = process.env.PORT || 3000;` ([server.js:L5](file:///d:/node_project/todo-app/src/server.js#L5))

### रियल-लाइफ उदाहरण: पक्का टैटू बनाम व्हाइटबोर्ड
- `const`: हाथ पर बना पक्का टैटू। जो नाम लिख गया, वह बदला नहीं जा सकता। (लेकिन ध्यान रहे: अगर वह टैटू एक डिब्बा है, तो आप डिब्बे के अंदर सामान बदल सकते हैं, यानी ऑब्जेक्ट की प्रॉपर्टीज बदली जा सकती हैं)।
- `let`: दीवार पर लगा व्हाइटबोर्ड। मार्कर से लिखा 'Pending', मिटाकर लिख दिया 'Completed'।

### इंटरव्यू की गुगली:
`const` री-असाइनमेंट रोकता है, म्यूटेशन नहीं!
```javascript
const user = { name: "राकेश" };
user.name = "सुरेश"; // बिल्कुल सही है! एरर नहीं आएगी।
user = { name: "सुरेश" }; // TypeError: Assignment to constant variable!
```

---

## 4. `try` ... `catch`

### क्या है यह?
रनटाइम एरर्स को संभालने (Exception Handling) का तरीका। `try` के अंदर कोड चलता है; अगर उसमें कोई एरर आई, तो कोड क्रैश होने की बजाय सीधे `catch` ब्लॉक में चला जाता है।

### हमारे प्रोजेक्ट में कोड:
- [`src/server.js:L8-L17`](file:///d:/node_project/todo-app/src/server.js#L8-L17):
  ```javascript
  try {
    await db.query("SELECT 1");
    app.listen(PORT, ...);
  } catch (err) {
    console.error("डेटाबेस कनेक्ट नहीं हुआ:", err.message);
    process.exit(1);
  }
  ```

### रियल-लाइफ उदाहरण: सर्कस का सुरक्षा जाल
कलाकार हवा में छलांग लगाता है (`try`)। अगर उसका हाथ छूट गया, तो नीचे बंधा हुआ मजबूत जाल उसे संभाल लेता है (`catch`), जिससे उसकी जान बच जाती है।

---

## 5. `Object.hasOwn()` बनाम `hasOwnProperty()`

### क्या है यह?
ES2022 का नया तरीका जो चेक करता है कि क्या कोई प्रॉपर्टी किसी ऑब्जेक्ट की अपनी निजी प्रॉपर्टी है या वह प्रोटोटाइप से विरासत में आई है।

### हमारे प्रोजेक्ट में कोड:
- [`src/models/todo.model.js:L33-L35`](file:///d:/node_project/todo-app/src/models/todo.model.js#L33-L35):
  ```javascript
  const keys = allowedFields.filter((key) =>
    Object.hasOwn(fields, key)
  );
  ```

### रियल-लाइफ उदाहरण: संपत्ति का असली मालिक
- खानदानी जायदाद (`in` ऑपरेटर): दादाजी से मिली हुई संपत्ति।
- `Object.hasOwn`: अपनी खुद की कमाई से खरीदी गई संपत्ति।

### इंटरव्यू की गुगली: यह `hasOwnProperty` से बेहतर क्यों है?
अगर ऑब्जेक्ट `Object.create(null)` से बना हो, तो उसमें `hasOwnProperty` मेथड होता ही नहीं है और कोड क्रैश हो जाता है। अगर हैकर ने इनपुट में `{ "hasOwnProperty": "fake" }` भेज दिया, तो पुराना कोड फट जाता है। `Object.hasOwn()` हर हाल में सुरक्षित रहता है।

---

## 6. Nullish Coalescing (`??`) बनाम Logical OR (`||`)

### क्या है यह?
- `??` (Nullish Coalescing): केवल तभी दाईं तरफ की वैल्यू लेता है जब बाईं तरफ की वैल्यू **`null` या `undefined`** हो।
- `||` (Logical OR): किसी भी **falsy** वैल्यू (`null`, `undefined`, `""`, `0`, `false`) पर दाईं तरफ भाग जाता है।

### हमारे प्रोजेक्ट में कोड:
- [`src/models/todo.model.js:L8`](file:///d:/node_project/todo-app/src/models/todo.model.js#L8):
  ```javascript
  [title, description ?? null, status ?? "pending"]
  ```

### रियल-लाइफ उदाहरण: इमरजेंसी सायरन
- `||`: अगर कमरे में थोड़ी सी भी रोशनी कम हुई या पंखा धीमा हुआ या बिजली कटी, तो सायरन बजा देता है।
- `??`: केवल तभी सायरन बजाता है जब बिजली का तार ही कट गया हो (`null` / `undefined`).

### इंटरव्यू की गुगली: खाली स्ट्रिंग का बग
```javascript
const description = ""; // यूजर ने जानबूझकर विवरण खाली छोड़ा है
const d1 = description || "डिफ़ॉल्ट विवरण"; // बन गया "डिफ़ॉल्ट विवरण" (गलत! यूजर की खाली स्ट्रिंग उड़ गई)
const d2 = description ?? "डिफ़ॉल्ट विवरण"; // बचा रहा "" (बिल्कुल सही!)
```

---

## 7. स्प्रेड ऑपरेटर (`...`)

### क्या है यह?
तीन डॉट्स (`...`) किसी भी एरे या ऑब्जेक्ट के अंदर के तत्वों को बाहर बिखेरने (Unpack/Spread) का काम करते हैं।

### हमारे प्रोजेक्ट में कोड:
- **ऑब्जेक्ट की नकल**: `const fields = { ...req.body };` ([todo.controller.js:L61](file:///d:/node_project/todo-app/src/controllers/todo.controller.js#L61))
- **एरे को जोड़ना**: `[...values, id]` ([todo.model.js:L47](file:///d:/node_project/todo-app/src/models/todo.model.js#L47))

### रियल-लाइफ उदाहरण: बैग खाली करना
सूटकेस खोलकर उसके सारे कपड़े सीधे अलमारी में फैला देना और अंत में जूते भी रख देना: `[...कपड़े, जूते]`.

---

## 8. एरे मेथड्स: `filter()`, `map()`, `some()`, `includes()`

1. **`filter()`**: शर्त पूरी करने वाले तत्वों की नई लिस्ट बनाता है।
   - कोड: `allowedFields.filter((key) => Object.hasOwn(fields, key))`
2. **`map()`**: हर तत्व को नए रूप में बदलता है।
   - कोड: `keys.map((key) => `\`${key}\` = ?`).join(", ")`
3. **`some()`**: चेक करता है कि क्या कम से कम एक तत्व शर्त पूरी करता है? (लौटाता है `true`/`false`)
   - कोड: `keys.some((key) => Object.hasOwn(body, key))`
4. **`includes()`**: चेक करता है कि क्या कोई खास वैल्यू एरे में मौजूद है?
   - कोड: `allowedStatuses.includes(body.status)`

---

## 9. रेगुलर एक्सप्रेशन (`RegExp`) और `/^[1-9]\d*$/`

### हमारे प्रोजेक्ट में कोड:
```javascript
if (!/^[1-9]\d*$/.test(value)) return null;
```

### एक-एक सिंबल का मतलब:
- `/ ... /`: रेगुलर एक्सप्रेशन की सीमा।
- `^`: शुरुआत यहीं से होनी चाहिए।
- `[1-9]`: पहला अक्षर 1, 2, 3, 4, 5, 6, 7, 8, या 9 में से ही एक होना चाहिए (यानी 0, माइनस या अक्षर नहीं चलेंगे)।
- `\d*`: उसके बाद 0 से 9 तक का कोई भी अंक जितनी बार चाहे आ सकता है।
- `$`: स्ट्रिंग यहीं खत्म होनी चाहिए (पीछे कोई एबीसीडी नहीं हो सकती)।
