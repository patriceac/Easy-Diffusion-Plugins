/*
    Processing Order Quick Toggle
    by Patrice

    Adds a toggle to the preview toolbar to quickly switch the queue processing order. Also fixes the display of the autoscroll toggle.
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
        
        .tertiaryButton:not(#process_order_btn):not(#auto_scroll_btn):hover {
          background: hsl(var(--accent-hue), 100%, calc(var(--accent-lightness) + 6%));
          color: var(--accent-text-color);
        }
    `;
    document.head.appendChild(styleSheet);

    // add the processing order quick toggle button
    autoscrollBtn.insertAdjacentHTML('beforebegin', `
        <button id="process_order_btn" class="tertiaryButton">
            <i class="fa fa-arrow-down-short-wide icon"></i>
        </button>
    `);
    let processOrderBtn = previewTools.querySelector('#process_order_btn')

    function onProcessOrderUpdate() {
        if (processOrder.checked) {
            processOrderBtn.classList.add('pressed')
        } else {
            processOrderBtn.classList.remove('pressed')
        }
    }
    onProcessOrderUpdate() // set initial value
    
    processOrderBtn.addEventListener('click', function() {
        processOrder.checked = !processOrder.checked
        processOrder.dispatchEvent(new Event("change"))
        onProcessOrderUpdate()
    })
    processOrder.addEventListener('change', onProcessOrderUpdate)
})()
