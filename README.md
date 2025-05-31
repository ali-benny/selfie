# Progetto per il corso di Tecnlogie Web

dir macchine di lab: `/home/web/site232433/html/` che equivale a https://site232433.tw.cs.unibo.it

- [Deploy](#deploy)
- [Deploy manuale](#deploy-manuale)
- [Deploy locale](#deploy-locale)
- [Wiki](#wiki)
	- [Icone by Iconify](#icone-by-iconify)
	- [Toast | Notifiche Push interne:](#toast--notifiche-push-interne)
	- [Gantt Chart - Vue Ganttastic](#gantt-chart---vue-ganttastic)

## Deploy

> è necessario avere un file .env con NODE_ENV=production e un file .env.development con NODE_ENV=development

Quando si fa un push su `main` il server di produzione viene aggiornato automaticamente grazie all'action `deploy.yml` presente nella cartella `.github/workflows`, che fa la build e la manda in produzione sul server.
Il server di produzione è un container docker che gira su `gocker.cs.unibo.it` usa `nodemon-22` dunque non è necessario riavviarlo manualmente.

## Deploy manuale

NB: è necessario avere già la build del progetto, quindi prima di eseguire lo script o fare git pull è necessario eseguire `/usr/local/node/bin/npm run build` in locale e pushare le modifiche.

Usare lo script `build&deploy.py`, in seguito connettersi alla macchina, accedere al gocker e restartarlo.

Oppure: connettersi alla macchina, entrare nella cartella `html`

1. `git pull origin`

accedere al gocker:

```bash
ssh gocker.cs.unibo.it
```

dalla shell di gocker:

fare partire mongodb:

```bash
start mongo site232433
```

fare partire node: ogni modifica fatta lato backend nella cartella server implica un necessario riavvio di node-22

```bash
start node-22 site232433 server/app.js
```

o in alternativa:

```bash
start nodemon-22 site232433 server/app.js
```

Esiste anche questo comando per servire il sito statico, ma non è da fare perché lo serviamo con node-22:

```bash
start static site232433
```

## Deploy locale

runnare server: `node server/app.js` o `npm run backend:dev` che utilizza nodemon per il reload automatico delle modifiche lato backend.

```bash
npm install
```

```bash
npm run format
```

```bash
npm run dev
```

---

# Wiki

## Icone by Iconify

### set usati attualmente:

- fluent
- ic

Per usare l'icona inserire l'elemento del tipo: `<Icon icon="<pack>:<nome_icona>" />`

## Toast | Notifiche Push interne:

docs: https://docs.notivue.smastrom.io
Per usarlo nello `<script>`: `push.<type>('<msg>')`
dove `type` può essere: success/warining/error

Per realizzare cose particolari consiglio di consultare https://docs.notivue.smastrom.io/push-usage/methods.html

## Gantt Chart - Vue Ganttastic
