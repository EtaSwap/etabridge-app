export enum TOKEN_CONFIG_SYMBOL {
    USDC = 'USDC',
}

export enum TOKEN_CONFIG_CHAIN {
    ETH = 'ETH',
    HEDERA = 'HEDERA',
}

export interface TokenConfig {
    symbol: TOKEN_CONFIG_SYMBOL;
    address: string;
    chain: TOKEN_CONFIG_CHAIN;
    decimals: number;
    icon: string;
}
