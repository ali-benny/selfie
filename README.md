# Progetto per il corso di Tecnlogie Web
dir macchine di lab: `/home/web/site232433/html/` che equivale a https://site232433.tw.cs.unibo.it

1. `git pull origin`
2. `npm run build`
3. ``

per accedere al gocker:

```bash
ssh gocker.cs.unibo.it
```

dalla shell di gocker:

1. per fare partire node

```bash
start node-20 site232433 index.js
```

2. per deployare il sito

```bash
start static site232433
```

3. per fare partire mongodb

```bash
start mongo site232433
```

## Deploy
usare lo script `build&deploy.py`, in seguito connettersi alla macchina, accedere al gocker e restartarlo.

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
