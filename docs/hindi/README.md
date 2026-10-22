# 🚀 Todo App — सम्पूर्ण हिंदी डॉक्यूमेंटेशन पोर्टल (Master Hindi Docs)

नमस्ते! यह **Node.js, Express 5, EJS, और MySQL2 Todo Application** का सबसे विस्तृत, गहन (in-depth), और इंटरव्यू-ओरिएंटेड हिंदी डॉक्यूमेंटेशन सुइट है।

इस डॉक्यूमेंटेशन को खास तौर पर इस तरह लिखा गया है कि अगर आप किसी भी टेक्निकल राउंड या सीनियर बैकएंड इंटरव्यू में बैठें, तो आर्किटेक्चर, कोड फ्लो, हर एक कीवर्ड, डाटाबेस पूलिंग, और सिक्योरिटी से जुड़े हर सवाल का जवाब पूरे आत्मविश्वास और रियल-लाइफ उदाहरणों (Real-life examples) के साथ दे सकें।

---

## 📑 विषय-सूची (Documentation Navigation)

| फ़ाइल का नाम | मुख्य विषय (Topic) | इसमें क्या-क्या कवर किया गया है? |
|---|---|---|
| [01. आर्किटेक्चर और कम्पलीट रिक्वेस्ट फ्लो](file:///d:/node_project/todo-app/docs/hindi/01_architecture_aur_flow.md) | High-Level Architecture & Lifecycle Flow | 3-Tier Layered Architecture, रिक्वेस्ट का पूरा सफर (Mermaid Flowchart), 5-Star रेस्टोरेंट का रियल-लाइफ उदाहरण |
| [02. सर्वर बूटस्ट्रैप और एनवायरनमेंट](file:///d:/node_project/todo-app/docs/hindi/02_server_aur_bootstrap.md) | Server Startup & Lifecycle | `server.js` और `app.js` को अलग क्यों रखा, `dotenv/config`, प्री-फ्लाइट DB चेक (`SELECT 1`), Graceful Shutdown |
| [03. एक्सप्रेस 5 और मिडलवेयर पाइपलाइन](file:///d:/node_project/todo-app/docs/hindi/03_express_aur_middlewares.md) | Express 5.x & Pipeline Internals | मिडलवेयर की चेन, बॉडी पार्सिंग (`express.json()`), 404 हैंडलर, ग्लोबल एरर हैंडलर, `res.headersSent` का राज |
| [04. रूटिंग और REST API डिज़ाइन](file:///d:/node_project/todo-app/docs/hindi/04_routing_aur_rest_api.md) | Routing & HTTP Protocol | REST के सिद्धांत, HTTP मेथड्स (GET, POST, PUT, PATCH, DELETE), PUT vs PATCH का अंतर, Idempotency, HTTP स्टेटस कोड्स |
| [05. कंट्रोलर और बिज़नेस लॉजिक](file:///d:/node_project/todo-app/docs/hindi/05_controllers_aur_business_logic.md) | Business Logic & Handlers | कंट्रोलर का रोल, `parseId` का कमाल (Regex + Safe Integer), इनपुट ट्रिमिंग, स्टैंडर्ड रिस्पांस रैपर (`api-response.js`) |
| [06. मॉडल और डेटाबेस लेयर](file:///d:/node_project/todo-app/docs/hindi/06_models_aur_database_layer.md) | Data Layer & MySQL Engine | Connection Pool (`createPool`) कैसे काम करता है, Prepared Statements (`db.execute`), SQL इंजेक्शन से बचाव, डायनामिक SQL अपडेट |
| [07. वैलिडेशन और वेब सिक्योरिटी](file:///d:/node_project/todo-app/docs/hindi/07_validation_aur_security.md) | Input Validation & Security | Fail-Fast सिद्धांत, Mass Assignment से बचाव (फ़ील्ड व्हाइटलिस्टिंग), Prototype Pollution रोकथाम (`Object.hasOwn`), एरर मास्किंग |
| [08. व्यूज और फ्रंटएंड इंटीग्रेशन](file:///d:/node_project/todo-app/docs/hindi/08_views_aur_frontend_integration.md) | EJS & Client-Side Fetch | EJS टेम्पलेट इंजन, SSR (Server-Side Rendering) vs CSR (Client-Side Rendering), डार्क मोड UI, ब्रॉउज़र Fetch API CRUD |
| [09. कीवर्ड एनसाइक्लोपीडिया](file:///d:/node_project/todo-app/docs/hindi/09_javascript_aur_nodejs_keywords_glossary.md) | JS & Node.js Keywords A-Z | प्रोजेक्ट के हर एक कीवर्ड का पोस्टमार्टम (`async/await`, `const/let`, `??`, `...`, `Object.hasOwn`, Destructuring, Regex, आदि) |
| [10. मास्टर इंटरव्यू प्रश्न और उत्तर](file:///d:/node_project/todo-app/docs/hindi/10_master_interview_qa_hindi.md) | 30+ In-Depth Interview Questions | इंटरव्यू में पूछे जाने वाले सबसे कड़े सवाल, उनके सटीक मॉडल आंसर्स, कोड ट्रैप्स और 10 लाख यूजर्स के लिए स्केलिंग स्ट्रैटेजी |

---

## 🎯 इंटरव्यू की तैयारी कैसे करें?

1. **शुरुआत आर्किटेक्चर से करें**: पहले [01_architecture_aur_flow.md](file:///d:/node_project/todo-app/docs/hindi/01_architecture_aur_flow.md) पढ़ें ताकि आपके दिमाग में रिक्वेस्ट का विज़ुअल मैप बन जाए।
2. **कोड की गहराई को समझें**: फ़ाइल 02 से 08 तक एक-एक फ़ाइल पढ़ें कि कोड का हर हिस्सा क्यों लिखा गया है और अगर वो न हो तो क्या नुकसान होगा।
3. **कीवर्ड्स पर पकड़ बनाएं**: [09_javascript_aur_nodejs_keywords_glossary.md](file:///d:/node_project/todo-app/docs/hindi/09_javascript_aur_nodejs_keywords_glossary.md) से हर कीवर्ड की परिभाषा और उसका रियल लाइफ एनालॉजी याद रखें।
4. **मॉक इंटरव्यू प्रैक्टिस**: [10_master_interview_qa_hindi.md](file:///d:/node_project/todo-app/docs/hindi/10_master_interview_qa_hindi.md) के सवालों को बिना उत्तर देखे खुद से बोलकर समझाने की कोशिश करें।
