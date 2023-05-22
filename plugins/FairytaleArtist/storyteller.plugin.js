(function() {
//==================== Init =============================
const GITHUB_PAGE = "TBA"
const VERSION = "0.4";
const GITHUB_ID = "TBA"
const ID_PREFIX = "storyteller-plugin";
console.log('%s Version: %s', ID_PREFIX, VERSION);

const style = document.createElement('style');
style.textContent = `
  #storyteller-container {
    background: var(--background-color2);
    border: 1px solid var(--background-color3);
    border-radius: 7px;
    padding: 0px 5px 5px 5px;
    margin: 0px 5px;
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.15), 0 6px 20px 0 rgba(0, 0, 0, 0.15);
    width: 220px;
	min-height: 50px;
    max-height: 500px;
	position:fixed;
	right:0;
	overflow-y:scroll;
	z-index:1;
  }
  
  #storyteller-items-container{
	padding-top:40px;
  }
  
  .storyteller-item:first{
	margin-top:20px;
  }
  
  .storyteller-item{
	margin:10px auto;
	display:block;
  }
  .storyteller-header{
	  width:195px;
	  background:var(--background-color2);
	  position:fixed;
	  display:block;
	  z-index:2;
  }
  .storyteller-title{
	margin-bottom:5px;
  }
  .storyteller-save-button{
	position:relative;
	float:right;	
	margin-right:25px;
  }
  .storyteller-remove-button{
	position:relative;
	float:right;
	margin-right:5px;
  }
  
   .storyteller-save-all-button{
		float:left;
		display:block;
   }
   .storyteller-remove-all-button{
	   float:right;
	   display:block;
   }   
`;

document.head.append(style);
	const storytellerContainer = document.createElement('div');
    storytellerContainer.id = "storyteller-container";
	storytellerContainer.innerHTML = "<div class='storyteller-header'><div class='storyteller-title'>Story Teller</div><button class='storyteller-save-all-button' onclick='downloadAllImages()'>Save All</button><button class='storyteller-remove-all-button' onclick='removeAllImages()'>Remove All</button></div><div id='storyteller-items-container'/>";
    $("#tab-content-wrapper").prepend(storytellerContainer);	
})();

function downloadAllImages() {
$('#storyteller-items-container button:contains("Save")').each(function(){$(this).click()})	
}

function removeAllImages() {
$('#storyteller-items-container button:contains("x")').each(function(){$(this).click()})	
}

function downloadImage(item,img_src) {
	const name = 'image' + $(item.parentElement).index() + '.png';
	const blob = dataURItoBlob(img_src)
	saveAs(blob, name)  
}

PLUGINS['IMAGE_INFO_BUTTONS'].push({
	text: 'Add to Storyteller',
	on_click: function(origRequest, img) {
		var aspectRatio = origRequest.width/origRequest.height;
		var width = 180;
		var height =  180/aspectRatio;
		$("#storyteller-items-container").append(`
			<div class="storyteller-item" style="width:${width}px;height:${height}px;">
				<canvas class='storyteller-item-canvas' width='${width}px' height='${height}px'></canvas>
				<button class='storyteller-save-button' onclick='downloadImage(this,"${img.src}");' style='margin-top:-${height}px;'>Save</button>
				<button class='storyteller-remove-button' onclick='this.parentElement.remove()' style='margin-top:-${height}px;'>x</button>				
			</div>
		` );
		var design = img.src;
		var canvas = $(".storyteller-item-canvas")[$(".storyteller-item").length-1];
		var a = $(".storyteller-item-canvas")[$(".storyteller-item").length-1];
		var ctx = canvas.getContext("2d");
		var multiplier = (origRequest.use_upscale) ? 4 : 1; // accommodate images that where upscaled 4 times
		ctx.drawImage(img, 0, 0,img.width * multiplier,img.height * multiplier,0,0,width,height);		
	},
})
//TODO: Add Captions with Background at bottom of screen
//var c = item.previousElementSibling.getContext("2d");
//c.font = "40pt Calibri";
//c.fillText("My TEXT!", 20, 20);
//TODO: Add Ability to Style Captions and Background
//TODO: Render/Save images