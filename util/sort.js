const sortByDate = (arraySort, sorted) => {
    arraySort.sort((value1, value2) => {
        const date1 = value1.dateTime;
        const date2 = value2.dateTime;
        if (date1 < date2) {
            return -sorted;
        }
        if (date1 > date2) {
            return sorted;
        }
        return 0;
    })
};

const sortByWorkPlace = (value1, value2, sorted) => {
    const workPlace1 = value1.workPlace.toLowerCase();
    const workPlace2 = value2.workPlace.toLowerCase();
    if (workPlace1 < workPlace2) {
        return -sorted;
    }
    if (workPlace1 > workPlace2) {
        return sorted;
    }
    return 0;
};
exports.sortByDate = sortByDate;
exports.sortByWorkPlace = sortByWorkPlace;