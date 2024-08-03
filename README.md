Progetto per il corso di Tecnlogie Web

dir macchine di lab: `/home/web/site232433/html/` che equivale a https://site232433.tw.cs.unibo.it

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
```bash
npm install
```
```bash
npm run format
```
```bash
npm run dev
```

## File System
### `backend` directory
Qui verranno contentuti tutti i file lato server da fare runnare in parallelo.

### `src` directory
Tutto il progetto vue, dunque tutto il lato frontend.

### `dist, public, scripts, tpl` directory
Questi sono "rimasugli" del prof, ovvero i file iniziali che sono forniti all'inizializzazione dello spazio web.

Tra questi incluso anche i file `index.js`e `index.html` posto esternamente a tutte le dir.