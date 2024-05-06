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