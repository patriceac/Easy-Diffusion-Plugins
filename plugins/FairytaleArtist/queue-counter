(function () {
    //==================== Init =============================
    const VERSION = "1.1";
    const ID_PREFIX = "Queue-Counter-plugin";
    console.log('%s Version: %s', ID_PREFIX, VERSION);

    const title = document.title;
    SD.addEventListener('statusChange', setTitleStatus);

    function setTitleStatus(event) {
        //event.message = event.message + (event.message.endsWith('..') ? '.' : '')
        if (event.message.endsWith('..')) {
            event.message = event.message.slice(0, -2)
        }
        switch (event.type) {
            case 'busy':
                if (event.message.startsWith('rendering') || event.message.startsWith('loading')) {
                    let taskCount = 0
                    let imageCount = 0
                    for (const taskEntry of getUncompletedTaskEntries()) {
                        const task = htmlTaskMap.get(taskEntry)
                        if (task) {
                            taskCount += 1
                            const imageCountTotal = (Math.floor(task.numOutputsTotal / task.reqBody.num_outputs) + (task.numOutputsTotal % task.reqBody.num_outputs == 0 ? 0 : 1)) * task.reqBody.num_outputs
                            const imageCountDone = ((task.batchesDone - (taskCount > 1 ? 0 : 1)) * task.reqBody.num_outputs) // batchesDone is initialized at 1 for the first task, but 0 for subsequent tasks, so we need tom compensate here 🤷
                            imageCount += imageCountTotal - imageCountDone
                        }
                    }
                    document.title = `(${imageCount}/${taskCount}) ${title}`
                }
                break
            default:
                document.title = title;
                break
        }
    }
})();
