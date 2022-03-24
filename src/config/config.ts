import BigNumber from "bignumber.js";

// Big Number
BigNumber.config({
    EXPONENTIAL_AT: 1000,
    DECIMAL_PLACES: 80,
});

// BSC MAINNET
export const EXCHANGE_ROUTERS_ADDRESS = process.env
    .REACT_APP_EXCHANGE_ROUTERS_ADDRESS as string;
export const EXCHANGE_FACTORY_ADDRESS = process.env
    .REACT_APP_EXCHANGE_FACTORY_ADDRESS as string;
export const WRAPPED_NATIVE = process.env.REACT_APP_WRAPPED_NATIVE as string;
export const LP_NAME = process.env.REACT_APP_LP_NAME as string;
export const ETH_USD_PAIR = process.env.REACT_APP_ETH_USD_PAIR as string;

// export const EXCHANGE_ROUTERS_ADDRESS = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
// export const EXCHANGE_FACTORY_ADDRESS = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
// export const WRAPPED_NATIVE = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'
export const PROJECT_ID = parseInt(process.env.REACT_APP_PROJECT_ID as string);
export const FARM_ADDRESS = process.env.REACT_APP_FARM_ADDRESS as string;
export const PROJECT_HANDLER_ADDRESS = process.env
    .REACT_APP_PROJECT_HANDLER as string;
export const CARD_HANDLER_ADDRESS = process.env
    .REACT_APP_CARD_HANDLER as string;
export const REFERRAL_ADDRESS = process.env.REACT_APP_REFERRAL as string;
export const POOL_CARDS_ADDRESS = process.env
    .REACT_APP_POOL_CARDS_ADDRESS as string;
