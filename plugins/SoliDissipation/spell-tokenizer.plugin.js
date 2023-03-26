(() => {
  "use strict"
  const GITHUB_PAGE = "https://gitlab.com/SoliDissipation/sd-ui-plugins"
  const VERSION = "1.7.1";
  const ID_PREFIX = "spell-tokenizer-plugin";
  const GITHUB_ID = "solidissipation-plugins"
  console.log('%s Version: %s', ID_PREFIX, VERSION);

  var styleSheet = document.createElement("style");
  styleSheet.textContent = `
      .${ID_PREFIX}-spell-token {
        border: 1px solid var(--background-color3);
        display: inline-block;
        border-radius: 6px;
        color: var(--button-text-color);
        background-color: hsl(var(--accent-hue), 100%, var(--accent-lightness));
        font-size: 1rem;
        margin: 2px;
        padding: 2px 5px 2px 5px;
        user-select: none;
      }
      .${ID_PREFIX}-spell-token:hover {
        cursor: grab;
      }
      .${ID_PREFIX}-token-container {
        border: 1px dotted white;
        display: block;
        min-width: 50px;
        min-height: 2rem;
      }
      .${ID_PREFIX}-spell-token.hint {
        border: 1px solid #cc9900;
        background: var(--background-color2);
        color: #000;
      }
      .${ID_PREFIX}-spell-token.active {
        border: 1px solid #ffa5a5;
        background: #eeaa00;
        color: #000;
      }
	  .${ID_PREFIX}-spell-token.left-insert:after {
          display: inline-block;
          content: "";
          width: 0px;
          border-right: 4px solid green;
          height: 0.95rem;
          float: left;
          position: relative;
          left: -6px;
      }
      .${ID_PREFIX}-spell-token.active.left-insert {
        padding-left: 1px !important;
      }
      .${ID_PREFIX}-spell-token.right-insert:after {
          display: inline-block;
          content: "";
          width: 0px;
          border-right: 4px solid green;
          height: 0.95rem;
          float: right;
          position: relative;
          right: -6px;
      }
      .${ID_PREFIX}-spell-token.active.right-insert {
        padding-right: 1px !important;
      }
      .${ID_PREFIX}-token-counter {
        color: green;
        display: block
      }
      .${ID_PREFIX}-token-counter.over-limit {
        color: red;
      }
      .${ID_PREFIX}-spell-token.duplicate {
        border: 1px solid #cc9900;
        background: var(--background-color2);
        color: #000;
      }
      .${ID_PREFIX}-token-suggestion-container {
        display: block;
        position: absolute;
        background: var(--background-color2);
        border: 1px solid var(--background-color3);
        border-radius: 6px;
        padding: 5px;
        z-index: 1001;
        max-height: 200px;
        overflow-y: auto;
      }
      
      .${ID_PREFIX}-spell-token-suggestion {
        display: block;
        padding: 2px 5px 2px 5px;
        border-radius: 6px;
        margin: 2px;
        user-select: none;
        animation: none !important;
        transition: none !important;
        box-sizing: border-box;
      }

      .${ID_PREFIX}-spell-token-suggestion:hover {
        cursor: pointer;
        box-sizing: border-box;
        border: 1px solid #ffa5a5;
        background: #bb8800;
        color: #000;
      }
      .${ID_PREFIX}-spell-token-suggestion.active {
        box-sizing: border-box;
        border: 1px solid #ffa5a5;
        background: #eeaa00;
        color: #000;
        transition: none !important;
        animation: none !important;
      }
      .${ID_PREFIX}-tagname {
        animation: none !important;
        transition: none !important;
      }
      .${ID_PREFIX}-post-count {
        float: right;
        margin-left: 5px;
        font-family: monospace;
        animation: none !important;
        transition: none !important;
      }
    `;
  document.head.appendChild(styleSheet);

  (() => {
    const links = document.getElementById("community-links");
    if (links && !document.getElementById(`${GITHUB_ID}-link`)) {
      const pluginLink = document.createElement('li');
      pluginLink.innerHTML = `<a id="${GITHUB_ID}-link" href="${GITHUB_PAGE}" target="_blank"><i class="fa-solid fa-code-merge"></i> SoliDissipation's Plugins on GitHub</a>`;
      links.appendChild(pluginLink);
    }
  })();

  let tokenSeparator = " ";
  const tokenContainer = document.createElement('div');
  const tokenCounter = document.createElement('span');
  const textarea = document.getElementById('prompt');
  var currentSuggestionSelection = 0;

  function getWord() {
    let text = textarea.value;
    let start = textarea.selectionStart;
    let end = textarea.selectionEnd;
    let word = "";
    for (let i = start - 1; i >= 0; i--) {
      if (text[i] == " " || text[i] == ",") {
        break;
      }
      word = text[i] + word;
    }
    return word;
  }

  function getWordList() {
    let taglist = [];
    let file = new XMLHttpRequest();
    if (localStorage.getItem(`${ID_PREFIX}_taglist_sfw_setting`) == "true") {
      file.open("GET", "plugins/user/taglist_sfw.csv", false);
    } else {
      file.open("GET", "plugins/user/taglist.csv", false);
    }
    file.onreadystatechange = function () {
      if (file.readyState === 4) {
        if (file.status === 200 || file.status == 0) {
          let allText = file.responseText;
          taglist = allText.split(",");
        }
        else if (!file.responseURL.includes('/taglist.csv'))
        {
          file.open("GET", "plugins/user/taglist.csv", false);
          file.send(null);
        }
      }
    }
    file.send(null);
    return taglist;
  }

  function autocomplete() {
    let word = getWord();
    let wordlist = getWordList();
    let list = document.getElementById(`${ID_PREFIX}-list`);
    if (list) { list.remove(); }
    if (word.length > 1) {
      let list = document.createElement('div');
      list.id = `${ID_PREFIX}-list`;
      list.className = `${ID_PREFIX}-token-suggestion-container`;

      let rect = textarea.getBoundingClientRect();
      let top = rect.top + textarea.scrollTop + textarea.offsetHeight;
      let left = rect.left + textarea.scrollLeft;
      list.style.top = top + "px";
      list.style.left = left + "px";
      let count = 0;
      for (let i = 0; i < wordlist.length; i++) {
        let wordlistItem = wordlist[i].split(":")[0];
        if (wordlistItem.includes(word)) {
          let token = document.createElement('span');
          token.className = `${ID_PREFIX}-spell-token-suggestion`;
          let split = wordlist[i].split(":");
          let post_count = split.pop();
          let token_word = split.join(":");
          if (token_word != word) {
            let html_token_word = token_word.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
            token.innerHTML = `<span class="${ID_PREFIX}-tagname">${html_token_word}</span><span class="${ID_PREFIX}-post-count">${post_count}</span>`;
            token.addEventListener('click', function (e) {
              let start = textarea.selectionStart - word.length;
              let end = textarea.selectionStart;
              textarea.value = textarea.value.substring(0, start) + token_word + ':1' + tokenSeparator + textarea.value.substring(end);
              textarea.focus();
              list.remove();
              textarea.dispatchEvent(new Event('input', { bubbles: true }));
            });
            list.appendChild(token);
            count++;
          }
        }
      }
      if (count > 0) {
        document.body.appendChild(list);
        let firstItem = list.getElementsByClassName(`${ID_PREFIX}-spell-token-suggestion`)[0];
        firstItem.classList.add("active");
      }
    }
  }


  textarea.addEventListener('input', function (e) {
    if (localStorage.getItem(`${ID_PREFIX}_autocomplete_suggestions`) == "true") {
      currentSuggestionSelection = 0;
      autocomplete();
    }
  });

  textarea.addEventListener('keydown', function (e) {
    let list = document.getElementById(`${ID_PREFIX}-list`);
    if (list) {
      let items = list.getElementsByClassName(`${ID_PREFIX}-spell-token-suggestion`);
      if (e.key == "ArrowDown" || e.key == "ArrowUp") {
        e.preventDefault();
        items[currentSuggestionSelection].classList.remove("active");
        currentSuggestionSelection = (currentSuggestionSelection + (e.key == "ArrowDown" ? 1 : -1) + items.length) % items.length;
        items[currentSuggestionSelection].classList.add("active");
        list.scrollTop = items[currentSuggestionSelection].offsetTop - list.offsetHeight / 2 + items[currentSuggestionSelection].offsetHeight / 2;
      }
      if (e.key == "Enter") {
        e.preventDefault();
        items[currentSuggestionSelection].dispatchEvent(new MouseEvent("click"));
      }
      if (e.key == "Escape") {
        list.remove();
        textarea.focus();
      }
    }
  });

  document.addEventListener('click', function (e) {
    let list = document.getElementById(`${ID_PREFIX}-list`);
    if (list && !list.contains(e.target)) { list.remove(); }
  });

  function slist(target) {
    let items = target.getElementsByClassName(`${ID_PREFIX}-spell-token`), current = null;
    for (let i of items) {
      i.draggable = true;
      i.ondragstart = (e) => {
        current = i;
        for (let it of items) {
          if (it != current) { it.classList.add("hint"); }
        }
      };
      i.oncontextmenu = (e) => {
        e.preventDefault();
        e.target.parentNode.removeChild(e.target);
        applySpellString();
      };
      i.ondragenter = (e) => {
        if (i != current) {
          i.classList.add("active");
          let currentpos = 0, droppedpos = 0;
          for (let it = 0; it < items.length; it++) {
            if (current == items[it]) { currentpos = it; }
            if (i == items[it]) { droppedpos = it; }
          }
          if (currentpos < droppedpos) {
            i.classList.add('right-insert');
          } else {
            i.classList.add('left-insert');
          }
        }
      };
      i.ondragleave = () => { i.classList.remove("active"); i.classList.remove("left-insert"); i.classList.remove("right-insert"); };
      i.ondragend = () => { for (let it of items) { it.classList.remove("hint"); it.classList.remove("active"); } };
      i.ondragover = (e) => { e.preventDefault(); };
      i.ondrop = (e) => {
        e.preventDefault();
        if (i != current) {
          let currentpos = 0, droppedpos = 0;
          for (let it = 0; it < items.length; it++) {
            if (current == items[it]) { currentpos = it; }
            if (i == items[it]) { droppedpos = it; }
          }
          if (currentpos < droppedpos) {
            i.parentNode.insertBefore(current, i.nextSibling);
          } else {
            i.parentNode.insertBefore(current, i);
          }
        }
        i.classList.remove("left-insert"); i.classList.remove("right-insert");
        applySpellString();
      };
    }
  }

  function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  }

  /*
  const modToken = (e) => {
    if (e.altKey) {
      e.preventDefault();
      if (e.deltaY > 0) {
        if (e.target.innerText.startsWith('(')) e.target.innerText = e.target.innerText.slice(1, -1);
        else e.target.innerText = '[' + e.target.innerText + ']';
      } else {
        if (e.target.innerText.startsWith('[')) e.target.innerText = e.target.innerText.slice(1, -1);
        else e.target.innerText = '(' + e.target.innerText + ')';
      }
      applySpellString();
    }
  };*/

  const modToken = (e) => {
    if (e.altKey) {
      e.preventDefault();
      if (e.deltaY > 0) {
        e.target.dataset.weight = Math.round(parseFloat(e.target.dataset.weight) * (1/1.1) * 100) / 100;
      } else {
        e.target.dataset.weight = Math.round(parseFloat(e.target.dataset.weight) * (1.1) * 100) / 100;
      }
      applySpellString();
    }
  };

  function splitWeightedSubprompts(text) {
    let remaining = text.length;
    let prompts = [];
    let weights = [];
    while (remaining > 0) {
      if (text.includes(":")) {
        let idx = text.indexOf(":");
        let prompt = text.substring(0, idx);
        remaining -= idx;
        text = text.substring(idx + 1);
        if (text.includes(" ")) {
          idx = text.indexOf(" ");
        } else {
          idx = text.length;
        }
        if (idx !== 0) {
          let weight = parseFloat(text.substring(0, idx));
          let pattern = /^[+-]?\d+(\.\d+)?$/;
          if (pattern.test(text.substring(0, idx))) {
            weights.push(weight);
          } else {
            console.log(`Warning: '${text.substring(0, idx)}' is not a value, are you missing a space?`);
            weights.push(1.0);
          }
        } else {
          weights.push(1.0);
        }
        remaining -= idx;
        text = text.substring(idx + 1);
        prompts.push(prompt);
      } else {
        if (text.length > 0) {
          prompts.push(text);
          weights.push(1.0);
        }
        remaining = 0;
      }
    }
    return [prompts, weights];
  }

  const getBoorutags = (link, element, prefix) => {
    const xhr = new XMLHttpRequest();
    //check if link contains ://, if not, insert it after http or https
    if (!link.includes('://')) {
      if (link.startsWith('https')) link = 'https://' + link.substring(5);
      else if (link.startsWith('http')) link = 'http://' + link.substring(4);
      else link = 'https://' + link;
    }
    console.log(link);
    xhr.open('GET', link, true);
    let underscore = prefix.substring(prefix.length - 1) == '_';
    if (underscore) prefix = prefix.substring(0, prefix.length - 1);
    xhr.onload = () => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xhr.responseText, 'text/html');
      let tags = doc.querySelectorAll('.search-tag');
      if (tags.length == 0) tags = doc.querySelectorAll('.tag__name');
      if (tags.length == 0) tags = doc.querySelectorAll('.tag');
      if (tags.length == 0) {
        tags = doc.getElementsByTagName('a');
        tags = Array.from(tags).filter(tag => tag.href.includes('tags=') && !tag.href.includes('#') && tag.parentElement.children.length == 3);
      }

      const tagNames = [];
      tags.forEach(tag => {
        if (underscore) tagNames.push(tag.innerText.replace(/\s/g, '_'));
        else tagNames.push(tag.innerText);
      });
      if (prefix != "") prefix = prefix + ':1' + tokenSeparator;
      element.innerText = prefix + tagNames.join(':1' + tokenSeparator);
      applySpellString();
    }
    xhr.send();
  };

  const applySpellString = () => {
    let tokenContainer = document.getElementById(`${ID_PREFIX}-token-container`);
    slist(tokenContainer);
    document.getElementById('prompt').value = getSpellString(tokenContainer.childNodes);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  const getSpellString = (tokens) => {
    let spellString = "";
    for (let token of tokens) {
      spellString += token.innerText + ":" + token.dataset.weight + tokenSeparator;
    }
    return spellString.slice(0, -1*tokenSeparator.length);
  }

  const makeSettingItem = (icon, id, name, description, content) => {
    let settingsItem = document.createElement('div');
    settingsItem.innerHTML = `
      <div><i class="fa fa-${icon}"></i></div>
      <div><label for="${ID_PREFIX}_${id}">${name}</label><small>${description}</small></div>
      <div>${content}<label for="${ID_PREFIX}_${id}"></label></div></div>
    `;
    return settingsItem;
  };


  const tokenizerAction = (e) => {
    e.target.value = e.target.value.replace(/:\/\//g, '');
    let [tokens, weights] = splitWeightedSubprompts(e.target.value);//e.target.value.split(',');
    console.log(tokens, weights);
    let tokenCount = Math.floor(e.target.value.length / 2.9);
    if (tokenCount > 75) {
      tokenCounter.classList.add("over-limit");
    } else {
      tokenCounter.classList.remove("over-limit");
    }
    tokenCounter.innerText = tokenCount;
    tokenContainer.innerHTML = "";
    for (let i = 0; i < tokens.length; i++) {
      let newToken = document.createElement('span');
      newToken.classList.add(`${ID_PREFIX}-spell-token`);
      newToken.title = weights[i];
      newToken.dataset.weight = weights[i];
      if (tokens[i].match(/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b[-a-zA-Z0-9@:%_\+.~#?&=]*/) && (tokens[i].includes('booru') || tokens[i].includes('yande.re'))) {
        getBoorutags("http" + tokens[i].split('http')[1], newToken, tokens[i].split('http')[0]);
      } else {
        newToken.innerText = tokens[i];
      }
      newToken.onwheel = modToken;
      //font size to scale with token weight
      newToken.style.fontSize = `${weights[i]}rem`;
      if (localStorage.getItem(`${ID_PREFIX}_duplicate_token_highlight`) === "true") {
        if (tokenContainer.querySelectorAll(`.${ID_PREFIX}-spell-token`).length > 0) {
          for (let existingToken of tokenContainer.querySelectorAll(`.${ID_PREFIX}-spell-token`)) {
            if (existingToken.innerText.replaceAll('_', ' ').trim().includes(newToken.innerText.replaceAll('_', ' ').trim())) {
              newToken.classList.add("duplicate");
            }
          }
        }
      }
      tokenContainer.appendChild(newToken);
    }
    slist(tokenContainer);
  };

  tokenContainer.classList.add(`${ID_PREFIX}-token-container`);
  tokenContainer.id = `${ID_PREFIX}-token-container`;

  insertAfter(tokenContainer, textarea);
  tokenCounter.classList.add(`${ID_PREFIX}-token-counter`);
  tokenCounter.id = `${ID_PREFIX}-token-counter`;
  insertAfter(tokenCounter, tokenContainer);
  textarea.addEventListener('input', tokenizerAction);
  textarea.addEventListener('change', tokenizerAction);
  document.getElementById('prompt').dispatchEvent(new Event('input', { bubbles: true }));
  const settingsTable = document.getElementsByClassName('parameters-table')[0];

  let duplicateTokenHighlightCheckbox = `<input type="checkbox" id="${ID_PREFIX}_duplicate_token_highlight" name="${ID_PREFIX}_duplicate_token_highlight" value="true" ${localStorage.getItem(`${ID_PREFIX}_duplicate_token_highlight`) === 'true' ? 'checked' : ''}>`;
  let toggleWrapper = `<div class="input-toggle">${duplicateTokenHighlightCheckbox}<label for="${ID_PREFIX}_duplicate_token_highlight"></label></div>`;
  settingsTable.appendChild(makeSettingItem('hand-sparkles', 'duplicate_token_highlight', 'Highlight duplicate Tokens', 'For spell tokenizer plugin', toggleWrapper));
  document.getElementById(`${ID_PREFIX}_duplicate_token_highlight`).addEventListener('input', (e) => {
    localStorage.setItem(`${ID_PREFIX}_duplicate_token_highlight`, e.target.checked);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  });

  let autocompleteSuggestionsCheckbox = `<input type="checkbox" id="${ID_PREFIX}_autocomplete_suggestions" name="${ID_PREFIX}_autocomplete_suggestions" value="true" ${localStorage.getItem(`${ID_PREFIX}_autocomplete_suggestions`) === 'true' ? 'checked' : ''}>`;
  let toggleWrapper2 = `<div class="input-toggle">${autocompleteSuggestionsCheckbox}<label for="${ID_PREFIX}_autocomplete_suggestions"></label></div>`;
  settingsTable.appendChild(makeSettingItem('hand-sparkles', 'autocomplete_suggestions', 'Autocomplete Suggestions', 'For spell tokenizer plugin', toggleWrapper2));
  document.getElementById(`${ID_PREFIX}_autocomplete_suggestions`).addEventListener('input', (e) => {
    localStorage.setItem(`${ID_PREFIX}_autocomplete_suggestions`, e.target.checked);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
  );
  let taglistSfwCheckbox = `<input type="checkbox" id="${ID_PREFIX}_taglist_sfw_setting" name="${ID_PREFIX}_taglist_sfw_setting" value="true" ${localStorage.getItem(`${ID_PREFIX}_taglist_sfw_setting`) === 'true' ? 'checked' : ''}>`;
  let toggleWrapper3 = `<div class="input-toggle">${taglistSfwCheckbox}<label for="${ID_PREFIX}_taglist_sfw_setting"></label></div>`;
  settingsTable.appendChild(makeSettingItem('hand-sparkles', 'taglist_sfw_setting', 'Only display SFW Tags in suggestion (from taglist_sfw file, if it exists)', 'For spell tokenizer plugin', toggleWrapper3));
  document.getElementById(`${ID_PREFIX}_taglist_sfw_setting`).addEventListener('input', (e) => {
    localStorage.setItem(`${ID_PREFIX}_taglist_sfw_setting`, e.target.checked);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
  );
  if (localStorage.getItem(`${ID_PREFIX}_taglist_sfw_setting`) === null) {
    localStorage.setItem(`${ID_PREFIX}_taglist_sfw_setting`, 'true');
  }
})();
