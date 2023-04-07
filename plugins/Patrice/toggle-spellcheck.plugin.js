/*
    Toggle Spellcheck
    by Patrice

    Adds a system setting to turn the spell check on and off for the prompt, negative prompt, and image modifiers text areas.
*/
(function() {
    "use strict"

    /* inject new settings in the existing system settings popup table */
    let settings = [
        {
            id: "enable_spellcheck",
            type: ParameterType.checkbox,
            label: "Enable spellcheck",
            note: "Enable spell check for prompt, negative prompt, and image modifiers",
            icon: "fa-spell-check",
            default: false
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
    let enableSpellcheck = document.querySelector("#enable_spellcheck")
    
    // save/restore the setting
    enableSpellcheck.addEventListener('change', (e) => {
        localStorage.setItem(settings[0].id, enableSpellcheck.checked)
        updateSpellcheck()
    })
    enableSpellcheck.checked = localStorage.getItem(settings[0].id) == null ? settings[0].default : localStorage.getItem(settings[0].id) === 'true'
    updateSpellcheck()

    function updateSpellcheck() {
        promptField.setAttribute("spellcheck", enableSpellcheck.checked ? "true" : "false")
        negativePromptField.setAttribute("spellcheck", enableSpellcheck.checked ? "true" : "false")
        customModifiersTextBox.setAttribute("spellcheck", enableSpellcheck.checked ? "true" : "false")
    }
})()
