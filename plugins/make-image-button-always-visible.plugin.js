/*
    Make Image Always Visible
    by Patrice

    Makes the Make Image button always visible.
*/
(function () {
    "use strict"

    var styleSheet = document.createElement("style")
    styleSheet.textContent = `
        @media (min-width: 700px) {
            #makeImage {
                position: sticky;
                top: 0;
                bottom: 0;
                flex: 0 0 40px;
                margin-top: 4px;
                z-index: 1000;
            }
            
            #makeImage:active {
                transform: translate(1px, 1px);
            }
        }
    `
    document.head.appendChild(styleSheet)

    const editorInputs = document.querySelector('#editor-inputs')
    editorInputs.after(makeImageBtn)
    makeImageBtn.after(renderButtons)
})()
