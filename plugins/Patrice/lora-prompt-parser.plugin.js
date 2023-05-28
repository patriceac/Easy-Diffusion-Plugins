/*
    LoRA Prompt Parser 1.0
    by Patrice

    Copying and pasting a prompt with a LoRA tag will automatically select the corresponding option in the Easy Diffusion dropdown and remove the LoRA tag from the prompt. The LoRA must be already available in the corresponding Easy Diffusion dropdown (this is not a LoRA downloader).
*/
(function() {
    "use strict"
    
    promptField.addEventListener('input', function(e) {
        const { LoRA, prompt } = extractLoraTags(e.target.value);
    
        console.log(prompt, LoRA);
    
        if (LoRA !== null && LoRA.length > 0) {
            promptField.value = prompt.replace(/,+$/, ''); // remove any trailing ,
    
            if (testDiffusers?.checked === false) {
                showToast("LoRA's are only supported with diffusers. Just stripping the LoRA tag from the prompt.")
            }
        }
                                 
        if (LoRA !== null && LoRA.length > 0 && testDiffusers?.checked) {
            if (isStringInArray(modelsCache.options.lora, LoRA[0].loraname)) {
                if (loraModelField.value !== LoRA[0].loraname) {
                    // Set the new LoRA value
                    loraModelField.value = LoRA[0].loraname;
                    loraAlphaField.value = (LoRA[0].weight / 3.0).toFixed(2) || 0.5;
                    loraAlphaSlider.value = loraAlphaField.value * 100;
                    //TBD.value = LoRA[0].blockweights; // block weights not supported by ED at this time
                    showToast("Prompt successfully processed")
                }
            }
            else
            {
                showToast("LoRA not found: " + LoRA[0].loraname, 5000, true)
            }
        }
            
        //promptField.dispatchEvent(new Event('change'));
    });
    
    function isStringInArray(array, searchString) {
        return array.some(function(item) {
            return item.toLowerCase() === searchString.toLowerCase();
        });
    }
    
    // extract LoRA tags from strings
    function extractLoraTags(prompt) {
        // Define the regular expression for the tags
        const regex = /<lora:([^:>]+)(?::([^:>]*))?(?::([^:>]*))?>/gi;
    
        // Initialize an array to hold the matches
        let matches = [];
    
        // Iterate over the string, finding matches
        for (const match of prompt.matchAll(regex)) {
            // Initialize an object to hold a match
            let loraTag = {
                loraname: match[1],
            };
    
            // If weight is provided, add it to the loraTag object
            if (match[2] !== undefined && match[2] !== '') {
                loraTag.weight = parseFloat(match[2]);
            }
    
            // If blockweights are provided, add them to the loraTag object
            if (match[3] !== undefined && match[3] !== '') {
                loraTag.blockweights = match[3];
            }
    
            // Add the loraTag object to the array of matches
            matches.push(loraTag);
        }
    
        // Clean up the prompt string
        let cleanedImageTag = prompt.replace(regex, '').trim();
    
        // Return the array of matches and cleaned prompt string
        return {
            LoRA: matches,
            prompt: cleanedImageTag
        };
    }
})()
