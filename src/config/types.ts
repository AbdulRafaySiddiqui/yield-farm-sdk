import { Token, TokenStandard } from "@react-dapp/utils";
import BigNumber from "bignumber.js";

export interface FarmSdkConfig {
    provider: any
}

export interface Project {
    projectId: number
    admin: string
    adminReward: number
    initialized: boolean
    paused: boolean
    poolCards: string
    rewardFee: number
    startBlock: number
    pools: Pool[]
}

export interface PoolStats {
    price: BigNumber | undefined
    liquidity: BigNumber | undefined
    apy: (number | undefined | null)[]
}

export interface Pool {
    projectId: number
    poolId: number
    lockDeposit: boolean
    totalShares: BigNumber
    depositFee: number
    minWithdrawlFee: number
    maxWithdrawlFee: number
    withdrawlFeeReliefInterval: number
    minDeposit: BigNumber
    harvestInterval: number
    stakedToken: string
    stakedTokenStandard: TokenStandard
    stakedAmount: BigNumber
    stakedTokenId: BigNumber
    rewardInfo: RewardInfo[]
    requiredCards: NftDeposit[]
    userInfo?: UserInfo
    userRewardInfo?: UserRewardInfo[],
    stakeTokenApproved?: boolean
    poolCardsApproved?: boolean
    stats?: PoolStats
    stakedTokenDetails?: TokenAndLPDetails
    isLP?: boolean
}

export interface RewardInfo {
    token: string
    details?: TokenAndLPDetails
    paused: boolean
    mintable: boolean
    rewardPerBlock: BigNumber
    lastRewardBlock: BigNumber
    accRewardPerShare: BigNumber
    supply: BigNumber
    rewards: BigNumber
}

export interface NftDeposit {
    tokenId: number
    amount: number
}

export interface UserInfo {
    amount: BigNumber
    shares: BigNumber
    shareMultiplier: number
    canHarvestAt: number
    harvestRelief: number
    withdrawFeeDiscount: number
    depositFeeDiscount: number
    stakedTimestamp: number
}

export interface UserRewardInfo {
    rewardDebt: BigNumber
    rewardLockedUp: number
}

// order should be same as in contract
export interface DepositInfo {
    projectId: number
    poolId: number
    amount: string
    depositFeeCards: NftDeposit[]
    withdrawFeeCards: NftDeposit[]
    harvestCards: NftDeposit[]
    multiplierCards: NftDeposit[],
    requiredCardId: number,
    referrer: string
}

export interface HarvestInfo {
    projectId: number
    poolId: number
}

// order should be same as in contract
export interface WithdrawInfo {
    projectId: number
    poolId: number
    amount: string
}
export interface TokenDetails extends Token {
    lp: string
    totalSupply: BigNumber
    balance: BigNumber
}
export interface TokenAndPriceDetails extends TokenDetails {
    price: BigNumber
}
export interface LPAndPriceDetails extends Token {
    price: BigNumber
    totalSupply: BigNumber
    balance: BigNumber
}
export interface PairTokenAndPriceDetails extends Token {
    price: BigNumber,
    totalSupply: BigNumber
    balance: BigNumber
    lpBalance: BigNumber
}
export interface LPToken extends Token {
    token0Address: string
    token1Address: string
    totalSupply: BigNumber
    balance: BigNumber
}
export interface LPDetails extends LPToken {
    token0: PairTokenAndPriceDetails,
    token1: PairTokenAndPriceDetails,
}
export interface TokenAndLPDetails extends Token {
    totalSupply: BigNumber
    balance: BigNumber,
    price?: BigNumber
}

export interface PoolState {
    loading: boolean,
    data: Pool[]
}

export interface State {
    pools: PoolState
}

