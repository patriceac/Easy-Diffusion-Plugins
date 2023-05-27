/**
 * Lora Shuttle Controls
 * v.1.3, last updated: 22/05/2023
 * By The Stig
 * 
 * 
 *
 * Free to use with the CMDR2 Stable Diffusion UI.
 *  
 */

(function() { "use strict"

	const VERSION = "1.2";
	const ID_PREFIX = "TheStig-Lora Shuttle Controls";
	console.log('%s The Stig - Lora Shuttle Controls Version: %s', ID_PREFIX, VERSION);
	
	var LoraStepSize = 0.1; // Change this as you need to from Minimum 0.1 to Maximum 0.99
	
	var LoraCurrentValue = lora_alpha.value;
	var LoraFlag=false;
	let qryTestDiffusers = (document.querySelector("#test_diffusers").value).trim();
	let qryBetaChannel = (document.querySelector("#use_beta_channel").value).trim();
	if (qryBetaChannel = 'on') {
		if (qryTestDiffusers = 'on') {
			LoraFlag = true;
		}
	}
			
	var LoraSettings = {
		LoraButton1: 'fa-solid fa-fast-backward', 			// Minimum
		LoraButton2: 'fa-solid fa-step-backward', 			// Minus 1
		LoraButton3: 'fa-solid fa-compress', 				// Middle
		LoraButton4: 'fa-solid fa-step-forward',			// Plus 1
		LoraButton5: 'fa-solid fa-fast-forward',			// Maximum
		LoraButton6: 'fa-solid fa-border-none'				// Grid
	};
		
	PLUGINS['IMAGE_INFO_BUTTONS'].push([
		{ html: '<span class="imageadjust-label" style="background-color:transparent;background: rgba(0,0,0,0.5)">LS:</span>', type: 'label', on_click: onLoraAdjustClick},
		{ html: '<i class="' + LoraSettings.LoraButton1 + '"></i>', on_click: onLoraMin},
		{ html: '<i class="' + LoraSettings.LoraButton2 + '"></i>', on_click: onLoraMinus},
		{ html: '<i class="' + LoraSettings.LoraButton3 + '"></i>', on_click: onLoraMiddle},
		{ html: '<i class="' + LoraSettings.LoraButton4 + '"></i>', on_click: onLoraPlus},
		{ html: '<i class="' + LoraSettings.LoraButton5 + '"></i>', on_click: onLoraMax},
		{ html: '<i class="' + LoraSettings.LoraButton6 + '"></i>', on_click: onLoraGrid}
	])
		
	function onLoraAdjustClick() {
		console.log('*** Lora Adjust ***');
	}
	
	function modifyLora(newLoraVal,adjLoraVal,origRequest) {
		var LoraModel=document.getElementById("lora_model").value;
		var LoraValue=origRequest.lora_alpha;

		if (typeof LoraValue === 'string') {
			var passedLoraValue=parseFloat(LoraValue).toFixed(2);
		}
		if (typeof LoraValue === 'number') {
			var passedLoraValue=LoraValue.toFixed(2);
		}
		if (typeof passedLoraValue === 'string') {
			passedLoraValue=parseFloat(passedLoraValue);
		}		
		if (typeof LoraStepSize === 'string') {
			LoraStepSize=parseFloat(LoraStepSize);
		}
		var currentLoraVal = passedLoraValue;	
		switch (newLoraVal) {
			case 0:
				var newSetVal = (currentLoraVal + (adjLoraVal));
				if (typeof newSetVal === 'string') {
					newSetVal=parseFloat(newSetVal).toFixed(2);
					break;
				}
				if (typeof newSetVal === 'number') {
					newSetVal=newSetVal.toFixed(2);
					break;
				}
			default:
				var newSetVal = (currentLoraVal + (adjLoraVal));
				switch (isNaN(newSetVal)) {
					case true:
						break;
					default:
						LoraFlag=true;
						newSetVal = (parseFloat(newLoraVal));
						if (typeof newSetVal === 'string') {
							newSetVal=parseFloat(newSetVal).toFixed(2);
						}
						if (typeof newSetVal === 'number') {
							newSetVal=newSetVal.toFixed(2);
						}
				}
						
			}
	
		if (newSetVal <0) {
			newSetVal = 0;
		}
		if (newSetVal >1) {
			newSetVal = 1;
		}

		switch (LoraModel) {
			case "None":
				break;
			case "Undefined":
				break;
			case "Null":
				break;
			case "undefined":
				break;
			default:
				newSetVal=parseFloat(newSetVal);
				switch (isNaN(newSetVal)) {
					case true:
						break;
					default:
						origRequest.lora_alpha = parseFloat(newSetVal);
						lora_alpha_slider.value=(origRequest.lora_alpha*100);
						lora_alpha.value=parseFloat(newSetVal);
						document.getElementById("makeImage").click();
						break;
				}
				break;
		}
	}
		
	function onLoraMin(origRequest) {
		modifyLora(0.01,0,origRequest);
	}
	
	function onLoraMinus(origRequest) {
		modifyLora(0,(0-LoraStepSize),origRequest);
	}
	
	function onLoraMiddle(origRequest) {
		modifyLora(0.5,0,origRequest);
	}
	
	function onLoraPlus(origRequest) {
		modifyLora(0,(0+LoraStepSize),origRequest);
	}
	
	function onLoraMax(origRequest) {
		modifyLora(0.99,0,origRequest);
	}
	
	function onLoraGrid(origRequest,image) {
		if (typeof LoraStepSize === 'string') {
			LoraStepSize = parseFloat(LoraStepSize);
		}
		//onLoraMin(origRequest);
		switch (LoraFlag) {
			case false:
				break;
			default:
				var loraStartGrid=0;
				var loraEndGrid = 0.99;
				var loraLoopVal = 0;
				var loraTempVal = 0;
				origRequest.lora_alpha = 0;
				if (typeof LoraStepSize === 'string') {
					LoraStepSize = parseFloat(LoraStepSize);
				}
				if (typeof loraTempVal === 'string') {
					loraTempVal = parseFloat(loraTempVal);
				}
		
				while (loraLoopVal <= 100) {
					if (inRange,loraTempVal,0,1) {
						modifyLora(loraTempVal,0,origRequest);
					}
					loraLoopVal++;
					loraTempVal = loraTempVal + LoraStepSize;
					if (loraTempVal > 1) {
						break;
					}
				}
			}
	}
	
	
	
	function inRange(x, min, max) {
		return ((x-min)*(x-max) <= 0);
	}

})();