import { useEthers, useReload, useRefresh } from "@react-dapp/utils";
import { PROJECT_ID } from "../config";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux"
import { loadPools } from "./pools/poolState"
import { State, Pool } from "../config/types";

export const usePools = () => {
    const { ethers, account } = useEthers();
    const { reload, reloadable } = useReload()
    const dispatch = useDispatch();

    useEffect(() => {
        if (ethers && account)
            dispatch(loadPools({ ethersProvider: ethers, projectId: PROJECT_ID, account: account }))
    }, [account, ethers, reloadable])

    return {
        pools: useSelector<State, Pool[]>(state => state.pools.data),
        loading: useSelector<State, boolean>(state => state.pools.loading),
        reload
    }
}

export const usePool = (poolId: number) => {
    return {
        pools: useSelector<State, Pool | undefined>(state => state.pools.data.find(e => e.poolId === poolId)),
        loading: useSelector<State, boolean>(state => state.pools.loading)
    }
}