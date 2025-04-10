# Progetto per il corso di Tecnlogie Web

dir macchine di lab: `/home/web/site232433/html/` che equivale a https://site232433.tw.cs.unibo.it

## Deploy

NB: è necessario avere già la build del progetto, quindi prima di eseguire lo script o fare git pull è necessario eseguire `npm run build` in locale e pushare le modifiche.

usare lo script `build&deploy.py`, in seguito connettersi alla macchina, accedere al gocker e restartarlo.

Oppure: connettersi alla macchina, entrare nella cartella `html`

1. `git pull origin`

accedere al gocker:

```bash
ssh gocker.cs.unibo.it
```

dalla shell di gocker:

fare partire mongodb

```bash
start mongo site232433
```

1. per fare partire node: ogni modifica fatta lato backend nella cartella server implica un necessario riavvio di node-22

```bash
start node-22 site232433 ./server/app.js
```

2. per deployare il sito

```bash
start static site232433
```

## Deploy locale

runnare server: `node src/api/app.js`

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

## Vue3-Popper

Documentazione davvero completa su: https://github.com/valgeirb/vue3-popper

