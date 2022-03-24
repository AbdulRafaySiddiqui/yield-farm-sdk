import { useEthers, useReload, useRefresh } from "@react-dapp/utils";
import { PROJECT_ID } from "../config";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadPools } from "./pools/poolState";
import { State, Pool } from "../config/types";

export const useLoadPools = () => {
    const { ethers, account } = useEthers();
    const dispatch = useDispatch();

    const load = async () => {
        if (account)
            dispatch(
                loadPools({
                    ethersProvider: ethers,
                    projectId: PROJECT_ID,
                    account: account,
                })
            );
        else
            console.log("Cannot load pools, wallet account not connected yet!");
    };

    return {
        loading: useSelector<State, boolean>((state) => state.pools.loading),
        load,
    };
};

export const usePools = () => {
    const { ethers, account } = useEthers();
    const { reload, reloadable } = useReload();
    const dispatch = useDispatch();

    useEffect(() => {
        if (ethers && account)
            dispatch(
                loadPools({
                    ethersProvider: ethers,
                    projectId: PROJECT_ID,
                    account: account,
                })
            );
    }, [account, ethers, reloadable]);

    return {
        pools: useSelector<State, Pool[]>((state) => state.pools.data),
        loading: useSelector<State, boolean>((state) => state.pools.loading),
        reload,
    };
};
