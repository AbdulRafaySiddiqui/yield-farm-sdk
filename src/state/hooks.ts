import { useEthers, useReload } from "@react-dapp/utils";
import { PROJECT_ID } from "../config";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadV1Pools, loadV2Pools } from "./pools/poolState";
import { State, Pool } from "../config/types";

export const useLoadPoolsV1 = () => {
    const { ethers, account } = useEthers();
    const dispatch = useDispatch();

    const load = async () => {
        if (account)
            dispatch(
                loadV1Pools({
                    ethersProvider: ethers,
                    projectId: PROJECT_ID,
                    account: account,
                })
            );
        else
            console.log("Cannot load pools, wallet account not connected yet!");
    };

    return {
        loading: useSelector<State, boolean>((state) => state.pools.loadingV1),
        load,
    };
};

export const usePoolsV1 = () => {
    const { ethers, account } = useEthers();
    const { reload, reloadable } = useReload();
    const dispatch = useDispatch();

    useEffect(() => {
        if (ethers && account)
            dispatch(
                loadV1Pools({
                    ethersProvider: ethers,
                    projectId: PROJECT_ID,
                    account: account,
                })
            );
    }, [account, ethers, reloadable]);

    return {
        pools: useSelector<State, Pool[]>((state) => state.pools.farmDataV1),
        loading: useSelector<State, boolean>((state) => state.pools.loadingV1),
        reload,
    };
};

export const useLoadPoolsV2 = () => {
    const { ethers, account } = useEthers();
    const dispatch = useDispatch();

    const load = async () => {
        if (account)
            dispatch(
                loadV2Pools({
                    ethersProvider: ethers,
                    projectId: PROJECT_ID,
                    account: account,
                })
            );
        else
            console.log("Cannot load pools, wallet account not connected yet!");
    };

    return {
        loading: useSelector<State, boolean>((state) => state.pools.loadingV2),
        load,
    };
};

export const usePoolsV2 = () => {
    const { ethers, account } = useEthers();
    const { reload, reloadable } = useReload();
    const dispatch = useDispatch();

    useEffect(() => {
        if (ethers && account)
            dispatch(
                loadV2Pools({
                    ethersProvider: ethers,
                    projectId: PROJECT_ID,
                    account: account,
                })
            );
    }, [account, ethers, reloadable]);

    return {
        pools: useSelector<State, Pool[]>((state) => state.pools.farmDataV2),
        loading: useSelector<State, boolean>((state) => state.pools.loadingV2),
        reload,
    };
};
