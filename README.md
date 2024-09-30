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

## File System

### `dist, public, scripts, tpl` directory

Questi sono "rimasugli" del prof, ovvero i file iniziali che sono forniti all'inizializzazione dello spazio web.

Tra questi incluso anche i file `index.js`e `index.html` posto esternamente a tutte le dir.

## Come usare le icone di iconify

```vue
<script>
import { Icon } from '@iconify/vue'
export default {
  components: {
    Icon
  }
}
</script>
```

Per usare l'icona inserire l'elemento del tipo: `<Icon icon="<pack>:<nome_icona>" />`

## come usare e aggiungere un toast:
https://github.com/Maronato/vue-toastification
All'interno del `.vue` in cui si vuole aggiungere il toast mettere:

```vue
<script>
import { useToast } from 'vue-toastification'

const toast = useToast()
</script>
```

Per usarlo: `toast.<type>('<msg>')`
