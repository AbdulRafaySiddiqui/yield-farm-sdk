import {
    awaitTransaction,
    STATE,
    toBigNumber,
    toLowerUnit,
    useERC1155Approval,
    useERC20Approval,
    useInputValue,
    bigNumberObjtoString,
    ZERO_ADDRESS,
} from "@react-dapp/utils";
import {
    Pool,
    DepositInfo,
    WithdrawInfo,
    HarvestInfo,
    NftDeposit,
    State,
    TokenStandard,
    WithdrawMultiplierCardsInfo,
    WithdrawHarvestCardsInfo,
} from "../config/types";
import { useEffect, useState } from "react";
import {
    useCardHandlerContractV2,
    useNftVillageChiefContractV1,
    useNftVillageChiefContractV2,
    useProjectHandlerContractV1,
    useProjectHandlerContractV2,
} from "./useContracts";
import {
    useLoadPoolsV1,
    useLoadPoolsV2,
    usePoolsV1,
    usePoolsV2,
} from "../state/hooks";
import {
    CARD_HANDLER_ADDRESS,
    CARD_HANDLER_ADDRESS_V1,
    FARM_ADDRESS,
    FARM_ADDRESS_V1,
    POOL_CARDS_ADDRESS,
    PROJECT_ID,
} from "../config";
import { useSelector } from "react-redux";

export const useAddPool = () => {
    const projectHandler = useProjectHandlerContractV2();
    const [txState, setTxState] = useState(STATE.IDLE);

    const add = async (pool: Pool) => {
        if (!projectHandler) return;

        try {
            setTxState(STATE.BUSY);

            const _pool = bigNumberObjtoString(pool);
            const _poolFee = await projectHandler.poolFee();
            await projectHandler.addPool(
                pool.projectId,
                _pool,
                _pool.rewardInfo,
                _pool.requiredCards,
                { value: _poolFee }
            );

            setTxState(STATE.SUCCEED);
        } catch (e) {
            console.log(e);
            setTxState(STATE.FAILED);
        }
    };

    return { add, txState };
};

export const useSetPool = () => {
    const projectHandler = useProjectHandlerContractV2();
    const [txState, setTxState] = useState(STATE.IDLE);

    const set = async (pool: Pool) => {
        if (!projectHandler) return;

        try {
            setTxState(STATE.BUSY);

            const _pool = bigNumberObjtoString(pool);
            await projectHandler.setPool(
                pool.projectId,
                pool.poolId,
                _pool,
                _pool.requiredCards
            );

            setTxState(STATE.SUCCEED);
        } catch (e) {
            console.log(e);
            setTxState(STATE.FAILED);
        }
    };

    return { set, txState };
};

export const useSinglePool = (projectId: number, poolId: number) => {
    const [loading, setLoading] = useState(false);
    const [pool, setPool] = useState<Pool>();

    const projectHandler = useProjectHandlerContractV2();
    const cardHandler = useCardHandlerContractV2();

    useEffect(() => {
        const fetch = async () => {
            if (!projectHandler || !cardHandler) return;
            setLoading(true);
            try {
                const _pool = await projectHandler.getPoolInfo(
                    projectId,
                    poolId
                );
                const _rewardInfo = await projectHandler.getRewardInfo(
                    projectId,
                    poolId
                );
                const _requiredCards = await cardHandler.getPoolRequiredCards(
                    projectId,
                    poolId
                );

                setPool({
                    projectId: projectId,
                    poolId: poolId,
                    withdrawlFeeReliefInterval: toBigNumber(
                        _pool.withdrawlFeeReliefInterval
                    ).toNumber(),
                    depositFee: toBigNumber(_pool.depositFee).toNumber(),
                    harvestInterval: toBigNumber(
                        _pool.harvestInterval
                    ).toNumber(),
                    lockDeposit: _pool.lockDeposit,
                    minDeposit: toBigNumber(_pool.minDeposit),
                    maxWithdrawlFee: toBigNumber(
                        _pool.maxWithdrawlFee
                    ).toNumber(),
                    minWithdrawlFee: toBigNumber(
                        _pool.minWithdrawlFee
                    ).toNumber(),
                    stakedToken: _pool.stakedToken,
                    stakedTokenStandard: 0,
                    stakedTokenId: toBigNumber(_pool.stakedTokenId),
                    stakedAmount: toBigNumber(_pool.stakedAmount),
                    totalShares: toBigNumber(_pool.totalShares),
                    minRequiredCards: toBigNumber(
                        _pool.minRequiredCards
                    ).toNumber(),
                    requiredCards: _requiredCards.map((e: any) => {
                        return {
                            tokenId: toBigNumber(e.tokenId),
                            amount: toBigNumber(e.amount),
                        };
                    }),
                    rewardInfo: _rewardInfo.map((e: any) => {
                        return {
                            excludeFee: e.excludeFee,
                            mintable: e.mintable,
                            rewardPerBlock: toBigNumber(e.rewardPerBlock),
                            token: e.token,
                            accRewardPerShare: toBigNumber(e.accRewardPerShare),
                            lastRewardBlock: toBigNumber(e.lastRewardBlock),
                            paused: e.paused,
                            supply: toBigNumber(e.supply),
                        };
                    }),
                });
            } catch (e) {
                console.log(e);
            }
            setLoading(false);
        };

        fetch();
    }, [projectHandler, cardHandler]);

    return { pool, loading };
};

export const usePoolV1 = (
    poolId: number,
    handleError: (message: string) => void = (message) => console.log(message)
) => {
    const pool = useSelector<State, Pool | undefined>((state) =>
        state.pools.farmDataV1?.find((e) => e.poolId === poolId)
    );
    const { load, loading } = useLoadPoolsV1();

    const deposit = useDepositV1();
    const withdraw = useWithdrawV1();
    const harvest = useHarvestV1();
    const stakeTokenApproval = useERC20Approval(
        pool?.stakedTokenStandard === TokenStandard.ERC20
            ? pool?.stakedToken
            : undefined,
        FARM_ADDRESS_V1
    );

    const farmApproval = useERC1155Approval(
        POOL_CARDS_ADDRESS,
        FARM_ADDRESS_V1
    );
    const cardsHandlerApproval = useERC1155Approval(
        POOL_CARDS_ADDRESS,
        CARD_HANDLER_ADDRESS_V1
    );

    const depositAmount = useInputValue(
        pool?.stakedTokenDetails?.balance?.toFixed() ?? "0",
        pool?.stakedTokenDetails?.decimals
    );
    const withdrawAmount = useInputValue(
        pool?.userInfo?.amount?.toFixed() ?? "0",
        pool?.stakedTokenDetails?.decimals
    );

    const handleDeposit = async (
        depositFeeCards: NftDeposit[] = [],
        withdrawFeeCards: NftDeposit[] = [],
        harvestCards: NftDeposit[] = [],
        multiplierCards: NftDeposit[] = [],
        referrer: string = ZERO_ADDRESS
    ) => {
        // if (!stakeTokenApproval.isApproved && !pool?.farmApproved) {
        //     handleError("Please approved your NFT before using this pool");
        //     return;
        // }
        if (depositAmount.error) {
            handleError(depositAmount.error);
            return;
        }

        const response = await deposit.deposit({
            projectId: PROJECT_ID,
            poolId,
            amount:
                pool?.stakedTokenStandard === TokenStandard.ERC20
                    ? depositAmount.getValue()
                    : pool?.stakedAmount.gt(0)
                    ? "0" // to prevent multiple require card deposit
                    : "1", // to deposit only one requried card

            depositFeeCards,
            withdrawFeeCards,
            harvestCards,
            multiplierCards,
            referrer: referrer,
        });
        if (!response.status) handleError(response.error);
        else {
            depositAmount.setValue("0");
            load();
        }
        return response;
    };

    const handleWithdraw = async () => {
        if (withdrawAmount.error) {
            handleError(withdrawAmount.error);
            return;
        }

        const response = await withdraw.withdraw({
            projectId: PROJECT_ID,
            poolId: poolId,
            amount:
                pool?.stakedTokenStandard !== TokenStandard.ERC20
                    ? "1" // temp fix
                    : withdrawAmount.getValue(),
        });
        if (!response.status) handleError(response.error);
        else {
            withdrawAmount.setValue("0");
            load();
        }
        return response;
    };

    const handleWithdrawMultiplierCards = async (cards: NftDeposit[]) => {
        const response = await withdraw.withdrawMultiplierCards({
            projectId: PROJECT_ID,
            poolId: poolId,
            cards,
        });
        if (!response.status) handleError(response.error);
        else {
            load();
        }
        return response;
    };

    const handleWithdrawHarvestCards = async (cards: NftDeposit[]) => {
        const response = await withdraw.withdrawMultiplierCards({
            projectId: PROJECT_ID,
            poolId: poolId,
            cards,
        });
        if (!response.status) handleError(response.error);
        else {
            load();
        }
        return response;
    };

    const handleHarvest = async () => {
        const response = await harvest.harvest({
            projectId: PROJECT_ID,
            poolId: poolId,
        });
        if (!response.status) handleError(response.error);
        else {
            load();
        }
        return response;
    };

    return (
        pool && {
            liquidity: pool.stats?.liquidity?.toFormat(0),
            totalStaked: toLowerUnit(
                pool.stakedAmount.toFixed(),
                pool.stakedTokenDetails?.decimals
            ).toFormat(2),
            stakedAmount: toLowerUnit(
                pool.userInfo?.amount?.toFixed() ?? "0",
                pool.stakedTokenDetails?.decimals
            ).toFormat(2),
            stakedTokenSymbol: pool.stakedTokenDetails?.symbol,
            stakedTokenBalance: toLowerUnit(
                toBigNumber(
                    pool.stakedTokenDetails?.balance.toFixed() ?? 0
                ).toString() ?? "0",
                pool.stakedTokenDetails?.decimals
            ).toFormat(2),
            poolSharePercent: pool.userInfo?.amount
                .div(pool.stakedAmount)
                .times(100)
                .toFixed(2),
            rewards: pool.rewardInfo.map((e, i) => {
                return {
                    apy: pool.stats?.apy[i]?.toFixed(0),
                    rewardTokenSymbol: e.details?.symbol,
                    rewards: toLowerUnit(
                        e.rewards.toFixed(),
                        e.details?.decimals
                    ).toFormat(4),
                };
            }),
            loading,
            stakedTokenApproval:
                pool?.stakedTokenStandard === TokenStandard.ERC20
                    ? {
                          isApproved:
                              stakeTokenApproval.isApproved ||
                              pool.stakeTokenApproved,
                          approve: stakeTokenApproval.approve,
                          approvePending: stakeTokenApproval.txPending,
                      }
                    : {
                          isApproved:
                              farmApproval.isApproved || pool.farmApproved,
                          approve: farmApproval.approve,
                          approvePending: farmApproval.txPending,
                      },
            farmApproval: {
                isApproved: farmApproval.isApproved || pool.farmApproved,
                approve: farmApproval.approve,
                approvePending: farmApproval.txPending,
            },
            cardHandlerApproval: {
                isApproved:
                    cardsHandlerApproval.isApproved || pool.cardHandlerApproved,
                approve: cardsHandlerApproval.approve,
                approvePending: cardsHandlerApproval.txPending,
            },
            depositInfo: {
                input: depositAmount,
                deposit: handleDeposit,
                pending: deposit.txPending,
            },
            withdrawInfo: {
                input: withdrawAmount,
                withdraw: handleWithdraw,
                pending: withdraw.txPending,
                withdrawHarvestCards: handleWithdrawHarvestCards,
                withdrawMultiplierCards: handleWithdrawMultiplierCards,
            },
            harvestInfo: {
                harvest: handleHarvest,
                pending: harvest.txPending,
            },
            details: pool,
        }
    );
};

export const useDepositV1 = () => {
    const chief = useNftVillageChiefContractV1();
    const [txPending, setTxPending] = useState(false);

    const deposit = async (stakeInfo: DepositInfo) => {
        if (!chief)
            return {
                tx: undefined,
                receipt: undefined,
                error: "Chief Contract not found!",
                status: false,
            };

        setTxPending(true);
        const response = await awaitTransaction(
            chief.deposit(...bigNumberObjtoString(Object.values(stakeInfo)))
        );
        setTxPending(false);

        return response;
    };

    return { deposit, txPending };
};

export const useWithdrawV1 = () => {
    const chief = useNftVillageChiefContractV1();
    const [txPending, setTxPending] = useState(false);

    const withdraw = async (withdrawInfo: WithdrawInfo) => {
        if (!chief)
            return {
                tx: undefined,
                receipt: undefined,
                error: "Chief Contract not found!",
                status: false,
            };

        setTxPending(true);
        const response = await awaitTransaction(
            chief.withdraw(...Object.values(withdrawInfo))
        );
        setTxPending(false);

        return response;
    };

    const withdrawMultiplierCards = async (
        info: WithdrawMultiplierCardsInfo
    ) => {
        if (!chief)
            return {
                tx: undefined,
                receipt: undefined,
                error: "Chief Contract not found!",
                status: false,
            };

        setTxPending(true);
        const response = await awaitTransaction(
            chief.withdrawMultiplierCard(...Object.values(info))
        );
        setTxPending(false);

        return response;
    };
    const withdrawHarvestCards = async (info: WithdrawHarvestCardsInfo) => {
        if (!chief)
            return {
                tx: undefined,
                receipt: undefined,
                error: "Chief Contract not found!",
                status: false,
            };

        setTxPending(true);
        const response = await awaitTransaction(
            chief.withdrawHarvestCard(...Object.values(info))
        );
        setTxPending(false);

        return response;
    };

    return {
        withdraw,
        withdrawMultiplierCards,
        withdrawHarvestCards,
        txPending,
    };
};

export const useHarvestV1 = () => {
    const chief = useNftVillageChiefContractV1();
    const [txPending, setTxPending] = useState(false);

    const harvest = async (harvestInfo: HarvestInfo) => {
        if (!chief)
            return {
                tx: undefined,
                receipt: undefined,
                error: "Chief Contract not found!",
                status: false,
            };

        setTxPending(true);
        const response = await awaitTransaction(
            chief.deposit(
                harvestInfo.projectId,
                harvestInfo.poolId,
                0,
                [],
                [],
                [],
                [],
                "0x0000000000000000000000000000000000000000"
            )
        );
        setTxPending(false);

        return response;
    };

    return { harvest, txPending };
};

export const usePoolV2 = (
    poolId: number,
    handleError: (message: string) => void = (message) => console.log(message)
) => {
    const pool = useSelector<State, Pool | undefined>((state) =>
        state.pools.farmDataV2?.find((e) => e.poolId === poolId)
    );
    const { load, loading } = useLoadPoolsV2();

    const deposit = useDepositV2();
    const withdraw = useWithdrawV2();
    const harvest = useHarvestV2();
    const stakeTokenApproval = useERC20Approval(
        pool?.stakedTokenStandard === TokenStandard.ERC20
            ? pool?.stakedToken
            : undefined,
        FARM_ADDRESS
    );

    const farmApproval = useERC1155Approval(POOL_CARDS_ADDRESS, FARM_ADDRESS);
    const cardsHandlerApproval = useERC1155Approval(
        POOL_CARDS_ADDRESS,
        CARD_HANDLER_ADDRESS
    );

    const depositAmount = useInputValue(
        pool?.stakedTokenDetails?.balance?.toFixed() ?? "0",
        pool?.stakedTokenDetails?.decimals
    );
    const withdrawAmount = useInputValue(
        pool?.userInfo?.amount?.toFixed() ?? "0",
        pool?.stakedTokenDetails?.decimals
    );

    const handleDeposit = async (
        depositFeeCards: NftDeposit[] = [],
        withdrawFeeCards: NftDeposit[] = [],
        harvestCards: NftDeposit[] = [],
        multiplierCards: NftDeposit[] = [],
        referrer: string = ZERO_ADDRESS,
        amount?: string
    ) => {
        if (
            pool?.stakedTokenStandard === TokenStandard.ERC20
                ? !stakeTokenApproval.isApproved && !pool?.farmApproved
                : !cardsHandlerApproval.isApproved && !pool?.cardHandlerApproved
        ) {
            handleError("Please approved your NFT before using this pool");
            return;
        }
        if (depositAmount.error) {
            handleError(depositAmount.error);
            return;
        }

        const response = await deposit.deposit({
            projectId: PROJECT_ID,
            poolId,
            amount:
                amount ?? pool?.stakedTokenStandard === TokenStandard.ERC20
                    ? depositAmount.getValue()
                    : pool?.stakedAmount.gt(0)
                    ? "0" // to prevent multiple require card deposit
                    : "1", // to deposit only one requried card

            depositFeeCards,
            withdrawFeeCards,
            harvestCards,
            multiplierCards,
            referrer: referrer,
        });
        if (!response.status) handleError(response.error);
        else {
            depositAmount.setValue("0");
            load();
        }
        return response;
    };

    const handleWithdraw = async (amount?: string) => {
        if (withdrawAmount.error) {
            handleError(withdrawAmount.error);
            return;
        }

        const response = await withdraw.withdraw({
            projectId: PROJECT_ID,
            poolId: poolId,
            amount:
                amount ?? pool?.stakedTokenStandard !== TokenStandard.ERC20
                    ? "1" // temp fix
                    : withdrawAmount.getValue(),
        });
        if (!response.status) handleError(response.error);
        else {
            withdrawAmount.setValue("0");
            load();
        }
        return response;
    };

    const handleWithdrawMultiplierCards = async (cards: NftDeposit[]) => {
        const response = await withdraw.withdrawMultiplierCards({
            projectId: PROJECT_ID,
            poolId: poolId,
            cards,
        });
        if (!response.status) handleError(response.error);
        else {
            load();
        }
        return response;
    };

    const handleWithdrawHarvestCards = async (cards: NftDeposit[]) => {
        const response = await withdraw.withdrawMultiplierCards({
            projectId: PROJECT_ID,
            poolId: poolId,
            cards,
        });
        if (!response.status) handleError(response.error);
        else {
            load();
        }
        return response;
    };

    const handleHarvest = async () => {
        const response = await harvest.harvest({
            projectId: PROJECT_ID,
            poolId: poolId,
        });
        if (!response.status) handleError(response.error);
        else {
            load();
        }
        return response;
    };

    return (
        pool && {
            liquidity: pool.stats?.liquidity?.toFormat(0),
            totalStaked: toLowerUnit(
                pool.stakedAmount.toFixed(),
                pool.stakedTokenDetails?.decimals
            ).toFormat(2),
            stakedAmount: toLowerUnit(
                pool.userInfo?.amount?.toFixed() ?? "0",
                pool.stakedTokenDetails?.decimals
            ).toFormat(2),
            stakedTokenSymbol: pool.stakedTokenDetails?.symbol,
            stakedTokenBalance: toLowerUnit(
                toBigNumber(
                    pool.stakedTokenDetails?.balance.toFixed() ?? 0
                ).toString() ?? "0",
                pool.stakedTokenDetails?.decimals
            ).toFormat(2),
            poolSharePercent: pool.userInfo?.amount
                .div(pool.stakedAmount)
                .times(100)
                .toFixed(2),
            rewards: pool.rewardInfo.map((e, i) => {
                return {
                    apy: pool.stats?.apy[i]?.toFixed(0),
                    rewardTokenSymbol: e.details?.symbol,
                    rewards: toLowerUnit(
                        e.rewards.toFixed(),
                        e.details?.decimals
                    ).toFormat(4),
                };
            }),
            loading,
            stakedTokenApproval:
                pool?.stakedTokenStandard === TokenStandard.ERC20
                    ? {
                          isApproved:
                              stakeTokenApproval.isApproved ||
                              pool.stakeTokenApproved,
                          approve: stakeTokenApproval.approve,
                          approvePending: stakeTokenApproval.txPending,
                      }
                    : {
                          isApproved:
                              farmApproval.isApproved || pool.farmApproved,
                          approve: farmApproval.approve,
                          approvePending: farmApproval.txPending,
                      },
            farmApproval: {
                isApproved: farmApproval.isApproved || pool.farmApproved,
                approve: farmApproval.approve,
                approvePending: farmApproval.txPending,
            },
            cardHandlerApproval: {
                isApproved:
                    cardsHandlerApproval.isApproved || pool.cardHandlerApproved,
                approve: cardsHandlerApproval.approve,
                approvePending: cardsHandlerApproval.txPending,
            },
            depositInfo: {
                input: depositAmount,
                deposit: handleDeposit,
                pending: deposit.txPending,
            },
            withdrawInfo: {
                input: withdrawAmount,
                withdraw: handleWithdraw,
                pending: withdraw.txPending,
                withdrawHarvestCards: handleWithdrawHarvestCards,
                withdrawMultiplierCards: handleWithdrawMultiplierCards,
            },
            harvestInfo: {
                harvest: handleHarvest,
                pending: harvest.txPending,
            },
            details: pool,
        }
    );
};

export const useDepositV2 = () => {
    const chief = useNftVillageChiefContractV2();
    const [txPending, setTxPending] = useState(false);

    const deposit = async (stakeInfo: DepositInfo) => {
        if (!chief)
            return {
                tx: undefined,
                receipt: undefined,
                error: "Chief Contract not found!",
                status: false,
            };

        setTxPending(true);
        const response = await awaitTransaction(
            chief.deposit(...bigNumberObjtoString(Object.values(stakeInfo)))
        );
        setTxPending(false);

        return response;
    };

    return { deposit, txPending };
};

export const useWithdrawV2 = () => {
    const chief = useNftVillageChiefContractV2();
    const [txPending, setTxPending] = useState(false);

    const withdraw = async (withdrawInfo: WithdrawInfo) => {
        if (!chief)
            return {
                tx: undefined,
                receipt: undefined,
                error: "Chief Contract not found!",
                status: false,
            };

        setTxPending(true);
        const response = await awaitTransaction(
            chief.withdraw(...Object.values(withdrawInfo))
        );
        setTxPending(false);

        return response;
    };

    const withdrawMultiplierCards = async (
        info: WithdrawMultiplierCardsInfo
    ) => {
        if (!chief)
            return {
                tx: undefined,
                receipt: undefined,
                error: "Chief Contract not found!",
                status: false,
            };

        setTxPending(true);
        const response = await awaitTransaction(
            chief.withdrawMultiplierCard(...Object.values(info))
        );
        setTxPending(false);

        return response;
    };
    const withdrawHarvestCards = async (info: WithdrawHarvestCardsInfo) => {
        if (!chief)
            return {
                tx: undefined,
                receipt: undefined,
                error: "Chief Contract not found!",
                status: false,
            };

        setTxPending(true);
        const response = await awaitTransaction(
            chief.withdrawHarvestCard(...Object.values(info))
        );
        setTxPending(false);

        return response;
    };

    return {
        withdraw,
        withdrawMultiplierCards,
        withdrawHarvestCards,
        txPending,
    };
};

export const useHarvestV2 = () => {
    const chief = useNftVillageChiefContractV2();
    const [txPending, setTxPending] = useState(false);

    const harvest = async (harvestInfo: HarvestInfo) => {
        if (!chief)
            return {
                tx: undefined,
                receipt: undefined,
                error: "Chief Contract not found!",
                status: false,
            };

        setTxPending(true);
        const response = await awaitTransaction(
            chief.deposit(
                harvestInfo.projectId,
                harvestInfo.poolId,
                0,
                [],
                [],
                [],
                [],
                "0x0000000000000000000000000000000000000000"
            )
        );
        setTxPending(false);

        return response;
    };

    return { harvest, txPending };
};
