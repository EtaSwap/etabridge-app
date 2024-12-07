import tokensWithCustomFeesMainnet from './tokensWithCustomFeesMainnet.json';
import {TOKEN_CONFIG_CHAIN, TOKEN_CONFIG_SYMBOL, TokenConfig} from "./models/TokenConfig";
// @ts-ignore
import CoinUsdcLogo from './assets/img/coin-usdc.svg';
// @ts-ignore
import ChainEthLogo from './assets/img/chain-eth.svg';
// @ts-ignore
import ChainHederaLogo from './assets/img/chain-hedera.svg';

export const NETWORK: string = 'mainnet';
export const MIRRORNODE: string = 'https://mainnet-public.mirrornode.hedera.com';
export const TOKEN_WITH_CUSTOM_FEES_LIST: string[] = tokensWithCustomFeesMainnet;
export const DEFAULT_TOKENS: number[] = [0, 1];
export const QUICK_ACCESS_TOKENS= [
    '0x0000000000000000000000000000000000000000',
    '0x000000000000000000000000000000000006f89a',
    '0x00000000000000000000000000000000000cba44',
];
export const EXCHANGE_ADDRESS = '0.0.4817907';
// export const API = 'https://api.etaswap.com/v1';
export const API = 'https://api.etaswap.com/v1';
export const WHBAR_LIST = [
    '0x0000000000000000000000000000000000163b5a',
    '0x00000000000000000000000000000000001a8837',
    '0x00000000000000000000000000000000002cc823',
];

export const SUPPORTED_CHAINS = [
    1, // ETHEREUM
];

export const CHAIN_LOGO_MAP = new Map([
    [TOKEN_CONFIG_CHAIN.ETH, ChainEthLogo],
    [TOKEN_CONFIG_CHAIN.HEDERA, ChainHederaLogo],
]);

export const CHAIN_LZ_ID_MAP = new Map([
    [TOKEN_CONFIG_CHAIN.ETH, 30101],
    [TOKEN_CONFIG_CHAIN.HEDERA, 30316],
]);

export const TOKENS_LIST: TokenConfig[] = [
    {
        symbol: TOKEN_CONFIG_SYMBOL.USDC,
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        chain: TOKEN_CONFIG_CHAIN.ETH,
        decimals: 6,
        icon: CoinUsdcLogo,
    },
    {
        symbol: TOKEN_CONFIG_SYMBOL.USDC,
        address: '0x000000000000000000000000000000000006f89a',
        chain: TOKEN_CONFIG_CHAIN.HEDERA,
        decimals: 6,
        icon: CoinUsdcLogo,
    }
];

export const BRIDGE_HEDERA_ADDRESS = '0.0.7534315';

export const BRIDGE_ADDRESSES: Record<TOKEN_CONFIG_CHAIN, string> = {
    [TOKEN_CONFIG_CHAIN.HEDERA]: '0xeec0e96e53645e6e6fd5d251c6c08cf509774430',
    [TOKEN_CONFIG_CHAIN.ETH]: '0xf1a5A6C63F92bB3a90eb4B30d85486f762A32C3d',
};