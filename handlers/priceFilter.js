'use strict'

function sortPrice(data, ascending = true) {
    const sorted = data.map(el => { 
        el.price = parseInt(el.price.replace(' ', ''));
        return el;
    }).sort((a, b) => ascending ? a.price - b.price : b.price - a.price);
    return sorted;
}

function getBenefitPrice(data, maxPrice) {
    return sortPrice(data).filter(el => maxPrice >= el.price && el.price >= (maxPrice - maxPrice * 0.7))
}

module.exports = { getBenefitPrice };
