# Projets multidisciplinaires — front

Interface web de la répartition des projets multidisciplinaires (HEIG-VD) :
Vue 3, Vite, Vuetify 3, Pinia, vue-router 4, axios, keycloak-js, Quill 2.

## Commandes

```
npm ci              # installation (package-lock.json)
npm run dev         # serveur de développement http://localhost:8081, /api relayé vers http://localhost:8080
npm run build       # build de production : dist/index.html + dist/assets/
npm run build:dev   # build en mode développement (sans Keycloak)
npm run lint        # ESLint (flat config, eslint-plugin-vue)
```

Le Dockerfile du backend lance `npm run build` puis copie `dist/` dans `public/` de Laravel ;
toute URL hors `/api` y est servie par `index.html` (routes en mode history).

## Configuration

- `.env` : Keycloak (`VITE_CLOAK_URL`, `VITE_CLOAK_REALM`, `VITE_CLOAK_CLIENT_ID`) et base de l'API (`VITE_API_BASE_URL=/api`).
- `.env.development` : `VITE_DEV_AUTH=true`, pas de Keycloak. Le backend local (APP_ENV=local, APP_DEBUG=true)
  connecte l'utilisateur `ID_USER`, ou celui choisi dans le menu « Dev » de la barre d'app
  (header `X-Dev-User`, mémorisé dans `localStorage.devUser`).
- `VITE_PROXY_TARGET` (optionnel) : backend utilisé par `npm run dev`.

## Organisation

- `src/stores` : état Pinia (session et phase, projets, choix de l'étudiant, données du responsable, notifications).
- `src/views` : écrans (projets, mes choix / mes projets, formulaire, répartition, sélection, statistiques, réglages).
- `src/components/editor` : éditeur Quill 2 compatible avec les descriptions Quill 1 existantes
  (largeur et alignement des images), réduction des images insérées (1600 px, JPEG 0,85) et redimensionnement.
