import { awaitTransaction, STATE, toBigNumber, toLowerUnit, toUpperUnit } from "@react-dapp/utils"
import BigNumber from "bignumber.js"
import { Pool, DepositInfo, WithdrawInfo, HarvestInfo } from "../config/types"
import { useEffect, useState } from "react"
import { useCardHandlerContract, useNftVillageChiefContract, useProjectHandlerContract } from "./useContracts"

export const useAddPool = () => {
    const projectHandler = useProjectHandlerContract()
    const [txState, setTxState] = useState(STATE.IDLE)

    const add = async (pool: Pool) => {
        if (!projectHandler) return;

        try {
            setTxState(STATE.BUSY)

            const _pool = bigNumberObjtoString(pool)
            const _poolFee = await projectHandler.poolFee()
            await projectHandler.addPool(pool.projectId, _pool, _pool.rewardInfo, _pool.requiredCards, { value: _poolFee })

            setTxState(STATE.SUCCEED)
        } catch (e) {
            console.log(e)
            setTxState(STATE.FAILED)
        }
    }

    return { add, txState }
}

export const useSetPool = () => {
    const projectHandler = useProjectHandlerContract()
    const [txState, setTxState] = useState(STATE.IDLE)

    const set = async (pool: Pool) => {
        if (!projectHandler) return;

        try {
            setTxState(STATE.BUSY)

            const _pool = bigNumberObjtoString(pool)
            await projectHandler.setPool(pool.projectId, pool.poolId, _pool, _pool.requiredCards)

            setTxState(STATE.SUCCEED)
        } catch (e) {
            console.log(e)
            setTxState(STATE.FAILED)
        }
    }

    return { set, txState }
}

export const useSinglePool = (projectId: number, poolId: number) => {
    const [loading, setLoading] = useState(false)
    const [pool, setPool] = useState<Pool>()

    const projectHandler = useProjectHandlerContract()
    const cardHandler = useCardHandlerContract()

    useEffect(() => {
        const fetch = async () => {
            if (!projectHandler || !cardHandler) return;
            setLoading(true)
            try {
                const _pool = await projectHandler.getPoolInfo(projectId, poolId);
                const _rewardInfo = await projectHandler.getRewardInfo(projectId, poolId)
                const _requiredCards = await cardHandler.getPoolRequiredCards(projectId, poolId)

                setPool({
                    projectId: projectId,
                    poolId: poolId,
                    withdrawlFeeReliefInterval: toBigNumber(_pool.withdrawlFeeReliefInterval).toNumber(),
                    depositFee: toBigNumber(_pool.depositFee).toNumber(),
                    harvestInterval: toBigNumber(_pool.harvestInterval).toNumber(),
                    lockDeposit: _pool.lockDeposit,
                    minDeposit: toBigNumber(_pool.minDeposit),
                    maxWithdrawlFee: toBigNumber(_pool.maxWithdrawlFee).toNumber(),
                    minWithdrawlFee: toBigNumber(_pool.minWithdrawlFee).toNumber(),
                    stakedToken: _pool.stakedToken,
                    stakedTokenStandard: 0,
                    stakedTokenId: toBigNumber(_pool.stakedTokenId),
                    stakedAmount: toBigNumber(_pool.stakedAmount),
                    totalShares: toBigNumber(_pool.totalShares),
                    requiredCards: _requiredCards.map((e: any) => {
                        return {
                            tokenId: toBigNumber(e.tokenId),
                            amount: toBigNumber(e.amount)
                        }
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
                        }
                    })
                })

            } catch (e) {
                console.log(e)
            }
            setLoading(false)
        }

        fetch()
    }, [projectHandler, cardHandler])

    return { pool, loading }
}

export const bigNumberObjtoString = (obj: any) => {
    let transformedObj: any;

    if (Array.isArray(obj)) {
        transformedObj = obj.map(e => {
            return bigNumberObjtoString(e)
        });
        return transformedObj
    } else if (obj && typeof obj === 'object') {
        transformedObj = {}
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const element = obj[key];
                if (BigNumber.isBigNumber(element))
                    transformedObj[key] = element.toFixed(0)
                else if (typeof element === 'object')
                    transformedObj[key] = bigNumberObjtoString(element)
                else
                    transformedObj[key] = element
            }
        }
    }
    return transformedObj ?? obj;
}

export const useDeposit = () => {
    const chief = useNftVillageChiefContract()
    const [txPending, setTxPending] = useState(false)

    const deposit = async (stakeInfo: DepositInfo) => {
        if (!chief) return;

        setTxPending(true)
        const response = await awaitTransaction(
            chief.deposit(
                ...bigNumberObjtoString(Object.values(stakeInfo))
            )
        )
        console.log(response)
        setTxPending(false)

        return response
    }

    return { deposit, txPending }
}

export const useWithdraw = () => {
    const chief = useNftVillageChiefContract()
    const [txPending, setTxPending] = useState(false)

    const withdraw = async (withdrawInfo: WithdrawInfo) => {
        if (!chief) return;

        setTxPending(true)
        const response = await awaitTransaction(
            chief.withdraw(
                ...Object.values(withdrawInfo)
            )
        )
        console.log(response)

        setTxPending(false)

        return response
    }

    return { withdraw, txPending }
}

export const useHarvest = () => {
    const chief = useNftVillageChiefContract()
    const [txPending, setTxPending] = useState(false)

    const harvest = async (harvestInfo: HarvestInfo) => {
        if (!chief) return;

        setTxPending(true)

        const response = await awaitTransaction(
            chief.deposit(harvestInfo.projectId, harvestInfo.poolId, 0, [], [], [], [], '0x0000000000000000000000000000000000000000')
        )
        console.log(response)
        setTxPending(false)

        return response
    }

    return { harvest, txPending }
}