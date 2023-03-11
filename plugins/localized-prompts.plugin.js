/*
    Localized Prompts
    by Patrice
    
    PLEASE NOTE YOUR PROMPTS WILL BE TRANSMITTED TO GOOGLE TRANSLATE.
    
    Enter prompts in your native language, e.g. in French, "une mystérieuse porte dans la forêt". Prompts are seamlessly translated to English before being rendered.
    Default language is set to English (no translation), can be changed in the dropdown in the Settings pane.
*/
(function() {
    "use strict"

    var styleSheet = document.createElement("style");
    styleSheet.textContent = `
        #promptLanguageSelector {
            float: right;
        }

        #promptNewHeader {
            margin: 4px;
            float: left;
        }
        
        #promptNewHeader > small {
            margin: 0px 4px 0px 4px;
        }

        #promptNewHeaderMain {
            width: 100%;
            display: flex;
            justify-content: space-between;
        }

        .translatedStrings {
            margin-top: 4px;
        }
    `;
    document.head.appendChild(styleSheet);

    const languages = {
      'Detect language': 'auto',
      'Afrikaans': 'af',
      'Albanian': 'sq',
      'Amharic': 'am',
      'Arabic': 'ar',
      'Armenian': 'hy',
      'Assamese': 'as',
      'Aymara': 'ay',
      'Azerbaijani': 'az',
      'Bambara': 'bm',
      'Basque': 'eu',
      'Belarusian': 'be',
      'Bengali': 'bn',
      'Bhojpuri': 'bho',
      'Bosnian': 'bs',
      'Bulgarian': 'bg',
      'Catalan': 'ca',
      'Cebuano': 'ceb',
      'Chichewa': 'ny',
      'Chinese (Simplified)': 'zh-CN',
      'Chinese (Traditional)': 'zh-TW',
      'Corsican': 'co',
      'Croatian': 'hr',
      'Czech': 'cs',
      'Danish': 'da',
      'Dhivehi': 'dv',
      'Dogri': 'doi',
      'Dutch': 'nl',
      'English': 'en',
      'Esperanto': 'eo',
      'Estonian': 'et',
      'Ewe': 'ee',
      'Filipino': 'tl',
      'Finnish': 'fi',
      'French': 'fr',
      'Frisian': 'fy',
      'Galician': 'gl',
      'Georgian': 'ka',
      'German': 'de',
      'Greek': 'el',
      'Guarani': 'gn',
      'Gujarati': 'gu',
      'Haitian Creole': 'ht',
      'Hausa': 'ha',
      'Hawaiian': 'haw',
      'Hebrew': 'iw',
      'Hindi': 'hi',
      'Hmong': 'hmn',
      'Hungarian': 'hu',
      'Icelandic': 'is',
      'Igbo': 'ig',
      'Ilocano': 'ilo',
      'Indonesian': 'id',
      'Irish': 'ga',
      'Italian': 'it',
      'Japanese': 'ja',
      'Javanese': 'jw',
      'Kannada': 'kn',
      'Kazakh': 'kk',
      'Khmer': 'km',
      'Kinyarwanda': 'rw',
      'Konkani': 'gom',
      'Korean': 'ko',
      'Krio': 'kri',
      'Kurdish (Kurmanji)': 'ku',
      'Kurdish (Sorani)': 'ckb',
      'Kyrgyz': 'ky',
      'Lao': 'lo',
      'Latin': 'la',
      'Latvian': 'lv',
      'Lingala': 'ln',
      'Lithuanian': 'lt',
      'Luganda': 'lg',
      'Luxembourgish': 'lb',
      'Macedonian': 'mk',
      'Maithili': 'mai',
      'Malagasy': 'mg',
      'Malay': 'ms',
      'Malayalam': 'ml',
      'Maltese': 'mt',
      'Maori': 'mi',
      'Marathi': 'mr',
      'Meiteilon (Manipuri)': 'mni-Mtei',
      'Mizo': 'lus',
      'Mongolian': 'mn',
      'Myanmar (Burmese)': 'my',
      'Nepali': 'ne',
      'Norwegian': 'no',
      'Odia (Oriya)': 'or',
      'Oromo': 'om',
      'Pashto': 'ps',
      'Persian': 'fa',
      'Polish': 'pl',
      'Portuguese': 'pt',
      'Punjabi': 'pa',
      'Quechua': 'qu',
      'Romanian': 'ro',
      'Russian': 'ru',
      'Samoan': 'sm',
      'Sanskrit': 'sa',
      'Scots Gaelic': 'gd',
      'Sepedi': 'nso',
      'Serbian': 'sr',
      'Sesotho': 'st',
      'Shona': 'sn',
      'Sindhi': 'sd',
      'Sinhala': 'si',
      'Slovak': 'sk',
      'Slovenian': 'sl',
      'Somali': 'so',
      'Spanish': 'es',
      'Sundanese': 'su',
      'Swahili': 'sw',
      'Swedish': 'sv',
      'Tajik': 'tg',
      'Tamil': 'ta',
      'Tatar': 'tt',
      'Telugu': 'te',
      'Thai': 'th',
      'Tigrinya': 'ti',
      'Tsonga': 'ts',
      'Turkish': 'tr',
      'Turkmen': 'tk',
      'Twi': 'ak',
      'Ukrainian': 'uk',
      'Urdu': 'ur',
      'Uyghur': 'ug',
      'Uzbek': 'uz',
      'Vietnamese': 'vi',
      'Welsh': 'cy',
      'Xhosa': 'xh',
      'Yiddish': 'yi',
      'Yoruba': 'yo',
      'Zulu': 'zu'
    }

    /* inject new settings in the existing system settings popup table */
    let settings = [
        {
            id: "prompt_language",
            type: ParameterType.select,
            label: "Prompt language",
            note: "write prompts in your preferred language, and have it rendered in English for best results",
            default: "english",
            options: [
            ],
            icon: "fa-language"
        }
    ];

    // language selection dropdown
    for (const [key, value] of Object.entries(languages)) {
        settings[0].options.push({ value: value, label: key })
    }

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
    const promptLanguage = document.querySelector('#prompt_language')

    // save/restore the desired language
    promptLanguage.addEventListener('change', (e) => {
        localStorage.setItem('prompt_language', promptLanguage.value)
        if (promptLanguage.value !== 'en') {
            promptField.style.color = 'lightGrey'
            promptField.style.backgroundColor = 'darkSlateGrey'
            negativePromptField.style.color = 'lightGrey'
            negativePromptField.style.backgroundColor = 'darkSlateGrey'
        }
        else
        {
            promptField.style.color = ''
            promptField.style.backgroundColor = ''
            negativePromptField.style.color = ''
            negativePromptField.style.backgroundColor = ''
        }
        translationCache = {}
    })
    promptLanguage.value = localStorage.getItem('prompt_language') == null ? 'en' : localStorage.getItem('prompt_language')
    if (promptLanguage.value !== 'en') {
        promptField.style.color = 'lightGrey'
        promptField.style.backgroundColor = 'darkSlateGrey'
        negativePromptField.style.color = 'lightGrey'
        negativePromptField.style.backgroundColor = 'darkSlateGrey'
    }

    // initialize the memory cache
    let translationCache = {} // cache local to English translation

    async function translatePrompt(localPrompt, locale) {
        if (translationCache[localPrompt] === undefined) {
            if (localPrompt !== '') {
                const englishPrompt = await translate(localPrompt, locale)
                if (englishPrompt !== undefined) {
                    translationCache[localPrompt] = englishPrompt
                    return englishPrompt
                }
                else
                {
                    return localPrompt
                }
            }
        }
        else
        {
            return translationCache[localPrompt]
        }
    }

    // Call translatePrompt() instead to have translations cached in memory
    async function translate(inputString, sourceLanguage, targetLanguage = 'en') {
        if (sourceLanguage == targetLanguage) {
            return inputString
        }
        else if (inputString.trim() !== '') {
            let url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl="+ sourceLanguage + "&tl=" + targetLanguage + "&dt=t&q=" + encodeURI(inputString)
        
            const response = await fetch(url)
            const data = await response.json()
            return data[0][0][0]
        }
    }

    PLUGINS['TASK_CREATE'].push(async function (event) {
        //console.log('prompt before: ' + event.reqBody.prompt)
        //console.log('negative prompt before: ' + event.reqBody.negative_prompt)
        // translate the prompt
        const translatedPrompt = await translatePrompt(event.reqBody.prompt, promptLanguage.value)
        if (translatedPrompt !== undefined) {
            event.reqBody.prompt = translatedPrompt
        }
        // translate the negative prompt
        const translatedNegativePrompt = await translatePrompt(event.reqBody.negative_prompt, promptLanguage.value)
        if (translatedNegativePrompt !== undefined) {
            event.reqBody.negative_prompt = translatedNegativePrompt
        }       
        //console.log('prompt after: ' + event.reqBody.prompt)
        //console.log('negative prompt after: ' + event.reqBody.negative_prompt)
        //console.log('------')
    })

    // observe for changes in the preview pane
    var observer = new MutationObserver(function (mutations) {
        if (promptLanguage.value !== 'en') {
            mutations.forEach(async function (mutation) {
                //console.log(mutation.addedNodes)
                if (mutation.addedNodes[0] !== undefined && mutation.addedNodes[0].className == 'imageTaskContainer') {
                    const task = htmlTaskMap.get(mutation.addedNodes[0])
                    const translatedPrompt = await translatePrompt(task.reqBody.prompt, promptLanguage.value) !== undefined ? await translatePrompt(task.reqBody.prompt, promptLanguage.value) : '-'
                    const translatedNegativePrompt = await translatePrompt(task.reqBody.negative_prompt, promptLanguage.value) !== undefined ? await translatePrompt(task.reqBody.negative_prompt, promptLanguage.value) : '-'
                    const taskConfig = mutation.addedNodes[0].getElementsByClassName('taskConfig')[0]
                    if (taskConfig !== undefined && task.translationAdded == undefined) {
                        task.translationAdded = true
                        taskConfig.insertAdjacentHTML("beforeend", `<div class='translatedStrings'><b>Prompt:</b> ${translatedPrompt}</br><b>Negative prompt:</b> ${translatedNegativePrompt}</div>`)
                    }                
                }
            })
        }
    })
    observer.observe(document.getElementById('preview'), {
            childList: true,
            subtree: true,
            attributes: true
    })
})()
