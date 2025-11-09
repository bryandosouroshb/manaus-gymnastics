// Data mapping for countries usando fromCodePoint para garantir compatibilidade
const FLAGS = {
    USA: String.fromCodePoint(0x1F1FA, 0x1F1F8),  // US flag
    BRA: String.fromCodePoint(0x1F1E7, 0x1F1F7),  // BR flag
    CAN: String.fromCodePoint(0x1F1E8, 0x1F1E6),  // CA flag
    ITA: String.fromCodePoint(0x1F1EE, 0x1F1F9),  // IT flag
    ROM: String.fromCodePoint(0x1F1F7, 0x1F1F4),  // RO flag
    CHN: String.fromCodePoint(0x1F1E8, 0x1F1F3),  // CN flag
    GBR: String.fromCodePoint(0x1F1EC, 0x1F1E7),  // GB flag
    FRA: String.fromCodePoint(0x1F1EB, 0x1F1F7)   // FR flag
};

window.countryData = {
    'USA': { name: 'UNITED STATES OF AMERICA', flag: FLAGS.USA, symbol: '🔵', color: '#0078d0', code: 'us' },
    'BRA': { name: 'BRAZIL', flag: FLAGS.BRA, symbol: '🟢', color: '#198754', code: 'br' },
    'CAN': { name: 'CANADA', flag: FLAGS.CAN, symbol: '🔴', color: '#dc3545', code: 'ca' },
    'ITA': { name: 'ITALY', flag: FLAGS.ITA, symbol: '✳️', color: '#198754', code: 'it' },
    'ROM': { name: 'ROMANIA', flag: FLAGS.ROM, symbol: '🟡', color: '#ffc107', code: 'ro' },
    'CHN': { name: 'PEOPLE\'S REPUBLIC OF CHINA', flag: FLAGS.CHN, symbol: '🈴️', color: '#dc3545', code: 'cn' },
    'GBR': { name: 'GREAT BRITAIN', flag: FLAGS.GBR, symbol: '🟣', color: '#6f42c1', code: 'gb' },
    'FRA': { name: 'FRANCE', flag: FLAGS.FRA, symbol: '🔷️', color: '#0d6efd', code: 'fr' },
    'DEFAULT': { name: '', flag: '', symbol: '', color: '#6c757d', code: 'xx' }
};

// Função global para obter código do país
window.getCountryCode = function(countryCode) {
    if (!countryCode || typeof countryCode !== 'string') {
        return 'xx'; // Código padrão para países não reconhecidos
    }
    
    const country = window.countryData[countryCode.toUpperCase()];
    return country ? country.code : 'xx';
};

// Função global para obter bandeira do país
window.getCountryFlag = function(countryCode) {
    console.log('[Countries] getCountryFlag chamada com:', countryCode);
    if (!countryCode || typeof countryCode !== 'string') {
        console.log('[Countries] countryCode invalido');
        return ''; 
    }
    
    const country = window.countryData[countryCode.toUpperCase()];
    const flag = country ? country.flag : '';
    console.log('[Countries] Flag retornada:', flag, 'Length:', flag.length);
    return flag;
};

// Função global para obter nome do país
window.getCountryName = function(countryCode) {
    if (!countryCode || typeof countryCode !== 'string') {
        return ''; 
    }
    
    const country = window.countryData[countryCode.toUpperCase()];
    return country ? country.name : '';
};