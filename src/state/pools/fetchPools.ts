import {
    ERC1155_ABI,
    ERC20_ABI,
    ERC721_ABI,
    getApy,
    LP_ABI,
    toBigNumber,
    toLowerUnit,
    ZERO_ADDRESS,
} from "@react-dapp/utils";
import {
    ETH_USD_PAIR,
    EXCHANGE_FACTORY_ADDRESS,
    LP_NAME,
    POOL_CARDS_ADDRESS,
    PROJECT_ID,
    WRAPPED_NATIVE,
} from "../../config";
import PROJECT_HANDLER_ABI from "../../assets/abi/project_handler.json";
import CARD_HANDLER_ABI from "../../assets/abi/card_handler.json";
import FACTORY_ABI from "../../assets/abi/pancakeswap_factory_abi.json";
import FARM_ABI from "../../assets/abi/farm.json";
import POOL_CARDS_ABI from "../../assets/abi/pool_cards_abi.json";
import {
    LPAndPriceDetails,
    LPDetails,
    LPToken,
    NftDeposit,
    Pool,
    Project,
    RewardInfo,
    TokenAndLPDetails,
    TokenAndPriceDetails,
    TokenDetails,
    TokenStandard,
} from "../../config/types";
import {
    ContractCallContext,
    ContractCallResults,
    Multicall,
} from "ethereum-multicall";
import BigNumber from "bignumber.js";
import { Contract, providers } from "ethers";

const fetchPools = async (
    ethersProvider: providers.Provider,
    projectId: number,
    account: string,
    farmAddress: string,
    projectHandlerAddress: string,
    cardHandlerAddress: string
) => {
    if (!ethersProvider || !account) return;

    const EthPriceInBUSD = Object.values(
        await getLPInfo(ethersProvider, [ETH_USD_PAIR])
    )[0].token0.price;
    const projectHandler = new Contract(
        projectHandlerAddress,
        PROJECT_HANDLER_ABI,
        ethersProvider
    );
    const poolCards = new Contract(
        POOL_CARDS_ADDRESS,
        POOL_CARDS_ABI,
        ethersProvider
    );
    const _project = await projectHandler.getProjectInfo(PROJECT_ID);
    const multiplierCards = await poolCards.getMultiplierCards();
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
                minRequiredCards: toBigNumber(e.minRequiredCards).toNumber(),
                withdrawlFeeReliefInterval: e.withdrawlFeeReliefInterval,
                requiredCards: [],
                rewardInfo: [],
                multiplierCards: multiplierCards.map((i: any) =>
                    toBigNumber(i).toNumber()
                ),
            };
        }),
    };

    const multicall = new Multicall({
        ethersProvider: ethersProvider,
        tryAggregate: false,
    });
    const poolCallContext: ContractCallContext[] = [];

    for (let i = 0; i < project.pools.length; i++) {
        const e = project.pools[i];
        poolCallContext.push({
            reference: `rewardInfo-${e.poolId}`,
            contractAddress: projectHandlerAddress,
            abi: PROJECT_HANDLER_ABI,
            calls: [
                {
                    reference: "getRewardInfo",
                    methodName: "getRewardInfo",
                    methodParameters: [e.projectId, e.poolId],
                },
            ],
        });
        poolCallContext.push({
            reference: `requiredCards-${e.poolId}`,
            contractAddress: cardHandlerAddress,
            abi: CARD_HANDLER_ABI,
            calls: [
                {
                    reference: "getPoolRequiredCards",
                    methodName: "getPoolRequiredCards",
                    methodParameters: [e.projectId, e.poolId],
                },
            ],
        });
        poolCallContext.push({
            reference: `pendingRewards-${e.poolId}`,
            contractAddress: farmAddress,
            abi: FARM_ABI,
            calls: [
                {
                    reference: "pendingRewards",
                    methodName: "pendingRewards",
                    methodParameters: [e.projectId, e.poolId, account],
                },
            ],
        });
        poolCallContext.push({
            reference: `userInfo-${e.poolId}`,
            contractAddress: farmAddress,
            abi: FARM_ABI,
            calls: [
                {
                    reference: "userInfo",
                    methodName: "userInfo",
                    methodParameters: [e.projectId, e.poolId, account],
                },
            ],
        });
        if (e.stakedTokenStandard !== TokenStandard.NONE) {
            poolCallContext.push({
                reference: `stakedTokenApproval-${e.poolId}`,
                contractAddress: e.stakedToken,
                abi:
                    e.stakedTokenStandard === TokenStandard.ERC20
                        ? ERC20_ABI
                        : e.stakedTokenStandard === TokenStandard.ERC721
                        ? ERC721_ABI
                        : ERC1155_ABI,
                calls: [
                    {
                        reference: "stakedTokenApproval",
                        methodName:
                            e.stakedTokenStandard === TokenStandard.ERC20
                                ? "allowance"
                                : "isApprovedForAll",
                        methodParameters: [account, farmAddress],
                    },
                ],
            });
        }
        poolCallContext.push({
            reference: `poolCardsApproval-${e.poolId}`,
            contractAddress: POOL_CARDS_ADDRESS,
            abi: ERC1155_ABI,
            calls: [
                {
                    reference: "poolCardsApproval",
                    methodName: "isApprovedForAll",
                    methodParameters: [account, farmAddress],
                },
            ],
        });
        poolCallContext.push({
            reference: `poolCardsCardHandlerApproval-${e.poolId}`,
            contractAddress: POOL_CARDS_ADDRESS,
            abi: ERC1155_ABI,
            calls: [
                {
                    reference: "poolCardsCardHandlerApproval",
                    methodName: "isApprovedForAll",
                    methodParameters: [account, cardHandlerAddress],
                },
            ],
        });
        poolCallContext.push({
            reference: `getUserCardsInfo-${e.poolId}`,
            contractAddress: cardHandlerAddress,
            abi: CARD_HANDLER_ABI,
            calls: [
                {
                    reference: "getUserCardsInfo",
                    methodName: "getUserCardsInfo",
                    methodParameters: [PROJECT_ID, e.poolId, account],
                },
            ],
        });
    }
    const resultsCall: ContractCallResults = await multicall.call(
        poolCallContext
    );

    for (let i = 0; i < project.pools.length; i++) {
        const e = project.pools[i];

        // pendingRewards
        const rawRewards =
            resultsCall.results[
                `pendingRewards-${e.poolId}`
            ].callsReturnContext.shift()?.returnValues;
        const rewards = rawRewards?.map((e) => toBigNumber(e));

        // rewardInfo
        const rawRewardInfos =
            resultsCall.results[
                `rewardInfo-${e.poolId}`
            ].callsReturnContext.shift()?.returnValues;
        e.rewardInfo =
            rawRewardInfos?.map((e, k): RewardInfo => {
                const [
                    token,
                    paused,
                    mintable,
                    rewardPerBlock,
                    lastRewardBlock,
                    accRewardPerShare,
                    supply,
                ] = e;
                return {
                    token,
                    paused,
                    mintable,
                    accRewardPerShare: toBigNumber(accRewardPerShare),
                    lastRewardBlock: toBigNumber(lastRewardBlock),
                    rewardPerBlock: toBigNumber(rewardPerBlock),
                    supply: toBigNumber(supply),
                    rewards: rewards ? rewards[k] : new BigNumber(0),
                };
            }) ?? [];

        // requireCards
        const rawRequiredCards =
            resultsCall.results[
                `requiredCards-${e.poolId}`
            ].callsReturnContext.shift()?.returnValues;
        e.requiredCards =
            rawRequiredCards?.map((e): NftDeposit => {
                const [tokenId, amount] = e;
                return {
                    tokenId: toBigNumber(tokenId).toNumber(),
                    amount: toBigNumber(amount).toNumber(),
                };
            }) ?? [];

        // userInfo
        const rawUserInfo =
            resultsCall.results[
                `userInfo-${e.poolId}`
            ].callsReturnContext.shift()?.returnValues;
        const [
            amount,
            shares,
            shareMultiplier,
            canHarvestAt,
            harvestRelief,
            withdrawFeeDiscount,
            stakedTimestamp,
        ] = rawUserInfo ?? [];
        e.userInfo = {
            amount: toBigNumber(amount),
            shares: toBigNumber(shares),
            shareMultiplier: toBigNumber(shareMultiplier).toNumber(),
            canHarvestAt: toBigNumber(canHarvestAt).toNumber(),
            harvestRelief: toBigNumber(harvestRelief).toNumber(),
            withdrawFeeDiscount: toBigNumber(withdrawFeeDiscount).toNumber(),
            depositFeeDiscount: toBigNumber(withdrawFeeDiscount).toNumber(), // TODO: use depositFeeDiscount
            stakedTimestamp: toBigNumber(stakedTimestamp).toNumber(),
        };

        // staked token approval
        const allowance = resultsCall.results[
            `stakedTokenApproval-${e.poolId}`
        ]?.callsReturnContext
            .shift()
            ?.returnValues.shift();
        e.stakeTokenApproved =
            e.stakedTokenStandard === TokenStandard.ERC20
                ? toBigNumber(allowance).gt(0)
                : allowance;

        // pool cards approval
        const isApprovedForAll = resultsCall.results[
            `poolCardsApproval-${e.poolId}`
        ].callsReturnContext
            .shift()
            ?.returnValues.shift();
        e.farmApproved = isApprovedForAll;

        // pool cards card handler approval
        const isCardHandlerApprovedForAll = resultsCall.results[
            `poolCardsCardHandlerApproval-${e.poolId}`
        ].callsReturnContext
            .shift()
            ?.returnValues.shift();
        e.cardHandlerApproved = isCardHandlerApprovedForAll;

        // nft deposit info
        const responseForGetUserCardsInfo =
            resultsCall.results[`getUserCardsInfo-${e.poolId}`];
        const shifted = responseForGetUserCardsInfo.callsReturnContext.shift();

        const returnValues = shifted?.returnValues;

        const [required, feeDiscount, harvest, multiplier] = returnValues || [];

        const reformatCards = (cards: any) => {
            const formatedCards: NftDeposit[] = cards.map((item: any) => ({
                tokenId: toBigNumber(item[0]).toNumber(),
                amount: toBigNumber(item[1]).toNumber(),
            }));
            let arr: { tokenId: number; amount: number }[] = [];
            formatedCards.forEach(
                (item: { tokenId: number; amount: number }) => {
                    if (arr && arr.some((i) => i.tokenId === item.tokenId)) {
                        let i = arr.find(
                            (i) => i.tokenId === item.tokenId
                        )?.amount;
                        i = i ?? 0 + item.amount;
                        return;
                    } else {
                        arr.push(item);
                    }
                }
            );
            cards = arr;
            return arr;
        };

        e.nftDepositInfo = {
            requiredCards: reformatCards(required),
            depositFeeCards: reformatCards(feeDiscount),
            harvestCards: reformatCards(harvest),
            multiplierCards: reformatCards(multiplier),
            withdrawFeeCards: [],
        };
    }

    // get pool stats
    let tokens: string[] = [];
    for (let i = 0; i < project.pools.length; i++) {
        const element = project.pools[i];
        tokens = [...tokens, ...element.rewardInfo.map((e) => e.token)];
        if (element.stakedTokenStandard === TokenStandard.ERC20)
            tokens.push(element.stakedToken);
    }
    const tokenPrices = await getTokenAndLPPrices(
        ethersProvider,
        tokens,
        EthPriceInBUSD,
        account
    );
    for (let i = 0; i < project.pools.length; i++) {
        const pool = project.pools[i];
        project.pools[i].tokenPrices = tokenPrices;
        const stakeTokenDetails = tokenPrices[pool.stakedToken];
        project.pools[i].stakedTokenDetails = stakeTokenDetails?.details;
        project.pools[i].isLP = stakeTokenDetails?.isLP;
        if (project.pools[i].stakedTokenDetails) {
            project.pools[i].stats = {
                price: stakeTokenDetails.details.price,
                liquidity: stakeTokenDetails.details.price?.times(
                    toLowerUnit(
                        pool.stakedAmount.toFixed(),
                        stakeTokenDetails.details.decimals
                    )
                ),
                apy: pool.rewardInfo.map((e, j) => {
                    const rewardTokenDetails = tokenPrices[e.token];
                    project.pools[i].rewardInfo[j].details =
                        rewardTokenDetails?.details;
                    if (rewardTokenDetails)
                        return getApy(
                            stakeTokenDetails.details.price?.toFixed() ?? "0",
                            rewardTokenDetails.details.price?.toFixed() ?? "0",
                            toLowerUnit(
                                pool.stakedAmount.toFixed(),
                                stakeTokenDetails.details.decimals
                            ).toFixed(),
                            toLowerUnit(
                                e.rewardPerBlock.toFixed(),
                                rewardTokenDetails?.details.decimals
                            ).toNumber()
                        );
                }),
            };
        }
    }
    return project;
};

const areLPTokens = async (ethers: providers.Provider, tokens: string[]) => {
    if (tokens.length === 0) return {};

    const multicall = new Multicall({
        ethersProvider: ethers,
        tryAggregate: false,
    });
    const call = tokens.map((e) => {
        return {
            reference: e,
            contractAddress: e,
            abi: ERC20_ABI,
            calls: [
                {
                    reference: e,
                    methodName: "name",
                    methodParameters: [],
                },
            ],
        };
    });
    const data = (await multicall.call(call)).results;
    const lpTokens: {
        [key: string]: boolean;
    } = {};
    tokens.forEach(
        (e) =>
            (lpTokens[e] =
                data[e].callsReturnContext[0].returnValues[0] === LP_NAME)
    );
    return lpTokens;
};

// return token info and lp
const getTokenDetails = async (
    ethers: providers.Provider,
    tokens: string[],
    userAccount: string
) => {
    if (tokens.length === 0) return {};
    const multicall = new Multicall({
        ethersProvider: ethers,
        tryAggregate: false,
    });
    const calls: ContractCallContext[] = [];
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        calls.push({
            reference: `getPair-${token}`,
            contractAddress: EXCHANGE_FACTORY_ADDRESS,
            abi: FACTORY_ABI,
            calls: [
                {
                    reference: `getPair`,
                    methodName: "getPair",
                    methodParameters: [token, WRAPPED_NATIVE],
                },
            ],
        });
        calls.push({
            reference: `tokenDetails-${token}`,
            contractAddress: token,
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
                    methodParameters: [userAccount],
                },
            ],
        });
    }

    const data = (await multicall.call(calls)).results;
    const lpTokens: {
        [key: string]: TokenDetails;
    } = {};
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const lp =
            data[`getPair-${token}`].callsReturnContext[0].returnValues[0];
        const details = data[`tokenDetails-${token}`].callsReturnContext;
        lpTokens[token] = {
            address: token,
            name: details[0].returnValues[0],
            symbol: details[1].returnValues[0],
            decimals: details[2].returnValues[0],
            totalSupply: toBigNumber(details[3].returnValues[0]),
            balance:
                userAccount === ZERO_ADDRESS
                    ? toBigNumber(0)
                    : toBigNumber(details[4].returnValues[0]),
            lp: lp,
        };
    }
    return lpTokens;
};

const getLPInfo = async (
    ethers: providers.Provider,
    lpTokens: string[],
    userAccount: string = ZERO_ADDRESS
) => {
    if (lpTokens.length === 0) return {};

    const multicall = new Multicall({
        ethersProvider: ethers,
        tryAggregate: false,
    });
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
            ],
        };
    });
    const lpData = Object.values((await multicall.call(lpInfoCall)).results);
    const lpTokenData: { [key: string | number]: LPToken } = {};
    for (let i = 0; i < lpData.length; i++) {
        const element = lpData[i].callsReturnContext;
        const lp = {
            address: lpData[i].originalContractCallContext.reference,
            token0Address: element[0].returnValues[0],
            token1Address: element[1].returnValues[0],
            name: element[2].returnValues[0],
            symbol: element[3].returnValues[0],
            decimals: Number(element[4].returnValues[0]),
            totalSupply: toBigNumber(element[5].returnValues[0]),
            balance: toBigNumber(element[6].returnValues[0]),
        };
        lpTokenData[lpData[i].originalContractCallContext.reference] = lp;
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
            ],
        };
    });
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
            ],
        };
    });

    const lpDetails: { [key: string]: LPDetails } = {};
    const pairTokensData = (
        await multicall.call([...token0InfoCall, ...token1InfoCal])
    ).results;
    for (const key in lpTokenData) {
        const token0 =
            pairTokensData[
                lpTokenData[key].address + lpTokenData[key].token0Address
            ];
        const token1 =
            pairTokensData[
                lpTokenData[key].address + lpTokenData[key].token1Address
            ];
        const token0Balance = toBigNumber(
            token0.callsReturnContext[4].returnValues[0]
        );
        const token1Balance = toBigNumber(
            token1.callsReturnContext[4].returnValues[0]
        );
        const token0Decimals = token0.callsReturnContext[2].returnValues[0];
        const token1Decimals = token1.callsReturnContext[2].returnValues[0];

        const token0UnitBalance = toLowerUnit(
            token0Balance.toFixed(0),
            token0Decimals
        );
        const token1UnitBalance = toLowerUnit(
            token1Balance.toFixed(0),
            token1Decimals
        );

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
                totalSupply: toBigNumber(
                    token0.callsReturnContext[3].returnValues[0]
                ),
                lpBalance: toBigNumber(
                    token0.callsReturnContext[4].returnValues[0]
                ),
                balance: toBigNumber(
                    token0.callsReturnContext[5].returnValues[0]
                ),
                // token0 price in terms of token1
                price: token1UnitBalance.div(token0UnitBalance),
            },
            token1: {
                address: token1.originalContractCallContext.contractAddress,
                name: token1.callsReturnContext[0].returnValues[0],
                symbol: token1.callsReturnContext[1].returnValues[0],
                decimals: token1.callsReturnContext[2].returnValues[0],
                totalSupply: toBigNumber(
                    token1.callsReturnContext[3].returnValues[0]
                ),
                lpBalance: toBigNumber(
                    token1.callsReturnContext[4].returnValues[0]
                ),
                balance: toBigNumber(
                    token1.callsReturnContext[5].returnValues[0]
                ),
                // token1 price in terms on token0
                price: token0UnitBalance.div(token1UnitBalance),
            },
        };
    }
    return lpDetails;
};

// return the price balance and other details of token
const getTokenPriceDetails = async (
    ethers: providers.Provider,
    tokensList: string[],
    ethPrice: BigNumber,
    userAccount: string = ZERO_ADDRESS
) => {
    if (tokensList.length === 0) return {};
    const tokens = tokensList.filter((e) => e != WRAPPED_NATIVE);
    const tokenDetails = await getTokenDetails(ethers, tokens, userAccount);
    const lpInfo = await getLPInfo(
        ethers,
        Object.values(tokenDetails).map((e) => e.lp),
        userAccount
    );
    // TODO: if LP is BUSD-ETH pair, don't return the multiplied price
    const tokenPrice: { [key: string]: TokenAndPriceDetails } = {};
    tokens.forEach((t) => {
        const e = lpInfo[tokenDetails[t].lp];
        if (e) {
            const baseToken = e.token0Address === t ? e.token0 : e.token1;
            const usdPrice =
                e.token0Address === t
                    ? e.token0.price.times(ethPrice)
                    : e.token1.price.times(ethPrice);

            tokenPrice[t] = {
                ...baseToken, // this is the token from LP pair
                ...tokenDetails[t], // this is from token details (this has lp)
                price: usdPrice,
            };
        }
    });
    // TODO: Improve adding the native price manually
    if (Object.values(tokenPrice).length !== Object.values(tokensList).length)
        tokenPrice[WRAPPED_NATIVE] = {
            name: "Wrapped BNB",
            address: WRAPPED_NATIVE,
            symbol: "WBNB",
            decimals: 18,
            price: ethPrice,
            balance: toBigNumber(0),
            lp: ZERO_ADDRESS,
            totalSupply: toBigNumber(0),
        };
    return tokenPrice;
};

// return the price balane and other props of lp token
const getLPPriceDetails = async (
    ethers: providers.Provider,
    lpTokens: string[],
    ethPrice: BigNumber,
    userAccount: string = ZERO_ADDRESS
) => {
    if (lpTokens.length === 0) return {};

    const lpDetails = await getLPInfo(ethers, lpTokens, userAccount);
    const allPairTokens: string[] = [];
    Object.values(lpDetails).forEach((e) => {
        allPairTokens.push(e.token0Address);
        allPairTokens.push(e.token1Address);
    });
    const allPairTokensPrice = await getTokenPriceDetails(
        ethers,
        allPairTokens,
        ethPrice,
        userAccount
    );
    const lpTvlDetails: {
        [key: string]: LPAndPriceDetails;
    } = {};
    Object.values(lpDetails).forEach((e) => {
        const token0UsdTvl = allPairTokensPrice[e.token0Address].price.times(
            toLowerUnit(e.token0.lpBalance.toFixed())
        );
        const token1UsdTvl = allPairTokensPrice[e.token1Address].price.times(
            toLowerUnit(e.token1.lpBalance.toFixed())
        );
        const tvl = token0UsdTvl.plus(token1UsdTvl);
        lpTvlDetails[e.address] = {
            ...lpDetails[e.address],
            price: tvl.div(toLowerUnit(e.totalSupply.toFixed())),
        };
    });
    return lpTvlDetails;
};

const getTokenAndLPPrices = async (
    ethers: providers.Provider,
    tokensAndLps: string[],
    ethPrice: BigNumber,
    userAccount: string = ZERO_ADDRESS
) => {
    // divide the lps and tokens
    const tokenLPs = await getTokenDetails(ethers, tokensAndLps, userAccount);
    const areLps = await areLPTokens(ethers, tokensAndLps);
    const lps: string[] = [];
    const tokens: string[] = [];
    const tokensWithoutLp: string[] = [];
    tokensAndLps.forEach((e) => {
        if (areLps[e]) lps.push(e);
        else if (tokenLPs[e].lp !== ZERO_ADDRESS) tokens.push(e);
        else tokensWithoutLp.push(e);
    });
    const tokenWithLpDetails = await getTokenPriceDetails(
        ethers,
        tokens,
        ethPrice,
        userAccount
    );
    const tokenWithoutLpDetails = await getTokenDetails(
        ethers,
        tokensWithoutLp,
        userAccount
    );
    const lpDetails = await getLPPriceDetails(
        ethers,
        lps,
        ethPrice,
        userAccount
    );
    const prices: {
        [key: string]: {
            isLP: boolean;
            details: TokenAndLPDetails;
        };
    } = {};
    // add token prices
    for (const key in tokenWithLpDetails) {
        if (Object.prototype.hasOwnProperty.call(tokenWithLpDetails, key)) {
            prices[key] = {
                isLP: false,
                details: tokenWithLpDetails[key],
            };
        }
    }
    // add lp prices
    for (const key in lpDetails) {
        if (Object.prototype.hasOwnProperty.call(lpDetails, key)) {
            prices[key] = {
                isLP: true,
                details: lpDetails[key],
            };
        }
    }
    // add token without lp details
    for (const key in tokenWithoutLpDetails) {
        if (Object.prototype.hasOwnProperty.call(tokenWithoutLpDetails, key)) {
            prices[key] = {
                isLP: false,
                details: tokenWithoutLpDetails[key],
            };
        }
    }
    return prices;
};

export default fetchPools;
