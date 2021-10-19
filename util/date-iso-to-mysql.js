module.exports = (date) => {
    return new Date(date)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ")
        .replace("Z", "");
}