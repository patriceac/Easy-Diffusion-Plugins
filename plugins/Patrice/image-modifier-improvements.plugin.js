/*
    Image Modifier Improvements
    by Patrice

    1. Allows for multiple custom modifier categories. Use # to name your custom categories, e.g.:
        #Custom category 1
        Custom modifier 1
        Custom modifier 2
        ...    
        #Custom category 2
        Custom modifier n
        ...
        #Custom category n...
        ...
    2. Restores the image modifier cards upon reloading the page.
    3. Adds a Clear All button on top of the task's image modifiers.
    4. Drop images on the modifier cards to set a custom visual (square pictures work best, e.g. 512x512).
    5. Adds import/export capabilities to the custom category editor (also exports/imports custom visuals).
    6. Collapses other categories when selecting a new one.
    7. Search box for quick search through custom and predefined modifiers.
    8. Supports assigning LoRA's to image modifiers, including optional multipliers. Adding/removing LoRA tags preserves the existing images as long as the syntax is respected.
        Syntax:
        #Custom category 1
        Custom modifier 1<lora:filename1>
        Custom modifier 2<lora:filename2:multiplier>
        ...    
*/
let isRefreshImageModifiersListenerAdded = false;

(function() {
    "use strict"
    
    var styleSheet = document.createElement("style")
    styleSheet.textContent = `
        .modifier-separator {
            border-bottom: 1px solid var(--background-color3);
            margin-bottom: 15px;
            padding-bottom: 15px;
            margin-right: 15px;
        }

        #modifierBackupLinks {
            margin: 4px 0 0 0;
        }
        
        #modifierBackupLinks a {
            cursor: pointer;
        }
        
        #modifier-settings-config textarea {
            width: 100%;
            height: 40vh;
        }

        #modifier-settings-config {
            transition: none;
        }

        #image-modifier-filter {
            box-sizing: border-box;
            width: 98%;
            margin-top: 4px;
            padding: 10px;
        }

        div.modifier-card.hide {
            display: none;
        }

        div.modifier-category.hide {
            display: none;
        }
        
        .modifier-card-image-container img {
            width: inherit;
            height: 100%;
            border-radius: 5px 5px 0 0;
            padding: 0px 3px 0 0;
        }

        .modifier-card {
            transform: unset;
        }

        .modifier-card:hover {
            position: relative;
            transform: unset;
        }

        .modifier-card-overlay:hover ~ .modifier-card-container .modifier-card-label.tooltip .tooltip-text {
            visibility: visible;
            opacity: 1;
            z-index: 2000;
        }
        .modifier-card-label:hover .tooltip-text {
            z-index: 2000;
        }
        span.tooltip-text:hover {
            visibility: hidden;
            opacity: 0;
        }
        .tooltip .tooltip-text::after {
            display: none;
        }
        
        .tooltip .tooltip-text {
            top: 25%;
            left: 50%;
            margin-left: 0;
            zztransform: translateY(-100%);
            transform: translateX(-50%);
        }

        .modifier-card-container .modifier-card-label p {
          margin-bottom: 4px;
        }

        .beta-banner {
            border-radius: 5px 5px 5px 5px;
            box-shadow: 0px 0px 5px 1px darkgoldenrod;
        }
    `;
    document.head.appendChild(styleSheet)
    
    async function initPlugin() {
        let customModifiers
        let imageModifierFilter
        let customSection = false

        // pull custom modifiers from legacy storage
        let inputCustomModifiers = localStorage.getItem(CUSTOM_MODIFIERS_KEY)
        if (inputCustomModifiers !== null) {
            customModifiersTextBox.value = inputCustomModifiers
            inputCustomModifiers = inputCustomModifiers.replace(/^\s*$(?:\r\n?|\n)/gm, "") // remove empty lines
            inputCustomModifiers = inputCustomModifiers.replace(/ +/g, " "); // replace multiple spaces with a single space
        }
        if (inputCustomModifiers !== null && inputCustomModifiers !== '') {
            inputCustomModifiers = importCustomModifiers(inputCustomModifiers)
        }
        else
        {
            inputCustomModifiers = []
        }
        // pull custom modifiers from persistent storage
        customModifiers = await getStorageData(CUSTOM_MODIFIERS_KEY)
        if (customModifiers === undefined) {
            customModifiers = inputCustomModifiers
            saveCustomCategories()
        }
        else
        {
            customModifiers = JSON.parse(customModifiers)
            
            // update existing entries if something changed
            if (updateEntries(inputCustomModifiers, customModifiers)) {
                saveCustomCategories()
            }
        }
        loadModifierList()
        
        // collapse the first preset section
        let preset = editorModifierEntries.getElementsByClassName('collapsible active')[0]
        if (preset !==  undefined) {
            closeCollapsible(preset.parentElement) // toggle first preset section
        }
        // set up categories auto-collapse
        autoCollapseCategories()

        // add the export and import links to the custom modifiers dialog
        const imageModifierDialog = customModifiersTextBox.parentElement
        if (imageModifierDialog.querySelector('#modifierBackupLinks') === null) {
            imageModifierDialog.insertAdjacentHTML('beforeend', `<p><small>Use the below links to export and import custom image modifiers.<br />
                                                                (if you have set any visuals, these will be saved/restored too)</small></p><p id="modifierBackupLinks">
                                                                <small><a id="exportModifiers">Export modifiers</a> - <a id="importModifiers">Import modifiers</a></small></p>`)
        
            // export link
            let downloadLink = document.getElementById("exportModifiers")
            downloadLink.addEventListener("click", function(event) {
                // export exactly what's shown in the textbox even if it hasn't been saved yet
                event.preventDefault()
                let inputCustomModifiers = customModifiersTextBox.value
                let tempModifiers = JSON.parse(JSON.stringify(customModifiers)); // create a deep copy of customModifiers
                inputCustomModifiers = inputCustomModifiers.replace(/^\s*$(?:\r\n?|\n)/gm, "") // remove empty lines
                if (inputCustomModifiers !== '') {
                    inputCustomModifiers = importCustomModifiers(inputCustomModifiers)
                    updateEntries(inputCustomModifiers, tempModifiers)
                    downloadJSON(tempModifiers, "Image Modifiers.json")
                }
                else
                {
                    downloadJSON(customModifiers, "Image Modifiers.json")
                }
            })
                                          
            function downloadJSON(jsonData, fileName) {
                var file = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" })
                var fileUrl = URL.createObjectURL(file)
                var downloadLink = document.createElement("a")
                downloadLink.href = fileUrl
                downloadLink.download = fileName
                downloadLink.click()
                URL.revokeObjectURL(fileUrl)
            }
            
            // import link
            let input = document.createElement("input")
            input.style.display = "none"
            input.type = "file"
            document.body.appendChild(input)
            
            let fileSelector = document.querySelector("#importModifiers")        
            fileSelector.addEventListener("click", function(event) {
                event.preventDefault()
                input.click()
            })
            
            input.addEventListener("change", function(event) {
                let selectedFile = event.target.files[0]
                let reader = new FileReader()
                
                reader.onload = function(event) {
                    customModifiers = JSON.parse(event.target.result)
                    // save the updated modifier list to persistent storage
                    saveCustomCategories()
                    // refresh the modifiers list
                    customModifiersTextBox.value = exportCustomModifiers(customModifiers)
                    saveCustomModifiers()
                    //loadModifierList()
                    input.value = ''
                }
                reader.readAsText(selectedFile)
            })

            function filterImageModifierList() {
                let search = imageModifierFilter.value.toLowerCase();
                for (let category of document.querySelectorAll(".modifier-category")) {
                  let categoryVisible = false;
                  for (let card of category.querySelectorAll(".modifier-card")) {
                    let label = card.querySelector(".modifier-card-label p").innerText.toLowerCase();
                    if (label.indexOf(search) == -1) {
                      card.classList.add("hide");
                    } else {
                      card.classList.remove("hide");
                      categoryVisible = true;
                    }
                  }
                  if (categoryVisible && search !== "") {
                    openCollapsible(category);
                    category.classList.remove("hide");
                  } else {
                    closeCollapsible(category);
                    if (search !== "") {
                        category.classList.add("hide");
                    }
                    else
                    {
                        category.classList.remove("hide");
                    }
                  }
                }
            }
            // Call debounce function on filterImageModifierList function with 200ms wait time. Thanks JeLuf!
            const debouncedFilterImageModifierList = debounce(filterImageModifierList, 200);

            // add the searchbox
            customModifierEntriesToolbar.insertAdjacentHTML('afterend', `<input type="text" id="image-modifier-filter" placeholder="Search for..." autocomplete="off"/>`)
            imageModifierFilter = document.getElementById("image-modifier-filter") // search box
            
            // Add the debounced function to the keyup event listener
            imageModifierFilter.addEventListener('keyup', debouncedFilterImageModifierList);

            // select the text on focus
            imageModifierFilter.addEventListener('focus', function(event) {
                imageModifierFilter.select()
            });

            // empty the searchbox on escape                
            imageModifierFilter.addEventListener('keydown', function(event) {
                if (event.key === 'Escape') {
                    if (imageModifierFilter.value !== '') {
                        imageModifierFilter.value = '';
                        filterImageModifierList();
                        event.stopPropagation();
                    }
                }
            });

            // update the custom modifiers textbox's default string
            customModifiersTextBox.placeholder = 'Enter your custom modifiers, one-per-line. Start a line with # to create custom categories.'
        }

        // refresh modifiers in the UI
        function loadModifierList() {
            let customModifiersGroupElementArray = Array.from(editorModifierEntries.querySelectorAll('.custom-modifier-category'));
            if (Array.isArray(customModifiersGroupElementArray)) {
                customModifiersGroupElementArray.forEach(div => div.remove())
            }
            if (customModifiersGroupElement !== undefined) {
                customModifiersGroupElement.remove()
                customModifiersGroupElement = undefined
            }
            customModifiersGroupElementArray = []

            if (customModifiers && customModifiers.length > 0) {
                let category = 'Custom Modifiers'
                let modifiers = []
                Object.keys(customModifiers).reverse().forEach(item => {
                    // new custom category
                    const elem = createModifierGroup(customModifiers[item], false, false)
                    elem.classList.add('custom-modifier-category')
                    customModifiersGroupElementArray.push(elem)
                    createCollapsibles(elem)
                    makeModifierCardDropAreas(elem)
                    customSection = true
                })
                if (Array.isArray(customModifiersGroupElementArray)) {
                    customModifiersGroupElementArray[0].classList.add('modifier-separator')
                }
                if (customModifiersGroupElement !== undefined) {
                    customModifiersGroupElement.classList.add('modifier-separator')
                }

                // move the searchbox atop of the image modifiers list. create it if needed.
                imageModifierFilter = document.getElementById("image-modifier-filter") // search box
                if (imageModifierFilter !== null) {
                    customModifierEntriesToolbar.insertAdjacentElement('afterend', imageModifierFilter);
                }
            }
        }

        // extract LoRA tags from strings
        function extractLoraTags(imageTag) {
            // Define the regular expression for the tags
            const regex = /<lora:([^:]+?)(?::([^>]+?))?>/g;

            // Initialize an array to hold the matches
            let matches = [];

            // Iterate over the string, finding matches
            let match;
            while ((match = regex.exec(imageTag)) !== null) {
                // If multiplier not provided, use 0.5 as the default value
                let multiplier = match[2] !== undefined ? parseFloat(match[2]) : 0.5;

                // Add the match to the array, as an object
                matches.push({
                    filename: match[1],
                    multiplier: multiplier
                });
            }

            // Clean up the imageTag string
            let cleanedImageTag = imageTag.replace(regex, '').trim();

            // Return the array of matches and cleaned imageTag string
            return {
                LoRA: matches,
                imageTag: cleanedImageTag
            };
        }

        // transform custom modifiers from flat format to structured object
        function importCustomModifiers(input) {
            let res = [];
            let lines = input.split("\n");
            let currentCategory = "Custom Modifiers";
            let currentModifiers = [];
            for (let line of lines) {
                if (line.startsWith("#")) {
                    if (currentModifiers.length > 0) {
                        res.push({ category: currentCategory, modifiers: currentModifiers });
                    }
                    currentCategory = line.substring(1);
                    currentModifiers = [];
                } else {
                    const dropAnImageHere = "data:image/png;base64,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"
                    
                    let { LoRA, imageTag } = extractLoraTags(line);
                    if (LoRA.length > 0) {
                        currentModifiers.push({
                            modifier: imageTag,
                            LoRA: LoRA,
                            previews: [
                                { name: "portrait", image: dropAnImageHere },
                                { name: "landscape", image: "" }
                            ]
                        });
                    } else {
                        currentModifiers.push({
                            modifier: line,
                            previews: [
                                { name: "portrait", image: dropAnImageHere },
                                { name: "landscape", image: "" }
                            ]
                        });
                    }
                }
            }
            res.push({ category: currentCategory, modifiers: currentModifiers });
            return res;
        }
        
        // transform custom modifiers from structured object to flat format
        function exportCustomModifiers(json) {
            let result = '';
        
            json.forEach(item => {
                result += '#' + item.category + '\n';
                item.modifiers.forEach(modifier => {
                    result += modifier.modifier + '\n';
                });
                result += '\n'; // Add a new line after each category
            });
        
            return result;
        }

        // update entries. add and remove categories/modifiers as needed.
        function updateEntries(newEntries, existingEntries) {
            let updated = false;
            
            // loop through each category in existingEntries
            for (let i = 0; i < existingEntries.length; i++) {
                let existingCategory = existingEntries[i];
                let newCategory = newEntries.find(entry => entry.category.toLowerCase() === existingCategory.category.toLowerCase());
            
                if (newCategory) {
                    // if category exists in newEntries, update its modifiers
                    let newModifiers = newCategory.modifiers;
                    let existingModifiers = existingCategory.modifiers;
            
                    // loop through each modifier in existingModifiers
                    for (let j = 0; j < existingModifiers.length; j++) {
                        let existingModifier = existingModifiers[j];
                        const newModifier = newModifiers.find(mod => mod.modifier.toLowerCase() === existingModifier.modifier.toLowerCase());
            
                        if (newModifier) {
                            if (existingModifier.LoRA || newModifier.LoRA) {
                                // if modifier exists in newModifiers, completely replace existingModifier with newModifier
                                // Check if LoRA arrays exist and if they are different
                                if (existingModifier.LoRA && newModifier.LoRA) {
                                    // Overwrite LoRA in existingModifiers
                                    existingModifier.LoRA = newModifier.LoRA;
                                    updated = true;
                                } else if (existingModifier.LoRA && !newModifier.LoRA) {
                                    // Remove LoRA from existingModifier if it doesn't exist in newModifier
                                    delete existingModifier.LoRA;
                                    updated = true;
                                } else if (!existingModifier.LoRA && newModifier.LoRA) {
                                    // Add LoRA to existingModifier if it exists in newModifier
                                    existingModifier.LoRA = newModifier.LoRA;
                                    updated = true;
                                }
                                //console.log(existingModifier.LoRA, newModifier.LoRA)
                            }
                        } else {
                            // if modifier doesn't exist in newModifiers, remove it from existingModifiers
                            existingModifiers.splice(j, 1);
                            j--;
                            updated = true;
                        }
                    }
            
                    // loop through each modifier in newModifiers
                    for (let j = 0; j < newModifiers.length; j++) {
                        let newModifier = newModifiers[j];
                        let existingIndex = existingModifiers.findIndex(mod => mod.modifier.toLowerCase() === newModifier.modifier.toLowerCase());
            
                        if (existingIndex === -1) {
                            // Modifier doesn't exist in existingModifiers, so insert it at the same index in existingModifiers
                            existingModifiers.splice(j, 0, newModifier);
                            updated = true;
                        }
                    }
                } else {
                    // if category doesn't exist in newEntries, remove it from existingEntries
                    existingEntries.splice(i, 1);
                    i--;
                    updated = true;
                }
            }
            
            // loop through each category in newEntries
            for (let i = 0; i < newEntries.length; i++) {
                let newCategory = newEntries[i];
                let existingCategoryIndex = existingEntries.findIndex(entry => entry.category === newCategory.category);
            
                if (existingCategoryIndex === -1) {
                    // if category doesn't exist in existingEntries, insert it at the same position
                    existingEntries.splice(i, 0, newCategory)
                    updated = true;
                }
            }
            
            return updated;
        }

        async function handleImage(img, imageElement) {
            try {
                const resizedBase64Img = await resizeImage(img, 128, 128);
                imageElement.src = resizedBase64Img;
        
                // update the active tags if needed
                updateActiveTags()
        
                // save the customer modifiers
                const category = imageElement.closest('.modifier-category').querySelector('h5').innerText.slice(1)
                const modifier = imageElement.closest('.modifier-card').querySelector('.modifier-card-label > p').dataset.fullName
                setPortraitImage(category, modifier, resizedBase64Img)
                saveCustomCategories()
            } catch (error) {
                // Log the error message to the console
                console.error(error);
            }
        }

        function makeModifierCardDropAreas(elem) {
            const modifierCards = elem.querySelectorAll('.modifier-card');
            modifierCards.forEach(modifierCard => {
                const overlay = modifierCard.querySelector('.modifier-card-overlay');
                overlay.addEventListener('dragover', e => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                });
                overlay.addEventListener('drop', e => {
                    e.preventDefault();
                    
                    // Find the first image file, uri, or moz-url in the items list
                    let imageItem = null;
                    for (let i = 0; i < e.dataTransfer.items.length; i++) {
                        let item = e.dataTransfer.items[i];
                        if ((item.kind === 'file' && item.type.startsWith('image/')) || item.type === 'text/uri-list') {
                            imageItem = item;
                            break;
                        } else if (item.type === 'text/x-moz-url') {
                            // If there are no image files or uris, fallback to moz-url
                            if (!imageItem) {
                                imageItem = item;
                            }
                        }
                    }
                
                    if (imageItem) {
                        const imageContainer = modifierCard.querySelector('.modifier-card-image-container');
                        if (imageContainer.querySelector('.modifier-card-image') === null) {
                            imageContainer.insertAdjacentHTML('beforeend', `<img onerror="this.remove()" alt="Modifier Image" class="modifier-card-image">`)
                        }
                        const imageElement = imageContainer.querySelector('img');
                        
                        // Create an img element for the dropped image file
                        let img = new Image();
                
                        if (imageItem.kind === 'file') {
                            // If the item is an image file, handle it as before
                            let file = imageItem.getAsFile();
                
                            // Create a FileReader object to read the dropped file as a data URL
                            let reader = new FileReader();
                            reader.onload = function(e) {
                                // Set the src attribute of the img element to the data URL
                                img.src = e.target.result;
                                handleImage(img.src, imageElement)
                            };
                            reader.readAsDataURL(file);
                        } else {
                            // If the item is a URL, retrieve it and use it to load the image
                            imageItem.getAsString(function(url) {
                                // Set the src attribute of the img element to the URL
                                img.src = url;
                                handleImage(img.src, imageElement)
                            });
                        }
                    }
                });
            });
        }
        
        function setPortraitImage(category, modifier, image) {
            const categoryObject = customModifiers.find(obj => obj.category === category)
            if (!categoryObject) return
        
            const modifierObject = categoryObject.modifiers.find(obj => obj.modifier === modifier)
            if (!modifierObject) return
        
            const portraitObject = modifierObject.previews.find(obj => obj.name === "portrait")
            if (!portraitObject) return
        
            portraitObject.image = image
        }

        function resizeImage(srcImage, width, height) {
            // Return a new Promise object that will resolve with the resized image data
            return new Promise(function(resolve, reject) {
                // Create an Image object with the original base64 image data
                const img = new Image();
                
                // Set up a load event listener to ensure the image has finished loading before resizing it
                img.onload = function() {
                    // Create a canvas element
                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Draw the original image on the canvas with bilinear interpolation
                    const ctx = canvas.getContext("2d");
                    ctx.imageSmoothingEnabled = true
                    if (ctx.imageSmoothingQuality !== undefined) {
                        ctx.imageSmoothingQuality = 'high'
                    }
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Get the base64-encoded data of the resized image
                    const resizedImage = canvas.toDataURL();
                    
                    // Resolve the Promise with the base64-encoded data of the resized image
                    resolve(resizedImage);
                };
                    
                // Set up an error event listener to reject the Promise if there's an error loading the image
                img.onerror = function() {
                    reject("Error loading image");
                };
            
                // Set the source of the Image object to the input base64 image data
                img.src = srcImage;
            });
        }

        async function saveCustomCategories() {
            setStorageData(CUSTOM_MODIFIERS_KEY, JSON.stringify(customModifiers))                
        }

        // collapsing other categories
        function openCollapsible(element) {
            const collapsibleHeader = element.querySelector(".collapsible");
            const handle = element.querySelector(".collapsible-handle");
            collapsibleHeader.classList.add("active")
            let content = getNextSibling(collapsibleHeader, '.collapsible-content')
            if (collapsibleHeader.classList.contains("active")) {
                content.style.display = "block"
                if (handle != null) {  // render results don't have a handle
                    handle.innerHTML = '&#x2796;' // minus
                }
            }
            document.dispatchEvent(new CustomEvent('collapsibleClick', { detail: collapsibleHeader }))
        }
        
        function closeCollapsible(element) {
            const collapsibleHeader = element.querySelector(".collapsible");
            const handle = element.querySelector(".collapsible-handle");
            collapsibleHeader.classList.remove("active")
            let content = getNextSibling(collapsibleHeader, '.collapsible-content')
            if (!collapsibleHeader.classList.contains("active")) {
                content.style.display = "none"
                if (handle != null) {  // render results don't have a handle
                    handle.innerHTML = '&#x2795;' // plus
                }
            }
            document.dispatchEvent(new CustomEvent('collapsibleClick', { detail: collapsibleHeader }))
        }
        
        function collapseOtherCategories(elem) {
            const modifierCategories = document.querySelectorAll('.modifier-category');
            modifierCategories.forEach(category => {
                if (category !== elem) {
                    closeCollapsible(category)
                    //elem.scrollIntoView({ block: "nearest" })
                }
            });
        }
        
        function autoCollapseCategories() {
            const modifierCategories = document.querySelectorAll('.modifier-category');
            modifierCategories.forEach(modifierCategory => {
                modifierCategory.addEventListener('click', function(e) {
                    if (imageModifierFilter.value === '') {
                        collapseOtherCategories(e.target.closest('.modifier-category'))
                    }
                });
            });
        }
        document.dispatchEvent(new Event('loadImageModifiers')) // refresh image modifiers


        /* CLEAR ALL AND ADD BUTTONS */
        var styleSheet = document.createElement("style")
        styleSheet.textContent = `
            #imageTagCommands {
                display: block;
                margin: 6px 0 3px 4px;
            }
    
            .clearAllImageTags {
                font-size: 8pt;
                padding: 2px;
            }
    
            #addImageTag {
                margin: 6px 0 3px 4px;
                font-size: 8pt;
                padding: 2px;
                background-color: var(--accent-color);
                border: 1px solid var(--accent-color);
            }
            
            #addImageTag:hover {
              background: hsl(var(--accent-hue), 100%, calc(var(--accent-lightness) + 6%));
              color: var(--accent-text-color);
            }
            
            #editor-modifiers.active {
                height: 80vh;
                overflow-y: auto;
                top: 10%;
                text-align: left;
            }
            
            #editor-modifiers.active::-webkit-scrollbar {
                width: 10px;
            }
            
            #editor-modifiers.active::-webkit-scrollbar-track {
                background: var(--background-color1);
                border-radius: 10px;
            }
            
            #editor-modifiers.active::-webkit-scrollbar-thumb {
                background: var(--background-color4);
                width: 10px;
                border-radius: 8px;
            }
        `
        document.head.appendChild(styleSheet)

        let editorModifiers
        let editorModifiersPopup
        if (document.querySelector('#imageTagCommands') === null) {
            editorModifierTagsList?.insertAdjacentHTML('beforeBegin', `
                <div id="imageTagCommands"><button class="secondaryButton clearAllImageTags">Clear all</button><button id='addImageTag' class="secondaryButton">Add modifiers</button></div>
            `)
            
            editorModifiers = document.getElementById("editor-modifiers");
            editorModifiers?.insertAdjacentHTML('beforeBegin', `
                <div id="imageTagPopupContainer" tabindex="0"></div>
            `)
            editorModifiersPopup = document.getElementById("imageTagPopupContainer");
            editorModifiersPopup.appendChild(editorModifiers);

            document.querySelector('.clearAllImageTags').addEventListener('click', function(e) {
                e.stopPropagation()
                
                // clear existing image tag cards
                editorTagsContainer.style.display = 'none'
                editorModifierTagsList.querySelectorAll('.modifier-card').forEach(modifierCard => {
                    modifierCard.remove()
                })
        
                // reset modifier cards state
                document.querySelector('#editor-modifiers').querySelectorAll('.modifier-card').forEach(modifierCard => {
                    const modifierName = modifierCard.querySelector('.modifier-card-label').innerText
                    if (activeTags.map(x => x.name).includes(modifierName)) {
                        modifierCard.classList.remove(activeCardClass)
                        modifierCard.querySelector('.modifier-card-image-overlay').innerText = '+'
                    }
                })
                activeTags = []
                document.dispatchEvent(new Event('refreshImageModifiers')) // notify image modifiers have changed
            })

            document.querySelector('#addImageTag').addEventListener('click', function(e) {
                e.stopPropagation()
            
                editorModifiers.classList.add("active");
                editorModifiersPopup.classList.add("popup", "active");
                imageModifierFilter.focus()
                imageModifierFilter.select()
            })
            
            editorModifiersPopup.addEventListener('keydown', function(e) {   
                if (e.key === "Escape") {
                    /*
                    if (imageModifierFilter.value !== '') {
                        imageModifierFilter.value = ''
                        filterImageModifierList()
                    }
                    else
                    {
                        editorModifiers.classList.remove("active");
                        editorModifiersPopup.classList.remove("popup", "active");
                    }
                    e.stopPropagation()
                    */
                    editorModifiers.classList.remove("active");
                    editorModifiersPopup.classList.remove("popup", "active");
                    e.stopPropagation()
                } else if (event.ctrlKey && event.key === 'Enter') {
                    // Ctrl+Enter key combination. Hide the dialog and let the event bubble up, which will trigger the image generation.
                    editorModifiersPopup.classList.remove("popup", "active");
                }
            })

            editorModifiersPopup.addEventListener('click', function(e) {
                if (event.target === editorModifiersPopup) {
                    editorModifiers.classList.remove("active");
                    editorModifiersPopup.classList.remove("popup", "active");
                    e.stopPropagation()
                }
            })
        }
        
        function getLoRAFromActiveTags(activeTags, imageModifiers) {
            // Prepare a result array
            let result = [];
        
            // Iterate over activeTags
            for (let tag of activeTags) {
                // Check if the tag is marked active
                if (!tag.inactive) {
                    // Iterate over the categories in imageModifiers
                    for (let category of imageModifiers) {
                        // Iterate over the modifiers in the current category
                        for (let modifier of category.modifiers) {
                            // Check if the tag name matches the modifier
                            if (trimModifiers(tag.name.toLowerCase()) === trimModifiers(modifier.modifier.toLowerCase())) {
                                // If there's a LoRA value, add it to the result array
                                if (modifier.LoRA && modifier.LoRA.length > 0) {
                                    result.push(modifier.LoRA);
                                }
                            }
                        }
                    }
                }
            }

            // If no LoRA tags were found, return null
            if (result.length === 0) {
                return null;
            }
        
            // Return the result array
            return result.flat();
        }

        function isLoRAInActiveTags(activeTags, imageModifiers, givenLoRA) {
            // Iterate over activeTags
            for (let tag of activeTags) {
                // Iterate over the categories in imageModifiers
                for (let category of imageModifiers) {
                    // Iterate over the modifiers in the current category
                    for (let modifier of category.modifiers) {
                        // Check if the tag name matches the modifier
                        if (trimModifiers(tag.name) === trimModifiers(modifier.modifier)) {
                            // Check if there's a LoRA value
                            if (modifier.LoRA) {
                                // Iterate over each LoRA object
                                for(let loraObject of modifier.LoRA) {
                                    // Check if the filename matches the given LoRA
                                    if(loraObject.filename.toLowerCase() === givenLoRA.toLowerCase()) {
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        
            // If the given LoRA was not found in activeTags, return false
            return false;
        }

        function isLoRAInImageModifiers(imageModifiers, givenModifier) {
            for (let category of imageModifiers) {
                for (let modifier of category.modifiers) {
                    // Check if the given modifier matches and if it has a LoRA property
                    if (modifier.modifier.toLowerCase() === givenModifier.toLowerCase() && modifier.LoRA) {
                        // If the modifier has any LoRA object associated, return true
                        if(modifier.LoRA.length > 0) {
                            return true;
                        }
                    }
                }
            }
        
            // If the given modifier was not found or it doesn't have a LoRA, return false
            return false;
        }

        function showLoRAs() {
            let overlays = document.querySelectorAll(".modifier-card-overlay")
            overlays.forEach((card) => {
                let modifierName = card.parentElement.getElementsByClassName("modifier-card-label")[0].getElementsByTagName("p")[0].dataset.fullName
                modifierName = trimModifiers(modifierName)
                if (isLoRAInImageModifiers(customModifiers, modifierName)) {
                    //console.log("LoRA modifier:", modifierName)
                    card.parentElement.classList.add('beta-banner')
                }
                else
                {
                    card.classList.remove('beta-banner')
                }
            })

        }

        let previousLoRA = "";
        let previousLoRAMultiplier = "";
        function handleRefreshImageModifiers(e) {
            let LoRA = getLoRAFromActiveTags(activeTags, customModifiers); // find active LoRA
            if (LoRA !== null && LoRA.length > 0 && testDiffusers?.checked) {
                // If the current LoRA is not in activeTags, save it
                if (!isLoRAInActiveTags(activeTags, customModifiers, loraModelField.value)) {
                    previousLoRA = loraModelField.value;
                    previousLoRAMultiplier = loraAlphaField.value
                }
                // Set the new LoRA value
                loraModelField.value = LoRA[0].filename;
                loraAlphaSlider.value = LoRA[0].multiplier * 100;
                loraAlphaField.value = LoRA[0].multiplier;
            } else {
                // Check if the current loraModelField.value is in activeTags
                if (isLoRAInActiveTags(activeTags, customModifiers, loraModelField.value)) {
                    // This LoRA is inactive. Restore the previous LoRA value.
                    //console.log("Current LoRA in activeTags:", loraModelField.value, previousLoRA);
                    loraModelField.value = previousLoRA;
                    loraAlphaSlider.value = previousLoRAMultiplier * 100;
                    loraAlphaField.value = previousLoRAMultiplier
                }
                else
                {
                    //console.log("Current LoRA not in activeTags:", loraModelField.value);
                }
            }
            
            showLoRAs()
            
            return true;
        }

        // Add the event listener only if it hasn't been added before
        if (!isRefreshImageModifiersListenerAdded) {
            document.addEventListener("refreshImageModifiers", handleRefreshImageModifiers);
            isRefreshImageModifiersListenerAdded = true;
        }

        showLoRAs()
    }
    initPlugin()

    PLUGINS['MODIFIERS_LOAD'] = []

    PLUGINS['MODIFIERS_LOAD'].push({
        loader: async function() {
            initPlugin()
        }
    })

    
    /* RESTORE IMAGE MODIFIERS */
    document.addEventListener("refreshImageModifiers", function(e) {
        localStorage.setItem('image_modifiers', JSON.stringify(activeTags))
        return true
    })

    // reload image modifiers at start
    document.addEventListener("loadImageModifiers", function(e) {
        let savedTags = JSON.parse(localStorage.getItem('image_modifiers'))
        savedTags = savedTags.filter(tag => tag !== null);
        let active_tags = savedTags == null ? [] : savedTags.map(x => x.name)

        // restore inactive tags in memory
        const inactiveTags = savedTags?.filter(tag => tag.inactive === true).map(x => x.name)
        
        // reload image modifiers
        refreshModifiersState(active_tags, inactiveTags)
             
        // update the active tags if needed
        updateActiveTags()
        
        return true
    })

    function updateActiveTags() {
        activeTags.forEach((tag, index) => {
            if (tag.originElement) { // will be null if the custom tag was removed
                const modifierImage = tag.originElement.querySelector('img')
                let tinyModifierImage = tag.element.querySelector('img')
                if (modifierImage !== null) {
                    if (tinyModifierImage === null) {
                        const tinyImageContainer = tag.element.querySelector('.modifier-card-image-container')
                        tinyImageContainer.insertAdjacentHTML('beforeend', `<img onerror="this.remove()" alt="Modifier Image" class="modifier-card-image">`)
                        tinyModifierImage = tag.element.querySelector('img')
                    }
                    tinyModifierImage.src = modifierImage.src
                }
            }
        })
    }

    document.addEventListener("refreshImageModifiers", function(e) {
        // Get all div elements with class modifier-card-tiny
        const tinyCards = document.querySelectorAll('.modifier-card-tiny');
        
        // Remove class 'hide' from all the selected div elements
        tinyCards.forEach(card => {
          card.classList.remove('hide');
        });
        
        return true
    })

    /* PERSISTENT STORAGE MANAGEMENT */
    // Request persistent storage
    async function requestPersistentStorage() {
        if (navigator.storage && navigator.storage.persist) {
          const isPersisted = await navigator.storage.persist();
          console.log(`Persisted storage granted: ${isPersisted}`);
        }
    }
    requestPersistentStorage()

    // Open a database
    function openDB() {
        return new Promise((resolve, reject) => {
            let request = indexedDB.open("EasyDiffusionSettingsDatabase", 1);
            request.addEventListener("upgradeneeded", function() {
                let db = request.result;
                db.createObjectStore("EasyDiffusionSettings", {keyPath: "id"});
            });
            request.addEventListener("success", function() {
                resolve(request.result);
            });
            request.addEventListener("error", function() {
                reject(request.error);
            });
        });
    }
    
    // Function to write data to the object store
    function setStorageData(key, value) {
        return openDB().then(db => {
            let tx = db.transaction("EasyDiffusionSettings", "readwrite");
            let store = tx.objectStore("EasyDiffusionSettings");
            let data = {id: key, value: value};
            return new Promise((resolve, reject) => {
                let request = store.put(data);
                request.addEventListener("success", function() {
                    resolve(request.result);
                });
                request.addEventListener("error", function() {
                    reject(request.error);
                });
            });
        });
    }
    
    // Function to retrieve data from the object store
    function getStorageData(key) {
        return openDB().then(db => {
            let tx = db.transaction("EasyDiffusionSettings", "readonly");
            let store = tx.objectStore("EasyDiffusionSettings");
            return new Promise((resolve, reject) => {
                let request = store.get(key);
                request.addEventListener("success", function() {
                    if (request.result) {
                        resolve(request.result.value);
                    } else {
                        // entry not found
                        resolve();
                    }
                });
                request.addEventListener("error", function() {
                    reject(request.error);
                });
            });
        });
    }

    // indexedDB debug functions
    function getAllKeys() {
        return openDB().then(db => {
            let tx = db.transaction("EasyDiffusionSettings", "readonly");
            let store = tx.objectStore("EasyDiffusionSettings");
            let keys = [];
            return new Promise((resolve, reject) => {
                store.openCursor().onsuccess = function(event) {
                    let cursor = event.target.result;
                    if (cursor) {
                        keys.push(cursor.key);
                        cursor.continue();
                    } else {
                        resolve(keys);
                    }
                };
            });
        });
    }
    
    async function logAllKeys() {
        try {
            let keys = await getAllKeys();
            console.log("All keys:", keys);
            for (const k of keys) {
                console.log(k, await getStorageData(k))
            }
        } catch (error) {
            console.error("Error retrieving keys:", error);
        }
    }

    // USE WITH CARE - THIS MAY DELETE ALL ENTRIES
    function deleteKeys(keyToDelete) {
        let confirmationMessage = keyToDelete
            ? `This will delete the modifier with key "${keyToDelete}". Continue?`
            : "This will delete ALL modifiers. Continue?";
        if (confirm(confirmationMessage)) {
            return openDB().then(db => {
                let tx = db.transaction("EasyDiffusionSettings", "readwrite");
                let store = tx.objectStore("EasyDiffusionSettings");
                return new Promise((resolve, reject) => {
                    store.openCursor().onsuccess = function(event) {
                        let cursor = event.target.result;
                        if (cursor) {
                            if (!keyToDelete || cursor.key === keyToDelete) {
                                cursor.delete();
                            }
                            cursor.continue();
                        } else {
                            // refresh the dropdown and resolve
                            resolve();
                        }
                    };
                });
            });
        }
    }
})()
