<script>
let tasks = [
  {
    id: '1',
    name: 'Redesign website',
    start: '2016-12-28',
    end: '2016-12-31',
    progress: 20
  },
  {
	id: '2',
	name: 'Develop website',
	start: '2017-01-01',
	end: '2017-01-15',
	progress: 0
  },
  {
	id: '3',
	name: 'Test website',
	start: '2017-01-16',
	end: '2017-01-20',
	progress: 0
  },
  {
	id: '4',
	name: 'Launch website',
	start: '2017-01-21',
	end: '2017-01-25',
	progress: 0
  }
]
let gantt = new Gantt("#gantt", tasks);
</script>

<template>
  <div id="gantt"></div>
</template>
