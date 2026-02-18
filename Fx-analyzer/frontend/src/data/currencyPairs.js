export const CURRENCY_PAIRS = [
    // Major Pairs
    { symbol: 'EURUSD', name: 'EUR/USD', base: 'EUR', quote: 'USD', category: 'major', pip: 0.0001 },
    { symbol: 'GBPUSD', name: 'GBP/USD', base: 'GBP', quote: 'USD', category: 'major', pip: 0.0001 },
    { symbol: 'USDJPY', name: 'USD/JPY', base: 'USD', quote: 'JPY', category: 'major', pip: 0.01 },
    { symbol: 'USDCHF', name: 'USD/CHF', base: 'USD', quote: 'CHF', category: 'major', pip: 0.0001 },
    { symbol: 'AUDUSD', name: 'AUD/USD', base: 'AUD', quote: 'USD', category: 'major', pip: 0.0001 },
    { symbol: 'USDCAD', name: 'USD/CAD', base: 'USD', quote: 'CAD', category: 'major', pip: 0.0001 },
    { symbol: 'NZDUSD', name: 'NZD/USD', base: 'NZD', quote: 'USD', category: 'major', pip: 0.0001 },

    // Cross Pairs
    { symbol: 'EURGBP', name: 'EUR/GBP', base: 'EUR', quote: 'GBP', category: 'cross', pip: 0.0001 },
    { symbol: 'EURJPY', name: 'EUR/JPY', base: 'EUR', quote: 'JPY', category: 'cross', pip: 0.01 },
    { symbol: 'GBPJPY', name: 'GBP/JPY', base: 'GBP', quote: 'JPY', category: 'cross', pip: 0.01 },
    { symbol: 'EURCHF', name: 'EUR/CHF', base: 'EUR', quote: 'CHF', category: 'cross', pip: 0.0001 },
    { symbol: 'EURAUD', name: 'EUR/AUD', base: 'EUR', quote: 'AUD', category: 'cross', pip: 0.0001 },
    { symbol: 'EURCAD', name: 'EUR/CAD', base: 'EUR', quote: 'CAD', category: 'cross', pip: 0.0001 },
    { symbol: 'GBPCHF', name: 'GBP/CHF', base: 'GBP', quote: 'CHF', category: 'cross', pip: 0.0001 },
    { symbol: 'GBPAUD', name: 'GBP/AUD', base: 'GBP', quote: 'AUD', category: 'cross', pip: 0.0001 },
    { symbol: 'AUDJPY', name: 'AUD/JPY', base: 'AUD', quote: 'JPY', category: 'cross', pip: 0.01 },
    { symbol: 'CADJPY', name: 'CAD/JPY', base: 'CAD', quote: 'JPY', category: 'cross', pip: 0.01 },
    { symbol: 'CHFJPY', name: 'CHF/JPY', base: 'CHF', quote: 'JPY', category: 'cross', pip: 0.01 },

    // Exotic Pairs
    { symbol: 'USDSGD', name: 'USD/SGD', base: 'USD', quote: 'SGD', category: 'exotic', pip: 0.0001 },
    { symbol: 'USDHKD', name: 'USD/HKD', base: 'USD', quote: 'HKD', category: 'exotic', pip: 0.0001 },
    { symbol: 'USDMXN', name: 'USD/MXN', base: 'USD', quote: 'MXN', category: 'exotic', pip: 0.0001 },
    { symbol: 'USDZAR', name: 'USD/ZAR', base: 'USD', quote: 'ZAR', category: 'exotic', pip: 0.0001 },
    { symbol: 'USDTRY', name: 'USD/TRY', base: 'USD', quote: 'TRY', category: 'exotic', pip: 0.0001 },
];

export const getPairBySymbol = (symbol) => {
    return CURRENCY_PAIRS.find(pair => pair.symbol === symbol || pair.name === symbol);
};

export const getPairsByCategory = (category) => {
    return CURRENCY_PAIRS.filter(pair => pair.category === category);
};

export const formatPrice = (price, symbol) => {
    const pair = getPairBySymbol(symbol);
    if (!pair) return price.toFixed(5);

    const decimals = pair.pip === 0.01 ? 2 : 5;
    return parseFloat(price).toFixed(decimals);
};
