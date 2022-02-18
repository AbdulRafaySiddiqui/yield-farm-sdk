import { ERC1155_ABI, ERC20_ABI, ERC721_ABI, getApy, LP_ABI, toBigNumber, TokenStandard, toLowerUnit } from "@react-dapp/utils";
import { CARD_HANDLER_ADDRESS, ETH_USD_PAIR, EXCHANGE_FACTORY_ADDRESS, FARM_ADDRESS, LP_NAME, POOL_CARDS_ADDRESS, PROJECT_HANDLER_ADDRESS, WRAPPED_NATIVE } from "../../config";
import PROJECT_HANDLER_ABI from '../../assets/abi/project_handler.json';
import CARD_HANDLER_ABI from '../../assets/abi/card_handler.json';
import FACTORY_ABI from '../../assets/abi/pancakeswap_factory_abi.json';
import FARM_ABI from '../../assets/abi/farm.json';
import { LPDetails, LPToken, NftDeposit, Pool, Project, RewardInfo, TokenDetails } from "../../config/types";
import {
    ContractCallContext,
    ContractCallResults,
    Multicall,
} from 'ethereum-multicall';
import BigNumber from "bignumber.js";
import { Contract, providers } from "ethers";
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const fetchPools = async (ethersProvider: providers.Provider, projectId: number, account: string) => {
    if (!ethersProvider || !account) return;

    const EthPriceInBUSD = Object.values(await getLPInfo(ethersProvider, [ETH_USD_PAIR]))[0].token0.price

    const projectHandler = new Contract(PROJECT_HANDLER_ADDRESS, PROJECT_HANDLER_ABI, ethersProvider)
    const _project = await projectHandler.getProjectInfo('0');

    const project: Project = {
        projectId: projectId,
        admin: _project.admin,
        adminReward: toBigNumber(_project.adminReward).toNumber(),
        initialized: _project.initialized,
        paused: _project.paused,
        poolCards: _project.poolCards,
        rewardFee: toBigNumber(_project.rewardFee).toNumber(),
        startBlock: toBigNumber(_project.startBlock).toNumber(),
        pools: _project.pools.map((e: any, i: number): Pool => {
            return {
                poolId: i,
                projectId: projectId,
                stakedTokenStandard: e.stakedTokenStandard as number,
                stakedTokenId: toBigNumber(e.stakedTokenId),
                stakedToken: e.stakedToken,
                stakedAmount: toBigNumber(e.stakedAmount),
                lockDeposit: e.lockDeposit,
                minDeposit: toBigNumber(e.minDeposit),
                harvestInterval: toBigNumber(e.harvestInterval).toNumber(),
                depositFee: toBigNumber(e.depositFee).toNumber(),
                minWithdrawlFee: toBigNumber(e.minWithdrawlFee).toNumber(),
                maxWithdrawlFee: toBigNumber(e.maxWithdrawlFee).toNumber(),
                totalShares: toBigNumber(e.totalShares),
                withdrawlFeeReliefInterval: e.withdrawlFeeReliefInterval,
                requiredCards: [],
                rewardInfo: [],
            }
        })
    }

    const multicall = new Multicall({ ethersProvider: ethersProvider, tryAggregate: false })
    const poolCallContext: ContractCallContext[] = []

    for (let i = 0; i < project.pools.length; i++) {
        const e = project.pools[i];
        poolCallContext.push({
            reference: `rewardInfo-${e.poolId}`,
            contractAddress: PROJECT_HANDLER_ADDRESS,
            abi: PROJECT_HANDLER_ABI,
            calls: [{
                reference: 'getRewardInfo', methodName: 'getRewardInfo', methodParameters: [e.projectId, e.poolId]
            }],
        })
        poolCallContext.push({
            reference: `requiredCards-${e.poolId}`,
            contractAddress: CARD_HANDLER_ADDRESS,
            abi: CARD_HANDLER_ABI,
            calls: [{
                reference: 'getPoolRequiredCards', methodName: 'getPoolRequiredCards', methodParameters: [e.projectId, e.poolId]
            }],
        })
        poolCallContext.push({
            reference: `pendingRewards-${e.poolId}`,
            contractAddress: FARM_ADDRESS,
            abi: FARM_ABI,
            calls: [{
                reference: 'pendingRewards', methodName: 'pendingRewards', methodParameters: [e.projectId, e.poolId, account]
            }],
        })
        poolCallContext.push({
            reference: `userInfo-${e.poolId}`,
            contractAddress: FARM_ADDRESS,
            abi: FARM_ABI,
            calls: [{
                reference: 'userInfo', methodName: 'userInfo', methodParameters: [e.projectId, e.poolId, account]
            }],
        })
        poolCallContext.push({
            reference: `stakedTokenApproval-${e.poolId}`,
            contractAddress: e.stakedToken,
            abi: e.stakedTokenStandard === TokenStandard.ERC20 ? ERC20_ABI
                : e.stakedTokenStandard === TokenStandard.ERC721 ? ERC721_ABI : ERC1155_ABI,
            calls: [{
                reference: 'stakedTokenApproval',
                methodName: e.stakedTokenStandard === TokenStandard.ERC20 ? 'allowance' : 'isApprovedForAll',
                methodParameters: [account, FARM_ADDRESS]
            }]
        })
        poolCallContext.push({
            reference: `poolCardsApproval-${e.poolId}`,
            contractAddress: POOL_CARDS_ADDRESS,
            abi: ERC1155_ABI,
            calls: [{
                reference: 'poolCardsApproval', methodName: 'isApprovedForAll', methodParameters: [account, FARM_ADDRESS]
            }],
        })
    }

    const resultsCall: ContractCallResults = await multicall.call(poolCallContext);

    for (let i = 0; i < project.pools.length; i++) {
        const e = project.pools[i];

        // pendingRewards
        const rawRewards = resultsCall.results[`pendingRewards-${e.poolId}`].callsReturnContext.shift()?.returnValues
        const rewards = rawRewards?.map((e) => toBigNumber(e))

        // rewardInfo
        const rawRewardInfos = resultsCall.results[`rewardInfo-${e.poolId}`].callsReturnContext.shift()?.returnValues
        e.rewardInfo = rawRewardInfos?.map((e, k): RewardInfo => {
            const [token, paused, mintable, rewardPerBlock, lastRewardBlock, accRewardPerShare, supply] = e;
            return {
                token,
                paused,
                mintable,
                accRewardPerShare: toBigNumber(accRewardPerShare),
                lastRewardBlock: toBigNumber(lastRewardBlock),
                rewardPerBlock: toBigNumber(rewardPerBlock),
                supply: toBigNumber(supply),
                rewards: rewards ? rewards[k] : new BigNumber(0)
            }
        }) ?? []

        // requireCards
        const rawRequiredCards = resultsCall.results[`requiredCards-${e.poolId}`].callsReturnContext.shift()?.returnValues
        e.requiredCards = rawRequiredCards?.map((e): NftDeposit => {
            const [tokenId, amount] = e;
            return {
                tokenId: toBigNumber(tokenId),
                amount: toBigNumber(amount)
            }
        }) ?? []

        // userInfo
        const rawUserInfo = resultsCall.results[`userInfo-${e.poolId}`].callsReturnContext.shift()?.returnValues
        const [amount, shares, shareMultiplier, canHarvestAt, harvestRelief, withdrawFeeDiscount, stakedTimestamp] = rawUserInfo ?? [];
        e.userInfo = {
            amount: toBigNumber(amount),
            shares: toBigNumber(shares),
            shareMultiplier: toBigNumber(shareMultiplier).toNumber(),
            canHarvestAt: toBigNumber(canHarvestAt).toNumber(),
            harvestRelief: toBigNumber(harvestRelief).toNumber(),
            withdrawFeeDiscount: toBigNumber(withdrawFeeDiscount).toNumber(),
            depositFeeDiscount: toBigNumber(withdrawFeeDiscount).toNumber(), // TODO: use depositFeeDiscount
            stakedTimestamp: toBigNumber(stakedTimestamp).toNumber(),
        }

        // staked token approval
        const allowance = resultsCall.results[`stakedTokenApproval-${e.poolId}`].callsReturnContext.shift()?.returnValues.shift()
        e.stakeTokenApproved = e.stakedTokenStandard === TokenStandard.ERC20 ? toBigNumber(allowance).gt(0) : allowance

        // pool cards approval
        const isApprovedForAll = resultsCall.results[`stakedTokenApproval-${e.poolId}`].callsReturnContext.shift()?.returnValues.shift()
        e.poolCardsApproved = isApprovedForAll
    }

    // get pool stats
    let tokens: string[] = []
    for (let i = 0; i < project.pools.length; i++) {
        const element = project.pools[i];
        tokens = [...tokens, element.stakedToken, ...element.rewardInfo.map(e => e.token)]
    }
    const tokenPrices = await getTokenAndLPPrices(ethersProvider, tokens, EthPriceInBUSD, account)
    for (let i = 0; i < project.pools.length; i++) {
        const pool = project.pools[i]
        const stakeTokenDetails = tokenPrices[pool.stakedToken]
        project.pools[i].stakedTokenDetails = stakeTokenDetails.details
        project.pools[i].isLP = stakeTokenDetails.isLP
        if (stakeTokenDetails) {
            project.pools[i].stats = {
                price: stakeTokenDetails?.details.price,
                liquidity: stakeTokenDetails?.details.price.times(toLowerUnit(pool.stakedAmount.toFixed(), stakeTokenDetails.details.decimals)),
                apy: pool.rewardInfo.map((e, j) => {
                    const rewardTokenDetails = tokenPrices[e.token]
                    project.pools[i].rewardInfo[j].details = rewardTokenDetails?.details
                    if (rewardTokenDetails)
                        return getApy(
                            stakeTokenDetails.details.price.toFixed(),
                            rewardTokenDetails?.details.price.toFixed(),
                            toLowerUnit(pool.stakedAmount.toFixed(), stakeTokenDetails?.details.decimals).toFixed(),
                            toLowerUnit(e.rewardPerBlock.toFixed(), rewardTokenDetails?.details.decimals).toNumber(),
                        )
                })
            }
        }
    }
    return project
}

const areLPTokens = async (ethers: providers.Provider, tokens: string[]) => {
    if (tokens.length === 0) return {}

    const multicall = new Multicall({ ethersProvider: ethers, tryAggregate: false });
    const call = tokens.map(e => {
        return {
            reference: e,
            contractAddress: e,
            abi: ERC20_ABI,
            calls: [{
                reference: e,
                methodName: "name",
                methodParameters: [],
            }]
        }
    })
    const data = (await multicall.call(call)).results
    const lpTokens: {
        [key: string]: boolean
    } = {}
    tokens.forEach(e => lpTokens[e] = data[e].callsReturnContext[0].returnValues[0] === LP_NAME)
    return lpTokens
}

const findLPTokens = async (ethers: providers.Provider, tokens: string[]) => {
    if (tokens.length === 0) return {}
    const multicall = new Multicall({ ethersProvider: ethers, tryAggregate: false });
    const call = {
        reference: 'getPair',
        contractAddress: EXCHANGE_FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        calls: tokens.map((token) => {
            return {
                reference: token,
                methodName: "getPair",
                methodParameters: [token, WRAPPED_NATIVE],
            }
        })
    }
    const data = (await multicall.call(call)).results.getPair.callsReturnContext
    const lpTokens: {
        [key: string]: string
    } = {}
    for (let i = 0; i < data.length; i++) {
        const element = data[i];
        lpTokens[element.reference] = element.returnValues[0]
    }
    return lpTokens
}

const getLPInfo = async (ethers: providers.Provider, lpTokens: string[], userAccount: string = ZERO_ADDRESS) => {
    if (lpTokens.length === 0) return {}

    const multicall = new Multicall({ ethersProvider: ethers, tryAggregate: false });
    // get LP Info
    const lpInfoCall = lpTokens.map((address) => {
        return {
            reference: address,
            contractAddress: address,
            abi: LP_ABI,
            calls: [
                {
                    reference: "token0",
                    methodName: "token0",
                    methodParameters: [],
                },
                {
                    reference: "token1",
                    methodName: "token1",
                    methodParameters: [],
                },
                {
                    reference: "name",
                    methodName: "name",
                    methodParameters: [],
                },
                {
                    reference: "symbol",
                    methodName: "symbol",
                    methodParameters: [],
                },
                {
                    reference: "decimals",
                    methodName: "decimals",
                    methodParameters: [],
                },
                {
                    reference: "totalSupply",
                    methodName: "totalSupply",
                    methodParameters: [],
                },
                {
                    reference: "balanceOf",
                    methodName: "balanceOf",
                    methodParameters: [userAccount],
                },
            ]
        }
    })
    const lpData = Object.values((await multicall.call(lpInfoCall)).results)
    const lpTokenData: { [key: string | number]: LPToken } = {}
    for (let i = 0; i < lpData.length; i++) {
        const element = lpData[i].callsReturnContext
        const lp = {
            address: lpData[i].originalContractCallContext.reference,
            token0Address: element[0].returnValues[0],
            token1Address: element[1].returnValues[0],
            name: element[2].returnValues[0],
            symbol: element[3].returnValues[0],
            decimals: Number(element[4].returnValues[0]),
            totalSupply: toBigNumber(element[5].returnValues[0]),
            balance: toBigNumber(element[6].returnValues[0]),
        }
        lpTokenData[lpData[i].originalContractCallContext.reference] = lp
    }

    // get pair tokens info
    const token0InfoCall = Object.values(lpTokenData).map((e) => {
        return {
            // use unique reference so the reference for same tokens won't collide
            // if it collides all info will be same except the balance of LP, cause lp is different in each case
            reference: e.address + e.token0Address,
            contractAddress: e.token0Address,
            abi: ERC20_ABI,
            calls: [
                {
                    reference: "name",
                    methodName: "name",
                    methodParameters: [],
                },
                {
                    reference: "symbol",
                    methodName: "symbol",
                    methodParameters: [],
                },
                {
                    reference: "decimals",
                    methodName: "decimals",
                    methodParameters: [],
                },
                {
                    reference: "totalSupply",
                    methodName: "totalSupply",
                    methodParameters: [],
                },
                {
                    reference: "balanceOf",
                    methodName: "balanceOf",
                    methodParameters: [e.address],
                },
                {
                    reference: "balanceOf",
                    methodName: "balanceOf",
                    methodParameters: [userAccount],
                },
            ]
        }
    })
    const token1InfoCal = Object.values(lpTokenData).map((e) => {
        return {
            reference: e.address + e.token1Address,
            contractAddress: e.token1Address,
            abi: ERC20_ABI,
            calls: [
                {
                    reference: "name",
                    methodName: "name",
                    methodParameters: [],
                },
                {
                    reference: "symbol",
                    methodName: "symbol",
                    methodParameters: [],
                },
                {
                    reference: "decimals",
                    methodName: "decimals",
                    methodParameters: [],
                },
                {
                    reference: "totalSupply",
                    methodName: "totalSupply",
                    methodParameters: [],
                },
                {
                    reference: "balanceOf",
                    methodName: "balanceOf",
                    methodParameters: [e.address],
                },
                {
                    reference: "balanceOf",
                    methodName: "balanceOf",
                    methodParameters: [userAccount],
                },
            ]
        }
    })

    const lpDetails: { [key: string]: LPDetails } = {}
    const pairTokensData = (await multicall.call([...token0InfoCall, ...token1InfoCal])).results
    for (const key in lpTokenData) {
        const token0 = pairTokensData[lpTokenData[key].address + lpTokenData[key].token0Address]
        const token1 = pairTokensData[lpTokenData[key].address + lpTokenData[key].token1Address]
        const token0Balance = toBigNumber(token0.callsReturnContext[4].returnValues[0]);
        const token1Balance = toBigNumber(token1.callsReturnContext[4].returnValues[0])
        const token0Decimals = token0.callsReturnContext[2].returnValues[0]
        const token1Decimals = token1.callsReturnContext[2].returnValues[0]

        const token0UnitBalance = toLowerUnit(token0Balance.toFixed(0), token0Decimals)
        const token1UnitBalance = toLowerUnit(token1Balance.toFixed(0), token1Decimals)

        const token0Symbol = token0.callsReturnContext[1].returnValues[0];
        const token1Symbol = token1.callsReturnContext[1].returnValues[0];
        lpDetails[lpTokenData[key].address] = {
            ...lpTokenData[key],
            // replace the LP symbol with contatenated token 0 & 1 symbol
            symbol: `${token0Symbol} - $${token1Symbol}`,
            token0: {
                address: token0.originalContractCallContext.contractAddress,
                name: token0.callsReturnContext[0].returnValues[0],
                symbol: token0.callsReturnContext[1].returnValues[0],
                decimals: token0.callsReturnContext[2].returnValues[0],
                totalSupply: toBigNumber(token0.callsReturnContext[3].returnValues[0]),
                lpBalance: toBigNumber(token0.callsReturnContext[4].returnValues[0]),
                balance: toBigNumber(token0.callsReturnContext[5].returnValues[0]),
                // token0 price in terms of token1
                price: token1UnitBalance.div(token0UnitBalance),
            },
            token1: {
                address: token1.originalContractCallContext.contractAddress,
                name: token1.callsReturnContext[0].returnValues[0],
                symbol: token1.callsReturnContext[1].returnValues[0],
                decimals: token1.callsReturnContext[2].returnValues[0],
                totalSupply: toBigNumber(token1.callsReturnContext[3].returnValues[0]),
                lpBalance: toBigNumber(token1.callsReturnContext[4].returnValues[0]),
                balance: toBigNumber(token1.callsReturnContext[5].returnValues[0]),
                // token1 price in terms on token0
                price: token0UnitBalance.div(token1UnitBalance),
            }
        }
    }
    return lpDetails
}

// return the price balane and other props of token
const getTokenDetails = async (ethers: providers.Provider, tokensList: string[], ethPrice: BigNumber, userAccount: string = ZERO_ADDRESS) => {
    if (tokensList.length === 0) return {}
    const tokens = tokensList.filter((e) => e != WRAPPED_NATIVE)
    const lpTokens = await findLPTokens(ethers, tokens)
    const lpInfo = await getLPInfo(ethers, Object.values(lpTokens), userAccount)
    // TODO: if LP is BUSD-ETH pair, don't return the multiplied price
    const tokenPrice: { [key: string]: TokenDetails } = {}
    tokens.forEach((t) => {
        const e = lpInfo[lpTokens[t]]
        if (e) {
            const baseToken = e.token0Address === t ?
                e.token0 : e.token1
            const usdPrice = e.token0Address === t ?
                e.token0.price.times(ethPrice) :
                e.token1.price.times(ethPrice)

            tokenPrice[t] = {
                ...baseToken,
                price: usdPrice,
            }
        }
    })
    // TODO: Improve adding the native price manually
    if (Object.values(tokenPrice).length !== Object.values(tokensList).length)
        tokenPrice[WRAPPED_NATIVE] = {
            name: 'Wrapped BNB',
            address: WRAPPED_NATIVE,
            symbol: 'WBNB',
            decimals: 18,
            price: ethPrice,
        }
    return tokenPrice
}

// return the price balane and other props of lp token
const getLPDetails = async (ethers: providers.Provider, lpTokens: string[], ethPrice: BigNumber, userAccount: string = ZERO_ADDRESS) => {
    if (lpTokens.length === 0) return {}

    const lpDetails = await getLPInfo(ethers, lpTokens, userAccount)
    const allPairTokens: string[] = [];
    Object.values(lpDetails).forEach(e => {
        allPairTokens.push(e.token0Address)
        allPairTokens.push(e.token1Address)
    });
    const allPairTokensPrice = await getTokenDetails(ethers, allPairTokens, ethPrice, userAccount);
    const lpTvlDetails: {
        [key: string]: TokenDetails
    } = {}
    Object.values(lpDetails).forEach((e) => {
        const token0UsdTvl = allPairTokensPrice[e.token0Address].price.times(toLowerUnit(e.token0.lpBalance.toFixed()))
        const token1UsdTvl = allPairTokensPrice[e.token1Address].price.times(toLowerUnit(e.token1.lpBalance.toFixed()))
        const tvl = token0UsdTvl.plus(token1UsdTvl)
        lpTvlDetails[e.address] = {
            ...lpDetails[e.address],
            price: tvl.div(toLowerUnit(e.totalSupply.toFixed())),
        }
    })
    return lpTvlDetails
}

const getTokenAndLPPrices = async (ethers: providers.Provider, tokensAndLps: string[], ethPrice: BigNumber, userAccount: string = ZERO_ADDRESS) => {
    // divide the lps and tokens
    const tokenLPs = await findLPTokens(ethers, tokensAndLps)
    const areLps = await areLPTokens(ethers, tokensAndLps)
    const lps: string[] = []
    const tokens: string[] = []
    tokensAndLps.forEach((e) => {
        if (areLps[e]) lps.push(e)
        else if (tokenLPs[e] !== ZERO_ADDRESS) tokens.push(e)
        // if token don't have lp pair, do nothing
    })
    const tokensPrices = await getTokenDetails(ethers, tokens, ethPrice, userAccount)
    const lpPrices = await getLPDetails(ethers, lps, ethPrice, userAccount)
    const prices: {
        [key: string]: {
            isLP: boolean
            details: TokenDetails
        }
    } = {}
    // add token prices
    for (const key in tokensPrices) {
        if (Object.prototype.hasOwnProperty.call(tokensPrices, key)) {
            prices[key] = {
                isLP: false,
                details: tokensPrices[key]
            }
        }
    }
    // add lp prices
    for (const key in lpPrices) {
        if (Object.prototype.hasOwnProperty.call(lpPrices, key)) {
            prices[key] = {
                isLP: true,
                details: lpPrices[key]
            }
        }
    }
    return prices
}

export default fetchPools