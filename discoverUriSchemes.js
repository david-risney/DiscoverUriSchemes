(function main() {
    "use strict";

    function getUriSchemeInfoAsync(scheme, timeoutInMs) {
        var deferral = Q.defer(),
            result = { scheme: scheme, exists: false};

        timeoutInMs = timeoutInMs || 50;

        if (typeof navigator.msLaunchUri === "function") {
            try {
                navigator.msLaunchUri(scheme + "://asdf", function () {
                    result.exists = true;
                    deferral.resolve(result);
                }, function () {
                    deferral.resolve(result); // delayed failure means a non-existant scheme.
                });
            } catch (e) { 
                result.exists = true; // Immediate failure means a disallowed scheme that exists.
                deferral.resolve(result);
            }
        } else {
            deferral.reject(new Error("Browser doesn't support navigator.msLaunchUri."));
        }

        Q.delay(timeoutInMs).then(function() {
            result.exists = true; // timeout means the scheme exists but the user cannot be prompted.
            deferral.resolve(result);
        });

        return deferral.promise;
    }

    function log(message) {
        var logElement = document.getElementById("log"),
            messageElement = document.createElement("div");

        messageElement.textContent = message;

        // logElement.appendChild(messageElement);
        logElement.textContent = message;
    }

    function uriSchemeSuccessHandler(result) {
        var foundUriSchemes = document.getElementById("foundUriSchemes"),
            schemeElement;

        if (result.exists) {
            schemeElement = document.createElement("div");
            schemeElement.textContent = result.scheme;

            foundUriSchemes.appendChild(schemeElement);
        } else {
            log(result.scheme + " doesn't exist.");
        }
    }

    function nextCombination(characterSet, text, maxLength) {
        maxLength = maxLength || text.length;
        function incrementCharacter(previousText, position) {
            var index = (characterSet.indexOf(previousText[position]) + 1) % characterSet.length,
                pre = previousText.substr(0, position),
                post = previousText.substr(position +  1, previousText.length),
                nextText = pre + characterSet[index] + post;

            if (index === 0 && position === 0) {
                if (previousText.length >= maxLength) {
                    return false;
                } else {
                    return Array.prototype.map.call(nextText + " ", function () { return characterSet[0]; }).join("");
                }
            } else if (index === 0) {
                return incrementCharacter(nextText, position - 1);
            } else {
                return nextText;
            }
        }
        return incrementCharacter(text, text.length - 1);
    }

    function checkSchemeAsync(scheme) {
        var schemeCharacters = "abcdefghijklmnopqrstuvwxyz0123456789-.+";

        return getUriSchemeInfoAsync(scheme).then(uriSchemeSuccessHandler, function (error) {
                log(scheme + " failed: " + error);
            }).then(function () {
                return Q.delay(50);
            }).then(function () {
                var nextScheme = nextCombination(schemeCharacters, scheme, 10);
                if (nextScheme) {
                    return checkSchemeAsync(nextScheme);
                }
            });
    }

    document.addEventListener("DOMContentLoaded", function () {
        checkSchemeAsync("aaa");
    });
})();
