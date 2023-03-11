/*
    Prompt Diff
    by Patrice

    Shows what text was added/removed between two consecutive prompts.
*/
(function() {
    var styleSheet = document.createElement("style");
    styleSheet.textContent = `
        .diffStrings {
            margin-top: 4px;
        }
    `;
    document.head.appendChild(styleSheet);

    function shortestSequence(A, B) {
        const n = A.length;
        const m = B.length;
    
        // Initialize a 2D array to store the lengths of the shortest sequences
        // to transform prefixes of A to prefixes of B
        const dp = Array(n + 1)
            .fill(null)
            .map(() => Array(m + 1).fill(0));
    
        // Fill in the first row and first column of the DP table
        for (let i = 0; i <= n; i++) {
            dp[i][0] = i;
        }
        for (let j = 0; j <= m; j++) {
            dp[0][j] = j;
        }
    
        // Fill in the rest of the DP table using the recurrence relation
        for (let i = 1; i <= n; i++) {
            for (let j = 1; j <= m; j++) {
                if (A[i - 1] === B[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] =
                        1 +
                        Math.min(
                            dp[i][j - 1], // Insertion
                            dp[i - 1][j], // Deletion
                            dp[i - 1][j - 1] // Substitution
                        );
                }
            }
        }
    
        // Backtrack to reconstruct the shortest sequence of operations
        const sequence = [];
        let i = n;
        let j = m;
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && A[i - 1] === B[j - 1]) {
                // Keep
                sequence.unshift(A[i - 1]);
                i--;
                j--;
            } else if (
                j > 0 &&
                (i === 0 || dp[i][j - 1] <= dp[i - 1][j]) // Insertion
            ) {
                if (B[j - 1]) {
                    if (B[j - 1] === ',') {
                        sequence.unshift(`,`);
                    }
                    else
                    {
                        sequence.unshift(`<span style="color:green; text-decoration: underline;">${B[j - 1]}</span>`);
                    }
                }
                j--;
            } else {
                // Deletion
                if (A[i - 1]) {
                    if (A[i - 1] === ',') {
                        sequence.unshift(`,`);
                    }
                    else
                    {
                        sequence.unshift(`<span style="color:red; text-decoration: line-through;">${A[i - 1]}</span>`);
                    }
                }
                i--;
            }
        }
    
        return sequence;
    }

    // Define the function to split two strings by commas and spaces
    function splitStringWithCommas(str0, str1) {
        // Find the index of the first comma in the first string
        const firstCommaIndex0 = str0.indexOf(",");
        // Define two variables to store the parts of the first string
        let beforeFirstComma0
        let afterFirstComma0
        // Check if there is a comma in the first string
        if (firstCommaIndex0 >= 0) {
            // Split the first string into two parts based on the first comma
            beforeFirstComma0 = str0.substring(0, firstCommaIndex0);
            afterFirstComma0 = str0.substring(firstCommaIndex0 + 1).trim();    
        }
        else {
            // If there is no comma, treat the whole string as the first part
            beforeFirstComma0 = str0;
            afterFirstComma0 = '';
        }
        // Split the two parts of the first string into arrays of strings
        const beforeFirstCommaArray0 = beforeFirstComma0.split(" ").filter((str) => str !== "");
        const afterFirstCommaArray0 = afterFirstComma0.split(/(,)/).map((str) => str.trim()).filter((str) => str !== "");

        // Repeat the same process for the second string
        const firstCommaIndex1 = str1.indexOf(",");
        let beforeFirstComma1
        let afterFirstComma1
        if (firstCommaIndex1 >= 0) {
            beforeFirstComma1 = str1.substring(0, firstCommaIndex1);
            afterFirstComma1 = str1.substring(firstCommaIndex1 + 1).trim();    
        }
        else {
            beforeFirstComma1 = str1;
            afterFirstComma1 = '';
        }
        const beforeFirstCommaArray1 = beforeFirstComma1.split(" ").filter((str) => str !== "");
        const afterFirstCommaArray1 = afterFirstComma1.split(/(,)/).map((str) => str.trim()).filter((str) => str !== "");

        // Find the shortest sequence of strings to transform the two arrays for each part
        const diffPartA = shortestSequence(beforeFirstCommaArray0, beforeFirstCommaArray1)
        const diffPartB = shortestSequence(afterFirstCommaArray0, afterFirstCommaArray1)

        // Concatenate the two sequences with a comma in between, if both are not empty
        const finalArray = diffPartA.concat(diffPartA.length > 0 && diffPartB.length > 0 ? [","] : [], diffPartB).map((str) => str.trim()); 

        // Consolidate the final array by removing any duplicates
        return consolidateArray(finalArray);
    }
    
    // Define a function to consolidate an array of strings
    function consolidateArray(arr) {
        // Create an empty array to store the consolidated strings
        let result = [];
        // Initialize a variable to keep track of the previous string
        let prevItem = null;

        // Loop through the input array of strings
        for (let i = 0; i < arr.length; i++) {
            // Get the current string, as well as the next string (if any)
            let currItem = arr[i];
            let nextItem = arr[i + 1];

            // Check if the current string is a comma and if there are both previous and next strings
            if (currItem === ',' && prevItem && nextItem) {
                // Strip any HTML span tags from the previous and next strings
                let currText = stripSpan(prevItem);
                let nextText = stripSpan(nextItem);

                // If the previous and next strings are the same, consolidate them with a comma separator
                if (currText === nextText) {
                    result.pop();
                    result.push(',');
                    result.push(stripSpan(nextItem));
                    result.push(',');
                    i++;
                    continue;
                }
            }

            // Otherwise, just add the current string to the result array
            result.push(currItem);
            // Update the previous string to be the current string for the next iteration
            prevItem = currItem;
        }

        // Return the consolidated array with duplicates removed
        return result;
    }

    // Define a function to strip HTML span tags from a string
    function stripSpan(str) {
        return str.replace(/<\/?span[^>]*>/g, '');
    }

    // observe for changes in the preview pane
    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(async function (mutation) {
            //console.log(mutation.addedNodes)
            if (mutation.addedNodes[0] !== undefined && mutation.addedNodes[0].className == 'imageTaskContainer') {
                const task0 = htmlTaskMap.get(mutation.addedNodes[0])
                const task1 = htmlTaskMap.get(mutation.addedNodes[0].nextSibling)
                if (task0 && task1) {
                    const prompt0 = task0.reqBody.prompt
                    const prompt1 = task1.reqBody.prompt
                    const diffPrompt = splitStringWithCommas(prompt1, prompt0).join(' ').replace(/ ,/g, ',')
                    const negativePrompt0 = task0.reqBody.negative_prompt
                    const negativePrompt1 = task1.reqBody.negative_prompt
                    const diffNegativePrompt = splitStringWithCommas(negativePrompt1, negativePrompt0).join(' ').replace(/ ,/g, ',')
                    const taskConfig = mutation.addedNodes[0].getElementsByClassName('taskConfig')[0]
                    if (taskConfig !== undefined && task0.diffAdded == undefined) {
                        if (prompt0 !== prompt1 && negativePrompt0 !== negativePrompt1) {
                            taskConfig.insertAdjacentHTML("beforeend", `<div class='diffStrings'><b>Prompt diff:</b> ${diffPrompt !== '' ? diffPrompt : '-'}</br><b>Negative prompt diff:</b> ${diffNegativePrompt !== '' ? diffNegativePrompt : '-'}</div>`)
                        }
                        else if (prompt0 !== prompt1) {
                            taskConfig.insertAdjacentHTML("beforeend", `<div class='diffStrings'><b>Prompt diff:</b> ${diffPrompt}</br></div>`)
                        }
                        else if (negativePrompt0 !== negativePrompt1) {
                            taskConfig.insertAdjacentHTML("beforeend", `<div class='diffStrings'><b>Negative prompt diff:</b> ${diffNegativePrompt !== '' ? diffNegativePrompt : '-'}</div>`)
                        }
                    }
                }
            }
        })
    })
    observer.observe(document.getElementById('preview'), {
            childList: true,
            subtree: true,
            attributes: true
    })
})()
