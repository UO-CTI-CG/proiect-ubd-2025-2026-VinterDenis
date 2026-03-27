💰 My Budget Ultimate - Gestiune Financiară Personală

My Budget Ultimate este o aplicație de tip Full-Stack concepută pentru monitorizarea și optimizarea finanțelor personale. Aceasta combină o interfață modernă dezvoltată în React cu un motor de backend robust în Node.js și stocare persistentă în MySQL.

🚀 Funcționalități Cheie

Dashboard Interactiv: Vizualizare rapidă a soldului global, a veniturilor și cheltuielilor lunare prin grafice dinamice (Bar & Doughnut).

Registru Tranzacții: Istoric complet cu funcții de filtrare avansată (lună, an, tip tranzacție) și căutare în timp real.

Managementul Categoriilor: Organizarea banilor pe etichete personalizate preluate direct din baza de date.

Predicții AI (Forecast): Algoritm care analizează media profitului lunar și estimează evoluția soldului pentru următoarele luni.

Smart Advisor: Sistem de recomandări care identifică automat categoriile cu cele mai mari cheltuieli și oferă sfaturi de economisire.

🛠️ Stack Tehnologic

Frontend

React.js (Vite): Pentru o interfață rapidă și reactivă.

React-Bootstrap: Componente UI moderne și design responsiv.

Lucide-React: Iconițe vectoriale profesionale.

Chart.js: Generarea graficelor statistice.

Backend

Node.js & Express.js: Server API RESTful.

MySQL2: Driver pentru comunicarea cu baza de date.

Dotenv: Gestionarea securizată a variabilelor de mediu.

Cors: Permiterea comunicării securizate între porturile de frontend și backend.


🚦 Instalare și Configurare

1. Baza de Date (MySQL)

Deshideți MySQL Workbench.

Creați o bază de date (Schema) numită my_budget.

Importați fișierul database_dump.sql (Server -> Data Import) pentru a crea automat tabelele transactions și categories împreună cu datele de test.

2. Configurarea Backend-ului

Deschideți un terminal în folderul principal (Root).

Instalați dependențele: npm install.

Configurați fișierul .env cu datele locale:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=parola_ta
DB_DATABASE=my_budget
PORT=3000


Porniți serverul: " node server.js ".

3. Configurarea Frontend-ului

Deschideți un al doilea terminal.

Navigați în folderul frontend: cd frontend.

Instalați bibliotecile: npm install.

Porniți interfața: " npm run dev ".

Accesați aplicația la: http://localhost:5173.

🛑 Procedura de Oprire Sigură

Pentru a evita blocarea porturilor sau coruperea datelor, opriți procesele folosind tastatura:

În terminalul de Frontend: Ctrl + C.

În terminalul de Backend: Ctrl + C.

Opriți serviciul MySQL din XAMPP sau Windows Services.