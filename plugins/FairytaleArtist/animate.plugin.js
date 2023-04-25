(function() {
    //==================== Init =============================
    const GITHUB_PAGE = "TBA"
    const VERSION = "1.5";
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
    document.getElementById('editor-inputs-init-image').insertAdjacentHTML('beforeend', `
        <label for="video-file-selector" style="display: block;">Extract Images from Video</label>
        <button id="upload-video-btn" type="button" class="btn btn-primary" style="display: block; margin: 8px; padding: 4px 16px 4px 16px;"><i class="fa fa-photo-film"></i> Browse<input type="file" id="video-file-selector" accept="video/*" style="display:none;"></button>
        <div id="video-frame-wrapper" style="position: relative; width: fit-content; max-height: 150px; margin-bottom: 8px; display:none;">
            <img id="extracted-image-frame" alt="Latest Frame" style="max-width: 100%; max-height: 150px;">
            <button class="video-clear-btn image_clear_btn"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div style="display: flex;">
            <button id="${ID_PREFIX}-animateButton">Animate</button>
            <button id="stop-extraction" class="secondaryButton stopTask" style="margin-left: 6px; display: none;" disabled>Stop Extraction</button>
        </div>
        <div id="${ID_PREFIX}-fps" style="margin: 8px 0 0 16px; display: none;">
            <small>Frames Per Second</small><input type="number" id="extract-fps" min="0.1" value="5">
        </div>
        <div style="margin: 8px 0 0 16px;">
            <small>Max queue size while Animating (0 = unlimited):</small><input id="max_animate_queue_size" name="max_animate_queue_size" value="0" size="4" onkeypress="preventNonNumericalInput(event)">
        </div>
        <video id="video-player" style="display:none;"></video>
        <canvas id="video-canvas" style="display:none;"></canvas>
    `);
    const animateButton = document.getElementById(`${ID_PREFIX}-animateButton`);
    const animateFps = document.getElementById(`${ID_PREFIX}-fps`);
    const frameWrapper = document.getElementById(`video-frame-wrapper`);
    const clearButton = document.querySelector('button.video-clear-btn');

    const maxAnimateQueueSize = document.getElementById("max_animate_queue_size")
    maxAnimateQueueSize.addEventListener('input', (e) => {
        localStorage.setItem('max_animate_queue_size', maxAnimateQueueSize.value)
    })
    maxAnimateQueueSize.value = localStorage.getItem('max_animate_queue_size') >= '0' ? localStorage.getItem('max_animate_queue_size') : '0'
    
    /* Video frame extractor */
    const fileSelector = document.getElementById('upload-video-btn');
    const fpsInput = document.getElementById('extract-fps');
    const stopExtractionButton = document.getElementById('stop-extraction');
    const video = document.getElementById('video-player');
    const canvas = document.getElementById('video-canvas');
    const frame = document.getElementById('extracted-image-frame');
    let extractionInProgress = false;
    
    fileSelector.addEventListener('click', function() {
        document.getElementById('video-file-selector').click();
    });
    
    document.getElementById('video-file-selector').addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const fileURL = URL.createObjectURL(e.target.files[0]);
            video.src = fileURL;
            video.onloadedmetadata = () => {
                displayNthFrame(3);
                animateFps.style.display = "block";
                frameWrapper.style.display = "block"                
                setImageDimensions(video.videoWidth, video.videoHeight);
                promptStrengthContainer.style.display = 'table-row'
                if (!testDiffusers.checked) {
                    samplerSelectionContainer.style.display = "none"
                }
            };
        }
    });
    
    fpsInput.addEventListener('input', () => {
        displayNthFrame(3);
    });

    function setImageDimensions(width, height) {
        // Calculate the maximum cropped dimensions
        const maxCroppedWidth = Math.floor(width / 64) * 64;
        const maxCroppedHeight = Math.floor(height / 64) * 64;

        // Calculate the x and y coordinates to center the cropped image
        const x = (maxCroppedWidth - width) / 2;
        const y = (maxCroppedHeight - height) / 2;

        // Get the options from widthField and heightField
        const widthOptions = Array.from(widthField.options).map(option => parseInt(option.value));
        const heightOptions = Array.from(heightField.options).map(option => parseInt(option.value));

        // Find the closest aspect ratio and closest to original dimensions
        let bestWidth = widthOptions[0];
        let bestHeight = heightOptions[0];
        let minDifference = Math.abs(maxCroppedWidth / maxCroppedHeight - bestWidth / bestHeight);
        let minDistance = Math.abs(maxCroppedWidth - bestWidth) + Math.abs(maxCroppedHeight - bestHeight);

        for (const width of widthOptions) {
            for (const height of heightOptions) {
                const difference = Math.abs(maxCroppedWidth / maxCroppedHeight - width / height);
                const distance = Math.abs(maxCroppedWidth - width) + Math.abs(maxCroppedHeight - height);

                if (difference < minDifference || (difference === minDifference && distance < minDistance)) {
                    minDifference = difference;
                    minDistance = distance;
                    bestWidth = width;
                    bestHeight = height;
                }
            }
        }

        // Set the width and height to the closest aspect ratio and closest to original dimensions
        widthField.value = bestWidth;
        heightField.value = bestHeight;
    }

    function displayNthFrame(n) {
        const desiredFPS = parseFloat(fpsInput.value);
        const frameIndex = n - 1; // first frame is index 0
        const timeToSeek = frameIndex / desiredFPS;
        video.currentTime = timeToSeek;
        video.addEventListener('seeked', () => {
            captureFrame(video);
        }, { once: true });
    }
    
    stopExtractionButton.addEventListener('click', () => {
        extractionInProgress = false;
        animateButton.disabled = false;
        stopExtractionButton.style.display = 'none';
        stopExtractionButton.disabled = true;
    });

    clearButton.addEventListener('click', () => {
        stopExtractionButton.dispatchEvent(new Event('click'));
        animateFps.style.display = "none";
        frameWrapper.style.display = "none";
        promptStrengthContainer.style.display = 'none'
        if (!testDiffusers.checked) {
            samplerSelectionContainer.style.display = ""
        }
        
        // Unload the video
        URL.revokeObjectURL(video.src);
        video.removeAttribute('src');
        video.load();
    
        // Clear the input file
        document.getElementById('video-file-selector').value = null;
    });

    function extractImagesFromVideo(video, interval) {
        if (!video || !interval) return;
        video.currentTime = 0;
    
        const captureImage = () => {
            if (video.currentTime >= video.duration || !extractionInProgress) {
                extractionInProgress = false;
                animateButton.disabled = false;
                stopExtractionButton.style.display = 'none';
                stopExtractionButton.disabled = true;
                return;
            }
            video.addEventListener('seeked', () => {
                captureFrame(video);
                video.currentTime += interval;
                captureImage();
            }, { once: true });
        };
    
        captureImage();
    }

    function captureFrame(video) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        frame.src = canvas.toDataURL('image/jpeg');
        if (extractionInProgress) {
            const taskTemplate = getCurrentUserRequest()

            // overrides
            taskTemplate.numOutputsTotal = 1
            taskTemplate.batchCount = 1
            taskTemplate.reqBody.num_outputs = 1
            taskTemplate.reqBody.init_image = frame.src

            // create the tasks
            const newTaskRequests = getPrompts().map((prompt) => Object.assign({}, taskTemplate, {
                reqBody: Object.assign({ prompt: prompt }, taskTemplate.reqBody)
            }))
            newTaskRequests.forEach(createTask)
            
            updateInitialText()
        }
    }


    //==================== Listeners =============================
    /**
     Add all images as tasks
    **/
    let removeExtraTasksInterval
    animateButton.addEventListener('click',function(evnt){	
        // start the auto task cleanup
        task_count_limit = maxAnimateQueueSize.value > '0' ? maxAnimateQueueSize.value : 0
        removeExtraTasksInterval = setInterval(removeExtraTasks, task_removal_frequency);

        if (frameWrapper.style.display === "none") {
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
        }
        else
        {
            // extract frames from video
            const desiredFPS = parseFloat(fpsInput.value);
            const interval = 1 / desiredFPS;
            extractionInProgress = true;
            animateButton.disabled = true;
            stopExtractionButton.style.display = 'block';
            stopExtractionButton.disabled = false;
            extractImagesFromVideo(video, interval);
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
