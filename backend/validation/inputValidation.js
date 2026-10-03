function normalizeName(value) {
    return String(value || "").trim().replace(/ +/g, " ");
}

function isValidName(value) {
    const normalized = normalizeName(value);
    const characters = Array.from(normalized);
    const isAllowedCharacter = (character) =>
        /^[A-Za-z ]$/.test(character) ||
        (/^\p{L}$/u.test(character) && /^\p{Script=Devanagari}$/u.test(character)) ||
        (/^\p{M}$/u.test(character) && /^\p{Script=Devanagari}$/u.test(character));
    const letterCount = characters.filter((character) =>
        /^[A-Za-z]$/.test(character) ||
        (/^\p{L}$/u.test(character) && /^\p{Script=Devanagari}$/u.test(character))
    ).length;

    return normalized.length >= 2 &&
        normalized.length <= 100 &&
        letterCount >= 2 &&
        characters.every(isAllowedCharacter);
}

function isValidMobileNumber(value) {
    return /^[0-9]{10}$/.test(String(value || ""));
}

module.exports = { isValidName, isValidMobileNumber, normalizeName };
