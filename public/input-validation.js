(() => {
    const nameSelector = "[data-validate-name]";
    const mobileSelector = "[data-validate-mobile]";

    function isNameCharacter(character) {
        return /^[A-Za-z ]$/.test(character) ||
            (/^\p{L}$/u.test(character) && /^\p{Script=Devanagari}$/u.test(character)) ||
            (/^\p{M}$/u.test(character) && /^\p{Script=Devanagari}$/u.test(character));
    }

    function filterNameCharacters(value) {
        return Array.from(value)
            .filter(isNameCharacter)
            .join("");
    }

    function cleanName(value) {
        return filterNameCharacters(value)
            .replace(/^ +/, "")
            .replace(/ {2,}/g, " ");
    }

    function cleanMobile(value) {
        return value.replace(/[^0-9]/g, "").slice(0, 10);
    }

    function validateField(input, normalize = false) {
        if (input.matches(nameSelector)) {
            const cleaned = cleanName(input.value);
            if (normalize) input.value = cleaned.trim().replace(/ {2,}/g, " ");
            const value = input.value;
            const letterCount = Array.from(value).filter((character) =>
                /^[A-Za-z]$/.test(character) ||
                (/^\p{L}$/u.test(character) && /^\p{Script=Devanagari}$/u.test(character))
            ).length;
            const valid = value.length > 0 &&
                Array.from(value).every(isNameCharacter) &&
                letterCount >= 2 &&
                value.trim().length > 0 &&
                !/ {2,}/.test(value);
            input.setCustomValidity(
                valid || (!value && !input.required)
                    ? ""
                    : "Enter a name using English or Hindi letters and spaces only."
            );
            return valid || (!value && !input.required);
        }

        if (input.matches(mobileSelector)) {
            const cleaned = cleanMobile(input.value);
            if (normalize) input.value = cleaned;
            const value = input.value;
            const valid = value.length === 10 && /^[0-9]{10}$/.test(value);
            input.setCustomValidity(
                valid || (!value && !input.required)
                    ? ""
                    : "Enter exactly 10 digits for the mobile number."
            );
            return valid || (!value && !input.required);
        }

        return true;
    }

    function updateField(input) {
        if (input.matches(nameSelector)) {
            input.value = cleanName(input.value);
        } else if (input.matches(mobileSelector)) {
            input.value = cleanMobile(input.value);
        }
        validateField(input);
    }

    document.addEventListener("input", (event) => {
        const input = event.target;
        if (event.isComposing) return;
        if (input instanceof HTMLInputElement && input.matches(`${nameSelector}, ${mobileSelector}`)) {
            updateField(input);
        }
    });

    document.addEventListener("beforeinput", (event) => {
        const input = event.target;
        if (
            !(input instanceof HTMLInputElement) ||
            !input.matches(`${nameSelector}, ${mobileSelector}`) ||
            event.isComposing ||
            event.inputType !== "insertText" ||
            event.data === null
        ) {
            return;
        }

        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? input.value.length;
        const inserted = input.matches(nameSelector)
            ? filterNameCharacters(event.data).replace(/ {2,}/g, " ")
            : cleanMobile(event.data);
        const maxLength = input.matches(mobileSelector) ? 10 : input.maxLength;
        const remaining = maxLength > 0
            ? maxLength - (input.value.length - (end - start))
            : inserted.length;

        event.preventDefault();
        input.setRangeText(inserted.slice(0, Math.max(0, remaining)), start, end, "end");
        input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    document.addEventListener("compositionend", (event) => {
        const input = event.target;
        if (input instanceof HTMLInputElement && input.matches(`${nameSelector}, ${mobileSelector}`)) {
            updateField(input);
        }
    });

    document.addEventListener("paste", (event) => {
        const input = event.target;
        if (!(input instanceof HTMLInputElement) || !input.matches(`${nameSelector}, ${mobileSelector}`)) {
            return;
        }

        event.preventDefault();
        const pasted = event.clipboardData?.getData("text") || "";
        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? input.value.length;
        const replacement = input.matches(nameSelector) ? filterNameCharacters(pasted) : cleanMobile(pasted);
        const maxLength = input.matches(mobileSelector) ? 10 : input.maxLength;
        const remaining = maxLength > 0
            ? maxLength - (input.value.length - (end - start))
            : replacement.length;
        const inserted = replacement.slice(0, Math.max(0, remaining));
        input.setRangeText(inserted, start, end, "end");
        updateField(input);
    });

    document.addEventListener("blur", (event) => {
        const input = event.target;
        if (input instanceof HTMLInputElement && input.matches(`${nameSelector}, ${mobileSelector}`)) {
            validateField(input, true);
        }
    }, true);

    document.addEventListener("submit", (event) => {
        const form = event.target;
        if (!(form instanceof HTMLFormElement)) return;

        const fields = [...form.querySelectorAll(`${nameSelector}, ${mobileSelector}`)];
        for (const field of fields) {
            validateField(field, true);
        }

        const invalidField = fields.find((field) => !field.checkValidity());
        if (invalidField) {
            event.preventDefault();
            event.stopImmediatePropagation();
            invalidField.reportValidity();
            invalidField.focus();
        }
    }, true);
})();
