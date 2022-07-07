'use strict'

const categories = {
    'Фото': 'd/elektronika/foto-video/tsifrovye-fotoapparaty/',
    'Ноутбуки': 'd/elektronika/noutbuki-i-aksesuary/noutbuki/',
    'Объективы': 'd/elektronika/foto-video/obektivy/',
    'Планшеты': 'd/elektronika/planshety-el-knigi-i-aksessuary/planshetnye-kompyutery/'
}

const fotoBrands = {
    Canon: '[ck][ae]non',
    Nikon: 'ni[ck][oa]n',
    Sony: '[sc]on[yi]',
    Fujifilm: 'fu[jg]i(film)?\\b',
    Olympus: 'ol[iy]mpus',
    Panasonic: 'pana[sc]oni[ck]',
    Sigma: '[sc]igma',
    Back: 'Back'
}

const laptopBrands = {
    Apple: 'app?le',
    Dell: 'dell?',
    Asus: 'A[sc]u[sc]',
    Back: 'Back'
}

const allBrands = {...fotoBrands, ...laptopBrands};


const yesNo = ['Да', 'Нет'];
const options = ['Мои запросы'];

const startBtn = {
    search: 'Создать новый поиск',
    options: 'Журнал существующих запросов'
}

module.exports = {
    fotoBrands,
    laptopBrands,
    yesNo,
    categories,
    startBtn,
    options,
    allBrands
};