# AutoGuide Maroc

Guide d'achat automobile neuve au Maroc. Prix officiels, fiches techniques, comparateur.

## 🚀 Stack Technique

- **Backend** : Node.js + Express + SQLite
- **Frontend** : HTML/CSS/JS Vanilla (SPA)
- **Scraping** : Cheerio + Axios
- **Hébergement** : Render (free tier)

## 📁 Structure

```
wandaloo-clone/
├── backend/
│   ├── data/
│   │   └── autoguide.db       # Base SQLite (auto-générée)
│   ├── server.js               # API Express
│   ├── db.js                   # Couche SQLite
│   ├── scraper.js              # Scraping Wandaloo
│   └── package.json
├── frontend/
│   ├── css/style.css           # Styles premium
│   ├── js/
│   │   ├── config.js           # Config API
│   │   └── app.js              # Logique SPA
│   ├── index.html              # Page d'accueil
│   └── pages/                  # Pages (marques, comparateur, etc.)
├── render.yaml                 # Config déploiement Render
└── README.md
```

## 🏃 Lancer en local

```bash
# 1. Backend
cd backend
npm install
node server.js          # API sur http://localhost:3001

# 2. Scraper les données (optionnel, base déjà peuplée)
node scraper.js         # Scrape 49 marques, 335+ modèles

# 3. Frontend
# Ouvrir frontend/index.html dans un navigateur
# Ou utiliser un serveur local:
cd frontend
npx serve .             # Sur http://localhost:3000
```

## ☁️ Déployer sur Render

### Option 1 : Blueprint (recommandé)

1. Créer un compte sur [render.com](https://render.com)
2. Cliquer **New → Blueprint Instance**
3. Connecter votre repo GitHub
4. Render détecte `render.yaml` et déploie automatiquement

### Option 2 : Manuel

1. **New → Web Service**
2. Connecter le repo
3. Settings :
   - **Runtime** : Node
   - **Build Command** : `cd backend && npm install`
   - **Start Command** : `cd backend && node server.js`
   - **Plan** : Free

## 🔌 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/brands` | Liste des marques (49) |
| `GET /api/brands/:id` | Détail marque + modèles |
| `GET /api/models` | Tous les modèles (335+) |
| `GET /api/models/:id` | Fiche technique |
| `GET /api/categories` | Catégories disponibles |
| `GET /api/carburants` | Types de carburant |
| `GET /api/compare?ids=` | Comparateur |
| `GET /api/health` | Health check |

## 🔧 Filtres API

```
GET /api/models?marque=MG&categorie=SUV&budget_max=300000
GET /api/models?carburant=Électrique
```

## 📊 Données

- **49 marques** disponibles au Maroc
- **335+ modèles** avec prix et specs
- Source : [Wandaloo.com](https://www.wandaloo.com)
- Mise à jour : via `node scraper.js`

## 📝 Licence

Projet open-source. Données issues de sources publiques.
