/**
 * Image Utilities
 * v.1.7, last updated: 28/05/2023
 * By The Stig
 * 
 * 
 *
 * Free to use with the CMDR2 Stable Diffusion UI.
 *  
 */

(function() { "use strict"

	const VERSION = "1.6";
	const ID_PREFIX = "TheStig-Image Utilities";
	console.log('%s The Stig - Image Utilities Version: %s', ID_PREFIX, VERSION);
	
	const style = document.createElement('style');
    style.textContent = `#${ID_PREFIX}-webcamButton {margin-top: 8px;}`;
	
	document.head.append(style);
    const editorInputs = document.getElementById("editor-inputs");

    const buttonsContainer = document.createElement('div');
    buttonsContainer.id = `${ID_PREFIX}-webcamContainer`;
    editorInputs?.appendChild(buttonsContainer);

    //const webcamButton = document.createElement('button');
    //webcamButton.id = `${ID_PREFIX}-webcamButton`;
    //webcamButton.innerHTML = `Webcam`;
    //webcamButton.title = 'Webcam Capture ' + `V${VERSION}`;
    //buttonsContainer.appendChild(webcamButton);
    //webcamButton.addEventListener('click', getStartNewTaskHandler());

	//PLUGINS['IMAGE_INFO_BUTTONS'].push([
	//	{ text: "Download with Meta Data", on_click: onDownloadMeta}
	//])
	
	//PLUGINS['IMAGE_INFO_BUTTONS'].push([
	//	{ text: "Show Info", on_click: onDisplayInfo}
	//])
	
	
	//PLUGINS['IMAGE_INFO_BUTTONS'].push([
		// { html: '<span class="imageadjust-label" style="background-color:transparent;background: rgba(0,0,0,0.5)">Rotate / Flip image</span>', type: 'label', on_click: onImageAdjustClick},
	//	{ html: '<span class="imageadjust-label" style="background-color:transparent;background: rgba(0,0,0,0.5)">Rotate image</span>', type: 'label', on_click: onImageAdjustClick},
	//	{ html: '<i class="fa-solid fa-undo"></i>', on_click: onRotate90CCW},
	//	{ html: '<i class="fa-solid fa-redo"></i>', on_click: onRotate90CW}
		// { html: '<i class="fa-solid fa-arrows-alt-h"></i>', on_click: onFlipHoriz},
		// { html: '<i class="fa-solid fa-arrows-alt-v"></i>', on_click: onFlipVert}
	//])

	//PLUGINS['IMAGE_INFO_BUTTONS'].push([
	//	{ text: "Adjust Hue/Saturation/Luminance", on_click: onAdjHSL}
	//])
	
	var imgUtilsSettings = {
		imgUtils1: 'fa-solid fa-undo', 					// Rotate 90deg CCW
		imgUtils2: 'fa-solid fa-redo', 					// Rotate 90deg CW
		imgUtils3: 'fa-solid fa-puzzle-piece', 			// Tile
		imgUtils4: 'fa-solid fa-mask', 					// Invert Mask
		imgUtils5: 'fa-solid fa-file-export', 			// Download
		imgUtils6: 'fa-solid fa-info-circle	'			// Show Info
	};
		
	PLUGINS['IMAGE_INFO_BUTTONS'].push([
		{ html: '<span class="imageadjust-label" style="background-color:transparent;background: rgba(0,0,0,0.5)">Image Utils:</span>', type: 'label', on_click: onImageAdjustClick},
		{ html: '<i class="' + imgUtilsSettings.imgUtils1 + '"></i>', on_click: onRotate90CCW},
		{ html: '<i class="' + imgUtilsSettings.imgUtils2 + '"></i>', on_click: onRotate90CW},
		{ html: '<i class="' + imgUtilsSettings.imgUtils3 + '"></i>', on_click: onTileImage},
		//{ html: '<i class="' + imgUtilsSettings.imgUtils4 + '"></i>', on_click: onSaveMask},  // onInvertMask
		{ html: '<i class="' + imgUtilsSettings.imgUtils5 + '"></i>', on_click: onDownloadMeta},
		{ html: '<i class="' + imgUtilsSettings.imgUtils6 + '"></i>', on_click: onDisplayInfo}
	])
	
	
	
	

	function buildRequest(options = {}) {
        const newTaskRequest = modifyCurrentRequest(getCurrentUserRequest().reqBody, { //TODO remove getCurrentUserRequest after is fixed upstream.
            session_id: sessionId
        });
		if ('prompt' in options) {
            newTaskRequest.reqBody.prompt = options.prompt;
        } else {
            newTaskRequest.reqBody.prompt = 'Test';
        }
        return newTaskRequest;
    }
	
	function getStartNewTaskHandler() {
        return async function(event) {
            //const options = await showPopup(mode, reqBody);
            //if (options.cancelled) {
            //    return;
            //}
            const options = {};
            const newTaskRequest = buildRequest(options);
            createTask(newTaskRequest);
            initialText.style.display = 'none';
        }
    }
	

	function onDownloadMeta(origRequest, image) {
		//console.log('**Downloading with Meta Data**');
		var dImage = makeImageDrawable(image);  // convert DOM img to canvas
		var ftype=document.getElementById("output_format").value;
		//console.log(image);
		const newImage = document.createElement('img');
		newImage.replaceWith(image);
		newImage.setAttribute("Comments",origRequest);
		newImage.setAttribute("Comments",origRequest);
		//console.log(ftype);
		//console.log(newImage);
		var fname=null;
		var txtname=null;
		const now = new Date();
		const isoDate = now.toISOString();
		const filename = isoDate.replace(/:/g,"");
		const downloadname=filename.replace(/-/g,"");
		const download=downloadname.replace(/T/g,"-");
		//console.log(isoDate);
		//console.log(download);
		//console.log(origRequest);
		switch (ftype) {
			case "jpeg":
				fname="ED" + download.substr(0,15) + "." + ftype;
				txtname="ED" + download.substr(0,15) + ".json";
				break;
			case "png":
				fname="ED" + download.substr(0,15) + "." + ftype;
				txtname="ED" + download.substr(0,15) + ".json";
				break;
			case "gif":
				fname="ED" + download.substr(0,15) + "." + ftype;
				txtname="ED" + download.substr(0,15) + ".json";
				break;
			default:
				alert("Sorry the file type " + ftype + " is not supported.");
				break;
		}
		switch (fname) {
			case null:
				break;
			default:
				//console.log(fname);
				const img = image;
				const canvas = document.createElement("canvas");
				const context = canvas.getContext("2d");
				const ch = img.naturalHeight;
				const cw = img.naturalWidth;
				canvas.width = cw;
				canvas.height = ch;
				context.save();
				context.drawImage(img,0,0);
				context.restore();
				//img.src = canvas.toDataURL(fname);
				let canvasImage = canvas.toDataURL('image/' +ftype);
				//console.log(canvasImage);
				let xhr = new XMLHttpRequest();
				xhr.responseType = 'blob';
				xhr.onload = function () {
					let a = document.createElement('a');
					a.href = window.URL.createObjectURL(xhr.response);
					a.download = fname;
					a.style.display = 'none';
					document.body.appendChild(a);
					a.click();
					a.remove();
				}
				xhr.open('GET', canvasImage); // This is to download the canvas Image
				xhr.send();
				
				let blob = new Blob([JSON.stringify(origRequest,null,2)], { type: 'application/json' });
				// console.log(blob);
				saveAs(blob, txtname);
				
				break;
		}
	}

	function onRotate90CW(origRequest, image) {
		switch (origRequest.showInfoBar) {
			case undefined:
				rotate(image,90);
				break;
			case true:
				alert('Please turn off information before you rotate the image.');
				break;
			case false:
				rotate(image,90);
				break;
			default:
				rotate(image,90);
				break;
		}
				
		//console.log('**Image rotated 90deg Clockwise**');
	}

	function onRotate90CCW(origRequest, image) {
		switch (origRequest.showInfoBar) {
			case undefined:
				rotate(image,-90);
				break;
			case true:
				alert('Please turn off information before you rotate the image.');
				break;
			case false:
				rotate(image,-90);
				break;
			default:
				rotate(image,-90);
		}
			
		//console.log('**Image rotated 90deg Counter Clockwise**');
	}
	

	function onFlipHoriz(origRequest, image) {
		mirror(origRequest,image,0,0,true,false);
		//console.log('*** Image Flipped Horizontally***');
	}

	function onFlipVert(origRequest, image) {
		mirror(origRequest,image,0,0,false,true);
		//console.log('*** Image Flipped Vertically***');
	}

	// function onAdjHSL(origRequest, image) {
	//	console.log('**Adjust HSL**');
	// }

	function onImageAdjustClick(origRequest, image) {
		console.log("**Image Adjust Clicked**");
	}
		
	function rotate(image,angle) {
		if(image.complete){ // ensure the image has loaded
			const img = image;
			const canvas = document.createElement("canvas");
			const context = canvas.getContext("2d");
  
			// Make canvas the same size as img inverted
			var cw = img.naturalHeight;
			var ch = img.naturalWidth;

			canvas.width = cw;
			canvas.height = ch;
			
			// Added Line below 
			context.save();
  
			// Draw rotated img onto canvas
			context.translate(cw / 2, ch / 2);
			context.rotate(angle * Math.PI / 180);
			context.drawImage(img, -ch / 2, -cw / 2, ch, cw);
			
			//Added Line below
			context.restore();
  
			// Replace img with canvas contents
			img.src = canvas.toDataURL();
		}
		//throw new ReferenceError("Image is not complete.");
	}

	function mirror(image, x = 0, y = 0, horizontal = false, vertical = false) {
		if(image.complete){ // ensure the image has loaded
			const img = image;
			const canvas = document.createElement("canvas");
			const context = canvas.getContext("2d");
  
			// Make canvas the same size as img
			var cw = img.naturalWidth;
			var ch = img.naturalHeight;
			
			canvas.width = cw;
			canvas.height = ch;
			
			// Added Line below
			//context.save();
  
			// Draw rotated img onto canvas
			context.setTransform(
				horizontal ? -1 : 1, 0, // set the direction of x axis
				0, vertical ? -1 : 1,   // set the direction of y axis
				x + (horizontal ? image.width : 0), // set the x origin
				y + (vertical ? image.height : 0)   // set the y origin
			);
			context.drawImage(image,0,0);
			
			// Added Line below
			context.setTransform(1,0,0,1,0,0);
			//context.restore();
  
			// Replace img with canvas contents
			img.src = canvas.toDataURL();
		}
		//throw new ReferenceError("Image is not complete.");
	}

	function makeImageDrawable(image){
		if(image.complete){ // ensure the image has loaded
			var dImage = document.createElement("canvas"); // create a drawable image
			dImage.width = image.naturalWidth;      // set the resolution
			dImage.height = image.naturalHeight;
			dImage.style.width = image.style.width; // set the display size
			dImage.style.height = image.style.height; 
			dImage.ctx = dImage.getContext("2d");   // get drawing API
                                                // and add to image
                                                // for possible later use
			dImage.ctx.drawImage(image,0,0);
			return dImage;
		}
		throw new ReferenceError("Image is not complete.");
	}
	
	
	function onDisplayInfo(origRequest, image) {
		// Get variables from prompt
		var imgInfSteps = origRequest.num_inference_steps;
		var imgGuideStr = origRequest.guidance_scale;
		var imgClipSkip = 'No';
		var imgTiled = 'No';
		switch (origRequest.clip_skip) {
			case false:
				imgClipSkip='No';
				break;
			case true:
				imgClipSkip='Yes';
				break;
			default:
				imgClipSkip='No';
				break;
		}
		
		switch (origRequest.tiling) {
			case "none":
				imgTiled = 'No';
				break;
			case "x":
				imgTiled = 'Horiz';
				break;
			case "y":
				imgTiled = 'Vert';
				break;
			case "xy":
				imgTiled = 'Both';
				break;
			default:
				imgTiled = 'No';
				break;
		}
			
			
		
		var LoraAlphaValue = origRequest.lora_alpha;
		var checkWidth = image.naturalWidth;
		var proceedFlag=false;
		var toggleInfo=null;
		var cw = 0;
		var ch = 0;
		
		toggleInfo=origRequest.showInfoBar;
		switch (toggleInfo) {
			case undefined:
				toggleInfo=true;
				break;
			case true:
				toggleInfo=false;
				break;
			case false:
				toggleInfo=true;
				break;
			default:
				toggleInfo=false;
				break;
		}
		
		origRequest.showInfoBar = toggleInfo;
			
		if (typeof checkWidth === 'string') {
			checkWidth=parse(checkWidth);
		}
		if (checkWidth >448) {
			proceedFlag=true;
		}
		
		switch (proceedFlag) {
			case false:
				alert('Image is too small to display information');
				break;
			default:
				//Create the canvas to work with
				const img = image;
				const canvas = document.createElement("canvas");
				const context = canvas.getContext("2d");
				cw = img.naturalWidth;
		
				// Make the canvas slightly larger than the original image
				// to accomodate the information bar
				//const cw = img.naturalWidth;
				switch (toggleInfo) {
					case true:
						ch = img.naturalHeight+40;
						break;
					case false:
						ch = img.naturalHeight-40;
						break;
				}
				canvas.width = cw;
				canvas.height = ch;
			
				// Display the canvas	
				context.save();
				context.drawImage(img,0,0);
				
				switch (toggleInfo) {
					case true:
						// Add rectangle to base of canvas
						context.beginPath();
						context.rect(0, ch-40, cw,40 );
						context.fillStyle = 'white';
						context.fill();
						context.lineWidth = 7;
						context.strokeStyle = 'black';
						context.stroke();
		
						// Add text info to the rectangle
						context.fillStyle = 'black';
						context.font = '20px serif';
						context.fillText('IS: ' + imgInfSteps, 20, ch-20);
						context.fillText('GS: ' + imgGuideStr, 80, ch-20);
						context.fillText('Clip: ' + imgClipSkip, 160, ch-20);
						context.fillText('Tile: ' + imgTiled, 280, ch-20);
						context.fillText('Lora: ' + LoraAlphaValue, cw-120, ch-20);
						context.restore();
						break;
					case false:
						break;
				}
  
				// Replace img with canvas contents
				img.src = canvas.toDataURL();
				break;
		}
	}
	
	function onTileImage(origRequest,image) {
		switch (origRequest.showInfoBar) {
			case undefined:
				onTileTheImage(origRequest,image);
				break;
			case true:
				alert('Please turn off information before you tile the image.');
				break;
			case false:
				onTileTheImage(origRequest,image);
				break;
			default:
				onTileTheImage(origRequest,image);
				break;
		}
		
	}
	
	
	
	function onTileTheImage(origRequest,image) {
		var myTileDir = origRequest.tiling;
		const img = image;
		const canvas = document.createElement("canvas");
		const context = canvas.getContext("2d");
		var cw = img.naturalWidth;
		var ch = img.naturalHeight;
		
		switch (myTileDir) {
			case 'x':
				canvas.width = cw + cw;
				canvas.height = ch;
				context.save();
				context.drawImage(img,0,0); 			// Draw image at origin
				context.drawImage(img,cw,0);			// Draw image along side origin
				context.restore();
				img.src = canvas.toDataURL();
				break;
			case 'y':
				canvas.width = cw;
				canvas.height = ch + ch;
				context.save();
				context.drawImage(img,0,0); 			// Draw image top left
				context.drawImage(img,0,ch);			// Draw image below origin
				context.restore();
				img.src = canvas.toDataURL();
				break;
			case 'xy':
				canvas.width = cw + cw;
				canvas.height = ch + ch;
				context.save();
				context.drawImage(img,0,0); 			// Draw image at origin
				context.drawImage(img,cw,0);			// Draw image along side origin
				context.drawImage(img,0,ch);			// Draw image below origin
				context.drawImage(img,cw,ch);			// Draw image diagonal opposite origin
				context.restore();
				img.src = canvas.toDataURL();
				break;
			default:
				//console.log('No tiling selected');
				break;
		}
			
	}
		
	function onSaveMask(origRequest, image) {
		
	}
	
	function onInvertMask(origRequest,image) {
		
	}
	
	


})();