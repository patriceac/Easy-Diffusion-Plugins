/*
    GPU Mode Quick Toggle
    by Patrice

    Adds a toggle to the preview toolbar to quickly toggle the GPU mode between "low" and "balanced" setting. Why not "High"? Because Balanced is almost as fast and allows for a simple toggle (as opposed to a tri-state button).
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
        
        .tertiaryButton:not(#random_seed_btn):not(#process_order_btn):not(#auto_scroll_btn):not(#gpu_mode_btn):hover {
          background: hsl(var(--accent-hue), 100%, calc(var(--accent-lightness) + 6%));
          color: var(--accent-text-color);
        }
    `;
    document.head.appendChild(styleSheet);

    // add the GPU mode quick toggle button
    autoscrollBtn.insertAdjacentHTML('afterend', `
        <button id="gpu_mode_btn" class="tertiaryButton">
            <i class="fa fa-forward icon"></i>
        </button>
    `);
    let gpuModeBtn = previewTools.querySelector('#gpu_mode_btn')

    function onGPUModeUpdate() {
        if (vramUsageLevelField.value !== "low") {
            gpuModeBtn.classList.add('pressed')
        } else {
            gpuModeBtn.classList.remove('pressed')
        }
    }
    onGPUModeUpdate() // set initial value
    
    gpuModeBtn.addEventListener('click', function() {
        vramUsageLevelField.value = vramUsageLevelField.value === "low" ? "balanced" : "low"
        vramUsageLevelField.dispatchEvent(new Event("change"))
        onGPUModeUpdate()
    })
    vramUsageLevelField.addEventListener('change', onGPUModeUpdate)
})()