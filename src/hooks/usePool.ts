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
} from "../config/types";
import { useEffect, useState } from "react";
import {
    useCardHandlerContract,
    useNftVillageChiefContract,
    useProjectHandlerContract,
} from "./useContracts";
import { useLoadPools, usePools } from "../state/hooks";
import { FARM_ADDRESS, POOL_CARDS_ADDRESS, PROJECT_ID } from "../config";
import { useSelector } from "react-redux";

export const useAddPool = () => {
    const projectHandler = useProjectHandlerContract();
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
    const projectHandler = useProjectHandlerContract();
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

    const projectHandler = useProjectHandlerContract();
    const cardHandler = useCardHandlerContract();

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

export const usePool = (
    poolId: number,
    handleError: (message: string) => void = (message) => console.log(message)
) => {
    const pool = useSelector<State, Pool | undefined>((state) =>
        state.pools.data.find((e) => e.poolId === poolId)
    );
    const { load, loading } = useLoadPools();

    const deposit = useDeposit();
    const withdraw = useWithdraw();
    const harvest = useHarvest();
    const stakeTokenApproval = useERC20Approval(
        pool?.stakedToken,
        FARM_ADDRESS
    );
    const cardsApproval = useERC1155Approval(POOL_CARDS_ADDRESS, FARM_ADDRESS);

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
        requiredCards: NftDeposit[] = [],
        referrer: string = ZERO_ADDRESS
    ) => {
        if (!stakeTokenApproval.isApproved && !pool?.poolCardsApproved) {
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
            amount: depositAmount.getValue(),
            depositFeeCards,
            withdrawFeeCards,
            harvestCards,
            multiplierCards,
            requiredCards,
            referrer: referrer,
        });
        if (!response.status) handleError(response.error);
        else {
            depositAmount.setValue("0");
            load();
        }
    };

    const handleWithdraw = async () => {
        if (withdrawAmount.error) {
            handleError(withdrawAmount.error);
            return;
        }

        const response = await withdraw.withdraw({
            projectId: PROJECT_ID,
            poolId: poolId,
            amount: withdrawAmount.getValue(),
        });
        if (!response.status) handleError(response.error);
        else {
            withdrawAmount.setValue("0");
            load();
        }
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
                pool.stakedTokenDetails?.balance?.toFixed() ?? "0",
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
            stakedTokenApproval: {
                isApproved:
                    stakeTokenApproval.isApproved || pool.stakeTokenApproved,
                approve: stakeTokenApproval.approve,
                approvePending: stakeTokenApproval.txPending,
            },
            poolCardsApproval: {
                isApproved: cardsApproval.isApproved || pool.poolCardsApproved,
                approve: cardsApproval.approve,
                approvePending: cardsApproval.txPending,
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
            },
            harvestInfo: {
                harvest: handleHarvest,
                pending: harvest.txPending,
            },
            details: pool,
        }
    );
};

export const useDeposit = () => {
    const chief = useNftVillageChiefContract();
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
        console.log(response);
        setTxPending(false);

        return response;
    };

    return { deposit, txPending };
};

export const useWithdraw = () => {
    const chief = useNftVillageChiefContract();
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
        console.log(response);

        setTxPending(false);

        return response;
    };

    return { withdraw, txPending };
};

export const useHarvest = () => {
    const chief = useNftVillageChiefContract();
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
                [],
                "0x0000000000000000000000000000000000000000"
            )
        );
        console.log(response);
        setTxPending(false);

        return response;
    };

    return { harvest, txPending };
};
