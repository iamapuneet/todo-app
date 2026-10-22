# 05. कंट्रोलर और बिज़नेस लॉजिक (Controllers & Business Logic)

---

## 1. `src/controllers/todo.controller.js` का अवलोकन

कंट्रोलर हमारे एप्लिकेशन का **प्रबंधक (Orchestrator)** होता है। इसका काम है:
1. रूट से आने वाले डेटा को प्राप्त करना।
2. ID और इनपुट को साफ़ और सुरक्षित करना (`parseId`, `trim`).
3. वैलिडेटर से इनपुट की जांच करवाना।
4. मॉडल को बोलकर डेटाबेस में बदलाव करवाना।
5. एक सुव्यवस्थित JSON रिस्पांस (`api-response.js`) क्लाइंट को लौटाना।

यहाँ [`src/controllers/todo.controller.js`](file:///d:/node_project/todo-app/src/controllers/todo.controller.js) का पूरा कोड है:

```javascript
import * as Todo from "../models/todo.model.js";
import * as response from "../utils/api-response.js";
import * as validator from "../validators/todo.validator.js";

const parseId = (value) => {
  if (!/^[1-9]\d*$/.test(value)) return null;

  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
};

export const createTodo = async (req, res) => {
  const validationError = validator.validateCreateTodo(req.body);

  if (validationError) {
    return response.error(res, validationError);
  }

  const todo = await Todo.create({
    title: req.body.title.trim(),
    description: req.body.description,
    status: req.body.status,
  });

  return response.success(res, "Todo created successfully.", todo, 201);
};

export const getTodos = async (req, res) => {
  const todos = await Todo.findAll();

  return response.success(res, "Todos fetched successfully.", todos);
};

export const getTodoById = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) return response.error(res, "Invalid todo ID.");

  const todo = await Todo.findById(id);

  if (!todo) return response.error(res, "Todo not found.", 404);

  return response.success(res, "Todo fetched successfully.", todo);
};

export const updateTodo = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) return response.error(res, "Invalid todo ID.");

  const validationError = validator.validateUpdateTodo(req.body);

  if (validationError) {
    return response.error(res, validationError);
  }

  const existing = await Todo.findById(id);

  if (!existing) return response.error(res, "Todo not found.", 404);

  const fields = { ...req.body };

  if (typeof fields.title === "string") {
    fields.title = fields.title.trim();
  }

  const todo = await Todo.update(id, fields);

  return response.success(res, "Todo updated successfully.", todo);
};

export const updateTodoStatus = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) return response.error(res, "Invalid todo ID.");

  if (
    typeof req.body.status !== "string" ||
    !["pending", "in_progress", "completed"].includes(req.body.status)
  ) {
    return response.error(res, "Invalid todo status.");
  }

  const existing = await Todo.findById(id);

  if (!existing) return response.error(res, "Todo not found.", 404);

  const todo = await Todo.update(id, { status: req.body.status });

  return response.success(res, "Todo status updated successfully.", todo);
};

export const deleteTodo = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) return response.error(res, "Invalid todo ID.");

  const deleted = await Todo.remove(id);

  if (!deleted) return response.error(res, "Todo not found.", 404);

  return response.success(res, "Todo deleted successfully.", { id });
};
```

---

## 2. रियल-लाइफ एनालॉजी: बैंक का कैशियर (Bank Teller)

- ग्राहक काउंटर पर आता है: "मुझे खाता नंबर `xyz` से पैसे निकालने हैं।"
- **`parseId`**: कैशियर पर्ची देखता है। अगर खाता नंबर में एबीसीडी लिखी है या माइनस लगा है, तो वह पर्ची तुरंत लौटा देता है।
- **मौजूदगी की जांच (`existing`)**: कैशियर कंप्यूटर में देखता है कि क्या ऐसा कोई खाता सच में बैंक में है? अगर नहीं है, तो कहता है "खाता नहीं मिला" (404 Not Found)।
- **ट्रांजेक्शन**: अगर सब ठीक है, तो तिजोरी (`Model`) से पैसे निकालता है।
- **रसीद (`api-response.js`)**: ग्राहक को एक सुंदर प्रिंटेड रसीद देता है जिसमें सफलता का संदेश और नया बैलेंस लिखा होता है।

---

## 3. `parseId` फंक्शन का जादू (सीनियर लेवल सिक्योरिटी)

यह कोड इंटरव्यूअर्स को बहुत पसंद आता है क्योंकि साधारण डेवलपर्स सिर्फ `parseInt(req.params.id)` लिख देते हैं।

```javascript
const parseId = (value) => {
  if (!/^[1-9]\d*$/.test(value)) return null;

  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
};
```

### `parseInt` में क्या बुराई है?
- `parseInt("10hacked", 10)` इसका उत्तर `10` दे देता है (स्ट्रिंग के पीछे का कचरा अनदेखा कर देता है)।
- `parseInt("-5", 10)` नेगेटिव नंबर दे देता है, जबकि डाटाबेस की प्राइमरी की कभी नेगेटिव नहीं होती।
- `parseInt("0", 10)` जीरो दे देता है।

### हमारे `parseId` के 2 सुरक्षा घेरे:
1. **रेगुलर एक्सप्रेशन `^[1-9]\d*$`**:
   - `^`: शुरुआत से चेक करो।
   - `[1-9]`: पहला अक्षर 1 से 9 के बीच का अंक होना चाहिए (0, माइनस या अक्षर बंद)।
   - `\d*`: उसके बाद जितने चाहे अंक हो सकते हैं।
   - `$`: अंत तक सिर्फ अंक होने चाहिए। कोई अक्षर या दशमलव नहीं चलेगा।
2. **`Number.isSafeInteger(id)`**:
   - जावास्क्रिप्ट में बहुत बड़े नंबर (जैसे $2^{53}$ से ऊपर) अपनी शुद्धता खो देते हैं। यह चेक सुनिश्चित करता है कि नंबर मेमोरी में सुरक्षित सीमा के अंदर है।

---

## 4. स्टैंडर्ड रिस्पांस लिफाफा (`src/utils/api-response.js`)

```javascript
export const success = (res, message, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const error = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};
```

### इसका क्या फायदा है?
- जब फ्रंटएंड डेवलपर (जैसे React या मोबाइल ऐप टीम) इस API को कॉल करते हैं, तो उन्हें हमेशा पता होता है कि `response.data.success` को चेक करना है।
- रिस्पांस का स्ट्रक्चर कभी बदलता नहीं, जिससे फ्रंटएंड में कभी `TypeError: undefined` का क्रैश नहीं आता।

---

## 5. कंट्रोलर में `return` कीवर्ड क्यों जरूरी है?

ध्यान दीजिए कि हर कंट्रोलर में `return response.success(...)` लिखा गया है।
- **अगर `return` न लिखें तो क्या होगा?**: `res.json()` क्लाइंट को डेटा भेज देता है, लेकिन वह जावास्क्रिप्ट के फंक्शन को रोकता नहीं है! अगर नीचे कोई और कोड है, तो वह भी चलने लगेगा और दोबारा रिस्पांस भेजने की कोशिश करेगा। जिससे Node.js क्रैश हो जाएगा: `ERR_HTTP_HEADERS_SENT`.
- `return` लिखने से फंक्शन उसी समय वहीं का वहीं खत्म हो जाता है।

---

## 6. इंटरव्यू प्रश्न और उत्तर (Q&A)

### प्र. 1: क्या कंट्रोलर में सीधे SQL क्वेरी लिखनी चाहिए?
> **उत्तर**: कभी नहीं। कंट्रोलर में सीधे SQL क्वेरी लिखना 'एंटी-पैटर्न' माना जाता है। इससे कोड गंदा हो जाता है और टेस्टिंग मुश्किल हो जाती है। कंट्रोलर का काम सिर्फ रिक्वेस्ट को संभालना और मॉडल को कॉल करना है। SQL से जुड़ी सारी बातें मॉडल लेयर (`todo.model.js`) में ही होनी चाहिए।

### प्र. 2: `updateTodo` में `const fields = { ...req.body };` (स्प्रेड ऑपरेटर) क्यों किया गया?
> **उत्तर**: इसे 'शैलो कॉपी (Shallow Copy)' कहते हैं। इससे हम ओरिजिनल `req.body` को बदले बिना उसकी एक नई कॉपी बना लेते हैं। इसके बाद जब हम `fields.title.trim()` करते हैं, तो कोई साइड-इफ़ेक्ट नहीं होता।
