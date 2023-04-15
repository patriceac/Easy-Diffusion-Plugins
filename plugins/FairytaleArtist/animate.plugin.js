(function() {
    //==================== Init =============================
    const GITHUB_PAGE = "TBA"
    const VERSION = "1.3";
    const ID_PREFIX = "animate-plugin";
    const GITHUB_ID = "T"
    console.log('%s Version: %s', ID_PREFIX, VERSION);

    let file_list = [];
    let fileRead = [];
    let reader = new FileReader()
    let file_input = document.getElementById('init_image');
    file_input.multiple = true; // enables the browse file to load multiple images

    const task_count_limit = 50; // reduce this if SD UI crashes after X amount of images
    const task_removal_frequency = 5000; // how often to check if we have to many images

    const editorInputs = document.getElementById("editor-inputs");
    const animateButton = document.createElement('button');
        animateButton.id = `${ID_PREFIX}-animateButton`;
        animateButton.innerHTML = "Animate";
        editorInputs.appendChild(animateButton);
        
    //==================== Listeners =============================
    /**
     Add all images as tasks
    **/
    let removeExtraTasksInterval
    animateButton.addEventListener('click',function(evnt){	
        let origRequest = getCurrentUserRequest().reqBody;

        // start the auto task cleanup
        removeExtraTasksInterval = setInterval(removeExtraTasks, task_removal_frequency);
        
        for(let i = 0; i < fileRead.length; i++ ){
            let newTaskRequest = getCurrentUserRequest()
                newTaskRequest.reqBody = Object.assign({}, origRequest, {
                init_image: fileRead[i],			
                "prompt":  getVal("prompt"),
                "negative_prompt": getVal("negative_prompt"),
                "num_outputs": 1, // assume user only wants one at a time to evaluate, if selecting one out of a batch
                "numOutputsTotal": 1, // assume user only wants one at a time to evaluate, if selecting one out of a batch
                "batchCount": 1, // assume user only wants one at a time to evaluate, if selecting one out of a batch
            //  "sampler": "ddim",
                seed: getVal("seed")  //Remove or comment-out this line to retain original seed when resizing
              })
              createTask(newTaskRequest)
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
