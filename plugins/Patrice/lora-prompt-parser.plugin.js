/*
    LoRA Prompt Parser 1.0
    by Patrice

    Copying and pasting a prompt with a LoRA tag will automatically select the corresponding option in the Easy Diffusion dropdown and remove the LoRA tag from the prompt. The LoRA must be already available in the corresponding Easy Diffusion dropdown (this is not a LoRA downloader).
*/
(function() {
    "use strict"
    
    promptField.addEventListener('input', function(e) {
        const { LoRA, prompt } = extractLoraTags(e.target.value);
    
        if (LoRA !== null && LoRA.length > 0) {
            promptField.value = prompt.replace(/,+$/, ''); // remove any trailing ,
    
            if (testDiffusers?.checked === false) {
                showToast("LoRA's are only supported with diffusers. Just stripping the LoRA tag from the prompt.")
            }
        }
                                 
        if (LoRA !== null && LoRA.length > 0 && testDiffusers?.checked) {
            //if (loraModelField.value !== LoRA[0].lora_model) {
                // Set the new LoRA value
                loraModelField.value = LoRA[0].lora_model;
                loraAlphaField.value = LoRA[0].lora_alpha;
                loraAlphaSlider.value = loraAlphaField.value * 100;
                //TBD.value = LoRA[0].blockweights; // block weights not supported by ED at this time
            //}
            showToast("Prompt successfully processed", LoRA[0].lora_model)
        }
            
        //promptField.dispatchEvent(new Event('change'));
    });
    
    function isModelAvailable(array, searchString) {
        const foundItem = array.find(function(item) {
            return item.toLowerCase() === searchString.toLowerCase();
        });

        return foundItem || "";
    }

    // extract LoRA tags from strings
    function extractLoraTags(prompt) {
        // Define the regular expression for the tags
        const regex = /<lora:([^:>]+)(?::([^:>]*))?(?::([^:>]*))?>/gi

        // Initialize an array to hold the matches
        let matches = []

        // Iterate over the string, finding matches
        for (const match of prompt.matchAll(regex)) {
            const modelFileName = isModelAvailable(modelsCache.options.lora, match[1].trim())
            if (modelFileName !== "") {
                // Initialize an object to hold a match
                let loraTag = {
                    lora_model: modelFileName,
                }
        
                // If weight is provided, add it to the loraTag object
                if (match[2] !== undefined && match[2] !== '') {
                    loraTag.lora_alpha = parseFloat(match[2].trim())
                }
                else
                {
                    loraTag.lora_alpha = 0.5
                }
        
                // If blockweights are provided, add them to the loraTag object
                if (match[3] !== undefined && match[3] !== '') {
                    loraTag.blockweights = match[3].trim()
                }
        
                // Add the loraTag object to the array of matches
                matches.push(loraTag)
            }
            else
            {
                showToast("LoRA not found: " + match[1].trim(), 5000, true)            
            }
        }

        // Clean up the prompt string, e.g. from "apple, banana, <lora:...>, orange, <lora:...>  , pear <lora:...>, <lora:...>" to "apple, banana, orange, pear"
        let cleanedPrompt = prompt.replace(regex, '').replace(/(\s*,\s*(?=\s*,|$))|(^\s*,\s*)|\s+/g, ' ').trim();

        // Return the array of matches and cleaned prompt string
        return {
            LoRA: matches,
            prompt: cleanedPrompt
        }
    }
})()
