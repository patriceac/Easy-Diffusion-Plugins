/*
    Disable Source Image Zoom
    by Patrice

    Adds a system setting to disable the source image zoom on hover in the task list.
*/
(function() {
    "use strict"

    /* inject new settings in the existing system settings popup table */
    let settings = [
        {
            id: "disable_source_image_zoom",
            type: ParameterType.checkbox,
            label: "Zoom Source Image On Hover",
            note: "Toggle the source image zoom on hover in the task list",
            icon: "fa-magnifying-glass-plus",
            default: true
        }
    ];

    function injectParameters(parameters) {
        parameters.forEach(parameter => {
            var element = getParameterElement(parameter)
            var note = parameter.note ? `<small>${parameter.note}</small>` : "";
            var icon = parameter.icon ? `<i class="fa ${parameter.icon}"></i>` : "";
            var newRow = document.createElement('div')
            newRow.innerHTML = `
                <div>${icon}</div>
                <div><label for="${parameter.id}">${parameter.label}</label>${note}</div>
                <div>${element}</div>`
            //parametersTable.appendChild(newRow)
            parametersTable.insertBefore(newRow, parametersTable.children[13])
            parameter.settingsEntry = newRow
        })
    }
    injectParameters(settings)
    prettifyInputs(document);
    let disableSourceImageZoom = document.querySelector("#disable_source_image_zoom")

    // change the stylesheet on the fly
    function getMainCSSIndex() {
        for (let i = 0; i < document.styleSheets.length; i++) {
            let sheet = document.styleSheets[i]
            if (sheet.href && sheet.href.includes('/media/css/main.css')) {
                return i
            }
        }
        return undefined
    }

    function updateSourceImageZoom() {
        // getting the stylesheet
        if (getMainCSSIndex() !== undefined) {
            const stylesheet = document.styleSheets[getMainCSSIndex()]
            let elementRules
            
            // looping through all its rules and getting your rule
            for (let i = 0; i < stylesheet.cssRules.length; i++) {
                if(stylesheet.cssRules[i].selectorText === 'div.task-initimg:hover div.task-fs-initimage') {
                    elementRules = stylesheet.cssRules[i]
                    
                    // modifying the rule in the stylesheet
                    elementRules.style.setProperty('display', disableSourceImageZoom.checked ? 'block' : 'none')
                    break
                }
            }
        }
        else
        {
            console.log("Couldn't locate main.css")
        }
    }
    
    // save/restore the desired method
    disableSourceImageZoom.addEventListener('change', (e) => {
        localStorage.setItem(settings[0].id, disableSourceImageZoom.checked)
        updateSourceImageZoom()
    })
    disableSourceImageZoom.checked = localStorage.getItem(settings[0].id) == null ? settings[0].default : localStorage.getItem(settings[0].id) === 'true'
    updateSourceImageZoom()
})()
