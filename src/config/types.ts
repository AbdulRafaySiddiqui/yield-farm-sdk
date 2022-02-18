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
    price: BigNumber
    liquidity: BigNumber
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
    stakedTokenDetails?: TokenDetails
    isLP?: boolean
}

export interface RewardInfo {
    token: string
    details?: TokenDetails
    paused: boolean
    mintable: boolean
    rewardPerBlock: BigNumber
    lastRewardBlock: BigNumber
    accRewardPerShare: BigNumber
    supply: BigNumber
    rewards: BigNumber
}

export interface NftDeposit {
    tokenId: BigNumber
    amount: BigNumber
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
    multiplierCards: NftDeposit[]
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
    price: BigNumber
}

export interface PairToken extends TokenDetails {
    lpBalance: BigNumber
    balance: BigNumber
}

export interface LPToken extends Token {
    token0Address: string
    token1Address: string
    totalSupply: BigNumber
    balance: BigNumber
}

export interface LPDetails extends LPToken {
    token0: PairToken,
    token1: PairToken,
    totalSupply: BigNumber
}

export interface PoolState {
    loading: boolean,
    data: Pool[]
}

export interface State {
    pools: PoolState
}

