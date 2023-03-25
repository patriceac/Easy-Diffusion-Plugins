/*
    Random Seed Quick Toggle
    by Patrice

    Adds a toggle to the preview toolbar to quickly toggle the random seed setting.
*/
(function () {
    "use strict"

    /* remove the quick toggle tooltips */
    function setupDropdown() {
        // Find all tooltips
        const tooltips = previewTools.querySelectorAll('span.simple-tooltip');
    
        // remove the tooltips
        tooltips.forEach((tooltip) => {
            //tooltip.remove()
            tooltip.style.opacity = 0
        });
    }
    setupDropdown()

    var styleSheet = document.createElement("style");
    styleSheet.textContent = `
        .tertiaryButton:hover {
            background: var(--tertiary-background-color);
            color: var(--tertiary-color);
        }
        
        .tertiaryButton.pressed {
            border-style: inset;
            background: hsl(var(--accent-hue), 100%, calc(var(--accent-lightness) + 6%));
            color: var(--accent-text-color);
        }
        
        .tertiaryButton:not(#random_seed_btn):not(#process_order_btn):not(#auto_scroll_btn):hover {
          background: hsl(var(--accent-hue), 100%, calc(var(--accent-lightness) + 6%));
          color: var(--accent-text-color);
        }
    `;
    document.head.appendChild(styleSheet);

    // add the random seed quick toggle button
    autoscrollBtn.insertAdjacentHTML('afterend', `
        <button id="random_seed_btn" class="tertiaryButton">
            <i class="fa fa-dice icon"></i>
        </button>
    `);
    let randomSeedBtn = previewTools.querySelector('#random_seed_btn')

    function onRandomSeedUpdate() {
        if (randomSeedField.checked) {
            randomSeedBtn.classList.add('pressed')
        } else {
            randomSeedBtn.classList.remove('pressed')
        }
    }
    onRandomSeedUpdate() // set initial value
    
    randomSeedBtn.addEventListener('click', function() {
        randomSeedField.checked = !randomSeedField.checked
        randomSeedField.dispatchEvent(new Event("change"))
        onRandomSeedUpdate()
    })
    randomSeedField.addEventListener('change', onRandomSeedUpdate)
})()
