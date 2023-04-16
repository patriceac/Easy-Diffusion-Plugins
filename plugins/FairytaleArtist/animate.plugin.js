(function() {
    //==================== Init =============================
    const GITHUB_PAGE = "TBA"
    const VERSION = "1.4";
    const ID_PREFIX = "animate-plugin";
    const GITHUB_ID = "T"
    console.log('%s Version: %s', ID_PREFIX, VERSION);

    let file_list = [];
    let fileRead = [];
    let reader = new FileReader()
    let file_input = document.getElementById('init_image');
    file_input.multiple = true; // enables the browse file to load multiple images

    let task_count_limit;
    const task_removal_frequency = 5000; // how often to check if we have to many images

    const editorInputs = document.getElementById("editor-inputs");
    const animateButton = document.createElement('button');
    animateButton.id = `${ID_PREFIX}-animateButton`;
    animateButton.innerHTML = "Animate";
    editorInputs.appendChild(animateButton);
    animateButton.insertAdjacentHTML('afterend', '<br /><small>Max queue size while Animating (0 = unlimited):</small> <input id="max_animate_queue_size" name="max_animate_queue_size" value="0" size="4" onkeypress="preventNonNumericalInput(event)">');

    const maxAnimateQueueSize = document.getElementById("max_animate_queue_size")
    maxAnimateQueueSize.addEventListener('input', (e) => {
        localStorage.setItem('max_animate_queue_size', maxAnimateQueueSize.value)
    })
    maxAnimateQueueSize.value = localStorage.getItem('max_animate_queue_size') >= '0' ? localStorage.getItem('max_animate_queue_size') : '0'

    //==================== Listeners =============================
    /**
     Add all images as tasks
    **/
    let removeExtraTasksInterval
    animateButton.addEventListener('click',function(evnt){	
        // start the auto task cleanup
        task_count_limit = maxAnimateQueueSize.value > '0' ? maxAnimateQueueSize.value : 0
        removeExtraTasksInterval = setInterval(removeExtraTasks, task_removal_frequency);

        // queue the tasks
        for(let i = 0; i < fileRead.length; i++ ){
            if (typeof performance == "object" && performance.mark) {
                performance.mark('click-makeImage')
            }
            
            if (!SD.isServerAvailable()) {
                alert('The server is not available.')
                return
            }
            if (!randomSeedField.checked && seedField.value == '') {
                alert('The "Seed" field must not be empty.')
                return
            }
            if (numInferenceStepsField.value == '') {
                alert('The "Inference Steps" field must not be empty.')
                return
            }
            if (numOutputsTotalField.value == '' || numOutputsTotalField.value == 0) {
                numOutputsTotalField.value = 1
            }
            if (numOutputsParallelField.value == '' || numOutputsParallelField.value == 0) {
                numOutputsParallelField.value = 1
            }
            if (guidanceScaleField.value == '') {
                guidanceScaleField.value = guidanceScaleSlider.value / 10
            }
            const taskTemplate = getCurrentUserRequest()

            // overrides
            //taskTemplate.numOutputsTotal = 1
            //taskTemplate.batchCount = 1
            //taskTemplate.reqBody.num_outputs = 1
            taskTemplate.reqBody.init_image = fileRead[i]

            // create the tasks
            const newTaskRequests = getPrompts().map((prompt) => Object.assign({}, taskTemplate, {
                reqBody: Object.assign({ prompt: prompt }, taskTemplate.reqBody)
            }))
            newTaskRequests.forEach(createTask)
            
            updateInitialText()
        }
    });

    file_input.addEventListener('change',function(evnt){
        file_list = [];
        fileRead = [];
        for( let i = 0; i < file_input.files.length; i++ ){
            let file = file_input.files[i];
            file_list.push(file);
            //console.log(file);
        }
        animateButton.innerHTML = "Animate (" + file_input.files.length + " images)"; // show the user how many files we loaded

        readFiles();
    })


    //==================== Functions ============================


    function readFiles() {	
       if (file_list.length > 0) { // if we still have files left
           let file = file_list.shift(); // remove first from queue and store in file		
           reader.onloadend = function (loadEvent) { // when finished reading file, call recursive readFiles function
               //console.log(loadEvent.target.result);		   
               fileRead.push(loadEvent.target.result);
               let i = fileRead.length-1;		   
               readFiles();
           }
           reader.readAsDataURL(file);
       } else {
           // finishedReadingFiles() // no more files to read
            //console.log(fileRead);	 
       }
    }


    function getVal(id){
        let obj = document.getElementById(id);
        let value = "";
        if (obj.type == "checkbox"){
            value = document.getElementById(id).checked;
        }else{
            value = document.getElementById(id).value;
        }
        //console.log(id + ':' + value);
        return value;
    }

    //Prevents the images and DOM from crashing the browser when processing a large number of images
    function removeExtraTasks(){
        if (task_count_limit <= 0) {
            return            
        }
        try{
            let number_of_tasks =  $("div.taskStatusLabel:hidden").length;
            console.log("number of tasks:", number_of_tasks)
            while (number_of_tasks > task_count_limit) {
                console.log("clicking:", $(".stopTask").last())
                if (processOrder.checked) {
                    // remove first image
                    const matchedElements = $('.imageTaskContainer').filter(function() {
                        return $(this).find('div.taskStatusLabel:hidden').length > 0;
                    }).find('.stopTask');
                    matchedElements?.first().trigger('click');
                }
                else {
                    // remove last image
                    const matchedElements = $('.imageTaskContainer').filter(function() {
                        return $(this).find('div.taskStatusLabel:hidden').length > 0;
                    }).find('.stopTask');
                    matchedElements?.last().trigger('click');
                }
                // update task count
                number_of_tasks =  $("div.taskStatusLabel:hidden").length;
            }
        }catch (e){
            console.log(e);
        }

        // stop the auto task cleanup when the queue is empty
        try{
            let number_of_tasks = $("div.taskStatusLabel:not(:hidden)").length;
            console.log("number of tasks:", number_of_tasks)
            if(number_of_tasks === 0){ 
                console.log("stopping the scheduled cleanup")
                clearInterval(removeExtraTasksInterval);
            }
        }catch (e){
            console.log(e);
        }
    }
})()
