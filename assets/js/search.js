var sindex = 0;
var cycle = false;
var sengine = "https://www.google.com/search?q="; // Default search engine

// Search providers configuration
var searchProviders = [
    { prefix: "/g", name: "Google", hint: "搜索" },
    { prefix: "/bd", name: "Baidu 百度", hint: "搜索" },
    { prefix: "/bi", name: "Bing 必应", hint: "搜索" },
    { prefix: "/gh", name: "GitHub", hint: "搜索代码" },
    { prefix: "/y", name: "YouTube", hint: "搜索视频" }
];

// Suggestion state
var suggestionIndex = -1;
var filteredProviders = [];

// Handle input event for suggestions
function handleInput(e) {
    var text = document.getElementById("keywords").value;
    var suggestionsContainer = document.getElementById("search-suggestions");

    // Only show suggestions when input starts with /
    if (text.startsWith('/') && text.indexOf(' ') === -1) {
        var prefix = text.toLowerCase();
        filteredProviders = searchProviders.filter(function(provider) {
            return provider.prefix.toLowerCase().startsWith(prefix);
        });

        if (filteredProviders.length > 0) {
            showSuggestions(filteredProviders);
        } else {
            hideSuggestions();
        }
    } else {
        hideSuggestions();
    }
}

// Show suggestions dropdown
function showSuggestions(providers) {
    var container = document.getElementById("search-suggestions");
    container.innerHTML = '';
    suggestionIndex = -1;

    providers.forEach(function(provider, index) {
        var item = document.createElement('div');
        item.className = 'suggestion-item';
        item.setAttribute('data-index', index);
        item.innerHTML =
            '<span class="suggestion-prefix">' + provider.prefix + '</span>' +
            '<span class="suggestion-name">' + provider.name + '</span>' +
            '<span class="suggestion-hint">' + provider.hint + '</span>';

        item.addEventListener('click', function() {
            selectSuggestion(index);
        });

        item.addEventListener('mouseenter', function() {
            updateSuggestionHighlight(index);
        });

        container.appendChild(item);
    });

    container.classList.add('active');
}

// Hide suggestions dropdown
function hideSuggestions() {
    var container = document.getElementById("search-suggestions");
    container.classList.remove('active');
    container.innerHTML = '';
    suggestionIndex = -1;
    filteredProviders = [];
}

// Update suggestion highlight
function updateSuggestionHighlight(index) {
    var items = document.querySelectorAll('.suggestion-item');
    items.forEach(function(item, i) {
        if (i === index) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
    suggestionIndex = index;
}

// Select a suggestion
function selectSuggestion(index) {
    if (filteredProviders[index]) {
        var input = document.getElementById("keywords");
        input.value = filteredProviders[index].prefix + ' ';
        input.focus();
        hideSuggestions();
    }
}

// Check if suggestions are visible
function isSuggestionsVisible() {
    var container = document.getElementById("search-suggestions");
    return container.classList.contains('active');
}

function start() {
    var query = getParameterByName('q');
    if (query) search(query.replaceAll("+", "%2B"));

    document.getElementById('keywords').focus();

    window.setInterval(function () {
        updatetime();
    }, 200);
}

function handleKeyPress(e) {
    var key = e.keyCode || e.which;
    var text = document.getElementById("keywords").value.replaceAll("+", "%2B");
    var option = text.substr(1, text.indexOf(' ') - 1) || text.substr(1);
    var subtext = text.substr(2 + option.length);

    // Handle suggestions navigation
    if (isSuggestionsVisible()) {
        // Arrow Down
        if (key == 40) {
            e.preventDefault();
            var newIndex = suggestionIndex + 1;
            if (newIndex >= filteredProviders.length) newIndex = 0;
            updateSuggestionHighlight(newIndex);
            return;
        }
        // Arrow Up
        if (key == 38) {
            e.preventDefault();
            var newIndex = suggestionIndex - 1;
            if (newIndex < 0) newIndex = filteredProviders.length - 1;
            updateSuggestionHighlight(newIndex);
            return;
        }
        // Enter - select suggestion if highlighted
        if (key == 13) {
            if (suggestionIndex >= 0) {
                e.preventDefault();
                selectSuggestion(suggestionIndex);
                return;
            }
        }
        // Tab - select first or current suggestion
        if (key == 9) {
            e.preventDefault();
            e.stopPropagation();
            var indexToSelect = suggestionIndex >= 0 ? suggestionIndex : 0;
            selectSuggestion(indexToSelect);
            return;
        }
        // Escape - close suggestions
        if (key == 27) {
            e.preventDefault();
            hideSuggestions();
            return;
        }
    }

    if (key == 13) { // Search functions
        search(text);
    }
    if (key == 9) { // Tab Completion Functions
        e.preventDefault();
        e.stopPropagation();
        if (text[0] === ';') {
            switch (option) {
                case 't':
                    var streamers = ['admiralbahroo', 'moonmoon_ow', 'witwix'];
                    if (!subtext || cycle) {
                        cycle = true;
                        if (sindex > streamers.length - 1) sindex = 0;
                        document.getElementById("keywords").value = ';t ' + streamers[sindex++];
                        return;
                    }
                    for (var streamer of streamers) {
                        if (subtext === streamer.substr(0, subtext.length)) {
                            document.getElementById("keywords").value = ';t ' + streamer;
                            return;
                        }
                    }
                    break;
            }
        }
    }
    if(key == 32){ //Space to go to search
        document.getElementById("keywords").focus();
    }
    sindex = 0;
    cycle = false;
}

function search(text) {
    var option = text.substr(1, text.indexOf(' ') - 1) || text.substr(1);
    var subtext = text.substr(2 + option.length);
    if (text[0] === '/') {
        if (text.indexOf(' ') > -1) {
            switch (option) {
                case "g":
                    window.location = "https://www.google.com/search?q=" + subtext;
                    break;
                case "bd":
                    window.location = "https://www.baidu.com/s?wd=" + subtext;
                    break;
                case "bi":
                    window.location = "https://www.bing.com/search?q=" + subtext;
                    break;
                case "gh":
                    window.location = "https://github.com/search?q=" + subtext;
                    break;
                case "y":
                    window.location = "https://www.youtube.com/results?search_query=" + subtext;
                    break;
            }
        } else {
            var option = text.substr(1);
            switch (option) {
                case "g":
                    window.location = "https://www.google.com";
                    break;
                case "bd":
                    window.location = "https://www.baidu.com";
                    break;
                case "bi":
                    window.location = "https://www.bing.com";
                    break;
                case "gh":
                    window.location = "https://github.com/";y
                    break;
                case "y":
                    window.location = "https://www.youtube.com";
                    break;
            }
        }
    } 
    // else if (validURL(text)) {
    //     if (containsProtocol(text))
    //         window.location = text;
    //     else
    //         window.location = "http://" + text;
    // } 
    else {
        window.location = sengine + text;
    }
}

// Source: https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url
function validURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return !!pattern.test(str);
}

function containsProtocol(str) {
    var pattern = new RegExp('^(https?:\\/\\/){1}.*', 'i');
    return !!pattern.test(str);
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};
