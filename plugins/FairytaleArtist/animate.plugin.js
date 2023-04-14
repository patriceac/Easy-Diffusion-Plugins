(function() {
//==================== Init =============================
const GITHUB_PAGE = "TBA"
const VERSION = "1.2";
const ID_PREFIX = "animate-plugin";
const GITHUB_ID = "T"
console.log('%s Version: %s', ID_PREFIX, VERSION);

let file_list = [];
let fileRead = [];
let reader = new FileReader()
let file_input = document.getElementById('init_image');
file_input.multiple = true; // enables the browse file to load multiple images

const task_count_limit = 30; // reduce this if SD UI crashes after X amount of images
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
animateButton.addEventListener('click',function(evnt){	
	let origRequest = getCurrentUserRequest().reqBody;

	// start the auto task cleanup
	const removeExtraTasksInterval = setInterval(removeExtraTasks, task_removal_frequency);
    
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
    
	// stop the auto task cleanup
	clearInterval(removeExtraTasksInterval);
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
		if(number_of_tasks > task_count_limit){ 
			$(".stopTask").last().click();//remove image
		}
	}catch (e){
		console.log(e);
	}
}

})()
