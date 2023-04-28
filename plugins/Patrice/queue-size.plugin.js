/*
    Queue Size
    by Patrice

    Shows the count of active tasks and outstanding images in the Easy Diffusion status.
*/
(function() {
    "use strict"

    var styleSheet = document.createElement("style");
    styleSheet.textContent = `
        @media screen and (max-width: 1265px) {
            #server-status {
                top: 30%;
                transform: translateY(-50%);
            }
        }
    `;
    document.head.appendChild(styleSheet);

    const serverStatusMsg2 = serverStatusMsg.cloneNode()
    serverStatusMsg.style.display = 'none'
    serverStatusMsg.after(serverStatusMsg2)
    
    SD.addEventListener('statusChange', setServerStatus2)
    
    function setServerStatus2(event) {
        //event.message = event.message + (event.message.endsWith('..') ? '.' : '')
        if (event.message.endsWith('..')) {
            event.message = event.message.slice(0, -2)
        }
        switch(event.type) {
            case 'online':
                // sometimes the server pretends to be ready while there are still entries to be processed
                if (event.message.startsWith('ready')) {
    				let taskCount = 0
                    let imageCount = 0
                    for (const taskEntry of getUncompletedTaskEntries()) {
                        const task = htmlTaskMap.get(taskEntry)
                        if (task) {
                            taskCount += 1
                            const imageCountTotal = (Math.floor(task.numOutputsTotal / task.reqBody.num_outputs) + (task.numOutputsTotal % task.reqBody.num_outputs ==  0 ? 0 : 1)) * task.reqBody.num_outputs
                            const imageCountDone = ((task.batchesDone - (taskCount > 1 ? 0 : 1)) * task.reqBody.num_outputs) // batchesDone is initialized at 1 for the first task, but 0 for subsequent tasks, so we need to compensate here
                            imageCount += imageCountTotal -  imageCountDone
                        }
                    }
                    if (imageCount > 0) {
                        serverStatusMsg2.style.color = 'rgb(200, 139, 0)'
                        serverStatusMsg2.innerText = `Stable Diffusion is rendering* (${taskCount} active task${taskCount > 1 ? 's' : ''}, ${imageCount} image${imageCount > 1 ? 's' : ''} left)`
                    }
                    else
                    {
                        serverStatusMsg2.style.color = 'green'
                        serverStatusMsg2.innerText = 'Stable Diffusion is ' + event.message
                    }
                }
                else
                {
                    serverStatusMsg2.style.color = 'green'
                    serverStatusMsg2.innerText = 'Stable Diffusion is ' + event.message
                }
                break
            case 'busy':
                serverStatusMsg2.style.color = 'rgb(200, 139, 0)'
                if (event.message.startsWith('rendering')) {
    				let taskCount = 0
                    let imageCount = 0
                    for (const taskEntry of getUncompletedTaskEntries()) {
                        const task = htmlTaskMap.get(taskEntry)
                        if (task) {
                            taskCount += 1
                            const imageCountTotal = (Math.floor(task.numOutputsTotal / task.reqBody.num_outputs) + (task.numOutputsTotal % task.reqBody.num_outputs ==  0 ? 0 : 1)) * task.reqBody.num_outputs
                            const imageCountDone = ((task.batchesDone - (taskCount > 1 ? 0 : 1)) * task.reqBody.num_outputs) // batchesDone is initialized at 1 for the first task, but 0 for subsequent tasks, so we need to compensate here
                            imageCount += imageCountTotal -  imageCountDone
                        }
                    }
                    serverStatusMsg2.innerText = `Stable Diffusion is ${event.message} (${taskCount} active task${taskCount > 1 ? 's' : ''}, ${imageCount} image${imageCount > 1 ? 's' : ''} left)`
                }
                else
                {
                    serverStatusMsg2.innerText = 'Stable Diffusion is ' + event.message
                }
                break
            case 'error':
                serverStatusMsg2.style.color = 'red'
                serverStatusMsg2.innerText = 'Stable Diffusion has stopped'
                break
        }
    }
})()
