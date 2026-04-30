# Password Simulator

Una piattaforma didattica e interattiva per simulare la forza delle password contro attacchi brute force, completamente modulare e pronta per il cloud.

## Tecnologie utilizzate
- **Frontend:** Vanilla JS (ES Modules), HTML5, CSS3.
- **Build Tool:** Vite.
- **Backend & Auth:** Firebase Authentication.
- **Database:** Firebase Firestore.
- **Hosting:** Firebase Hosting.

## Struttura del Progetto
- `/` - Pagine HTML (Homepage, Login, Register, Dashboard, Admin).
- `/public/css/` - Fogli di stile.
- `/src/` - Logica applicativa divisa per controller (es. `userController.js`, `auth.js`) e utility.
- `/services/` - Moduli per la comunicazione con Firebase Auth e Firestore.
- `/config/` - File di inizializzazione Firebase.

## Setup e Installazione

1. Installa le dipendenze:
   ```bash
   npm install
   ```
2. Configura Firebase in `/config/firebaseConfig.js` inserendo le tue chiavi API.
3. Avvia l'ambiente di sviluppo:
   ```bash
   npm run dev
   ```

## Deploy su Firebase
Il progetto è configurato per compilare in automatico gli asset e servirli da una cartella ottimizzata (`dist`).
1. Esegui il build:
   ```bash
   npm run build
   ```
2. Inizializza Firebase (seleziona Hosting e Firestore):
   ```bash
   firebase init
   ```
3. Fai il deploy:
   ```bash
   firebase deploy
   ```

## Sicurezza e Ruoli (Firestore Rules)
- Ogni utente ha un documento in `users/{uid}` con un campo `ruolo`.
- I dati delle password salvate sono protetti: un utente normale può leggere solo le proprie.
- **Creare il primo Admin:** Dal pannello Firebase Firestore, vai sul documento del tuo utente nella collezione `users` e cambia il valore del campo `ruolo` da `user` a `admin`.
