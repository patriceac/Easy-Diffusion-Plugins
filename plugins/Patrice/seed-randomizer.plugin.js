/*
    Seed randomizer
    by Patrice

    Adds a new system setting to randomize, thus increasing the variability of images ran in batches. E.g. can run "A pug wearing a {reb, blue, green} hat" as 3 tasks with different seeds, thus yielding more variety in the results.
*/
(function() {
    "use strict"

    /* inject new settings in the existing system settings popup table */
    let settings = [
        {
            id: "seed_randomizer_behavior",
            type: ParameterType.select,
            label: "Seed Randomizer (batch image variability)",
            note: "How much images will vary for a given batch,<br />e.g. <i>a picture of a {red, green, blue} car</i><br/><br/><b>Normal:</b> Seed is reused, slight image variations<br/><b>High:</b> Seeds vary by prompt<br/><b>Very High:</b> Seeds vary by prompt and negative prompt<br/><b>Extreme:</b> Seed is fully randomized",
            default: "normal",
            options: [
                {
                    value: "normal",
                    label: "Normal (default)"
                },
                {
                    value: "high",
                    label: "High"
                },
                {
                    value: "very_high",
                    label: "Very high"
                },
                {
                    value: "extreme",
                    label: "Extreme"
                }
            ],
            icon: "fa-dice"
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
    let seedRandomizerBehavior = document.querySelector("#seed_randomizer_behavior")

    // save/restore the desired method
    seedRandomizerBehavior.addEventListener('change', (e) => {
        localStorage.setItem('seed_randomizer_behavior', seedRandomizerBehavior.value)
    })
    seedRandomizerBehavior.value = localStorage.getItem('seed_randomizer_behavior') == null ? 'normal' : localStorage.getItem('seed_randomizer_behavior')

    PLUGINS['TASK_CREATE'].push(async function (event) {
        // compute and cache task seed as needed
        if (event.reqBody.taskSeed === undefined || (event.reqBody.taskSeed !== event.reqBody.seed)) {
            const prompt = event.reqBody.prompt !== undefined ? event.reqBody.prompt : ''
            const negative_prompt = event.reqBody.negative_prompt !== undefined ? event.reqBody.negative_prompt : ''
            const seed = event.reqBody.seed
            
            switch (seedRandomizerBehavior.value) {
                case 'high':
                    // Image Variability == High. Task seed based on the original seed + prompt.
                    event.reqBody.taskSeed = crc32(prompt + '_' + event.reqBody.seed)
                    break;
                case 'very_high':
                    // Image Variability == Very High. Task seed based on the original seed + prompt + negative prompt.
                    event.reqBody.taskSeed = crc32(prompt + '_' + negative_prompt + '_' + event.reqBody.seed)
                    break;
                case 'extreme':
                    // Image Variability == Extreme. Task seed is fully randomized.
                    event.reqBody.taskSeed = Math.floor(Math.random() * 10000000)
                    break;
                default: // normal
                    // Image Variability == Normal. Default behavior, just use the provided seed.
                    event.reqBody.taskSeed = event.reqBody.seed
            }
        }
        event.reqBody.seed = event.reqBody.taskSeed
    })

    // UTF-8
    const toUtf8 = text => {
      	const input = encodeURIComponent(text);
      	let result = '';
        for (let i = 0; i < input.length;) {
            const character = input[i];
    		i += 1;
            if (character == '%') {
            	const hex = input.substring(i, i += 2);
    			if (hex) {
    				result += String.fromCharCode(parseInt(hex, 16));
    			}
            } else {
            	result += character;
            }
        }
        return result;
    };
    
    // CRC32
    const CRC_TABLE = Array(256);
    
    for (let i = 0; i < 256; ++i) {
        let code = i;
        for (let j = 0; j < 8; ++j) {
          	code = (code & 0x01 ? 0xEDB88320 ^ (code >>> 1) : (code >>> 1));
        }
        CRC_TABLE[i] = code;
    }
    
    const crc32 = text => {
        const input = toUtf8(text);
        let crc = -1;
        for (let i = 0; i < input.length; ++i) {
          	const code = input.charCodeAt(i);
            crc = CRC_TABLE[(code ^ crc) & 0xFF] ^ (crc >>> 8);
        }
        return (-1 ^ crc) >>> 0;
    };
})()
