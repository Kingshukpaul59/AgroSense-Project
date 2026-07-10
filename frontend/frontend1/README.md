<<<<<<< HEAD
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
=======
# AgroSense-Project
<!-- 🌾 TITLE -->
<h1 align="center">🌾 AgroSense</h1>
<h3 align="center">Intelligent Pre-Harvest Advisory Platform</h3>

<p align="center">
AI-powered platform for crop yield prediction, demand forecasting, and smart farming decisions.
</p>

<hr/>

<!-- 🚀 DEMO -->
<h2>🚀 Demo</h2>

<ul>
  
  <li><b>🎥 Demo Video:</b> <a href="#">https://youtu.be/tmMoZmrHL40?si=a_lPxjc4zQN9Nt6z</a></li>
</ul>

<hr/>

<!-- 📌 PROBLEM -->
<h2>📌 Problem Statement</h2>

<p>
Farmers face uncertainty due to unpredictable weather, fluctuating market demand, 
and lack of data-driven insights. This often leads to poor crop planning and financial losses.
</p>

<hr/>

<!-- 💡 SOLUTION -->
<h2>💡 Solution</h2>

<p>
AgroSense provides an AI-powered system that helps farmers make informed decisions by combining:
</p>

<ul>
  <li>🌱 Crop yield prediction</li>
  <li>📈 Demand forecasting</li>
  <li>🌦️ Weather insights</li>
  <li>🧠 Smart advisory system</li>
</ul>

<hr/>

<!-- ✨ FEATURES -->
<h2>✨ Features</h2>

<ul>
  <li>🌱 <b>Yield Prediction</b> using XGBoost</li>
  <li>📈 <b>Demand Forecasting</b> using LSTM</li>
  <li>🌦️ <b>Weather Integration</b></li>
  <li>📊 <b>Interactive Dashboard</b></li>
  <li>📱 <b>Mobile Application (Flutter)</b></li>
</ul>

<hr/>

<!-- 🛠️ TECH STACK -->
<h2>🛠️ Tech Stack</h2>

<table>
<tr>
  <th>Layer</th>
  <th>Technologies</th>
</tr>
<tr>
  <td>Backend</td>
  <td>FastAPI, PostgreSQL, Redis, Celery</td>
</tr>
<tr>
  <td>Machine Learning</td>
  <td>XGBoost, PyTorch, Scikit-learn, MLflow</td>
</tr>
<tr>
  <td>Frontend</td>
  <td>React, Tailwind CSS, Chart.js, Leaflet</td>
</tr>
<tr>
  <td>Mobile</td>
  <td>Flutter</td>
</tr>
<tr>
  <td>DevOps</td>
  <td>Docker, GitHub Actions</td>
</tr>
</table>

<hr/>

<!-- 📂 STRUCTURE -->
<h2>📂 Project Structure</h2>

<pre>
AgroSense/
│
├── backend/
├── ml/
├── frontend/
├── mobile/
├── data/
├── infra/
└── docs/
</pre>

<hr/>

<!-- ⚙️ SETUP -->
<h2>⚙️ Setup Instructions</h2>

<h3>1️⃣ Clone Repository</h3>

<pre>
git clone https://github.com/Kingshukpaul59/AgroSense-Project.git
cd AgroSense-Project
</pre>

<h3>2️⃣ Backend Setup</h3>

<pre>
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
</pre>

<p>API: http://localhost:8000</p>

<h3>3️⃣ Frontend Setup</h3>

<pre>
cd frontend
npm install
npm run dev
</pre>

<p>Frontend: http://localhost:5173</p>

<hr/>

<!-- 📸 SCREENSHOTS -->
<h2>📸 Screenshots</h2>



<!-- 🎯 HIGHLIGHTS -->
<h2>🎯 Highlights</h2>

<ul>
  <li>✅ Full-stack + AI integrated project</li>
  <li>✅ Real-time data processing</li>
  <li>✅ Scalable architecture using Docker</li>
</ul>

<hr/>

<!-- 📬 CONTACT -->
<h2>📬 Contact</h2>

<p>
<b>Kingshuk Paul</b><br/>
GitHub: <a href="https://github.com/Kingshukpaul59">Kingshukpaul59</a><br/>
LinkedIn: https://www.linkedin.com/in/kingshuk-paul-0a5a56298/
</p>

<hr/>

<!-- ⭐ FOOTER -->
<h3 align="center">🌾 AgroSense — Smarter Farming, Better Harvests</h3>
>>>>>>> 8641458d4fe610580191e6305f675477f0de2b74
