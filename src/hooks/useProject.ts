import { TokenStandard } from "@react-dapp/utils";
import BigNumber from "bignumber.js";
import { Pool, Project } from "../config/types";
import { useEffect, useState } from "react";
import { useProjectHandlerContractV2 } from "./useContracts";

export const useProjects = () => {
    const [porjectsLength, setPorjectsLength] = useState(0);

    const projectHandler = useProjectHandlerContractV2();

    useEffect(() => {
        const fetchProjects = async () => {
            if (!projectHandler) return;

            const projectLength = await projectHandler.projectLength();
            const project = await projectHandler.getProjectInfo(0);
            setPorjectsLength(projectLength.toString());

            // console.log(`Projects Length: ${projectLength}`)
            // console.log(project)
        };
        fetchProjects();
    }, [projectHandler]);

    return { porjectsLength };
};

export const useProject = (projectId: number) => {
    const projectHandler = useProjectHandlerContractV2();
    const [project, setProject] = useState<Project>();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchProject = async () => {
            if (!projectHandler) return;

            setLoading(true);
            try {
                const _project = await projectHandler.getProjectInfo(projectId);
                console.log(_project);
                setProject({
                    projectId: projectId,
                    admin: _project.admin,
                    adminReward: toBigNumber(_project.adminReward).toNumber(),
                    initialized: _project.initialized,
                    paused: _project.paused,
                    poolCards: _project.poolCards,
                    rewardFee: toBigNumber(_project.rewardFee).toNumber(),
                    startBlock: toBigNumber(_project.startBlock).toNumber(),
                    pools: _project.pools.map(
                        (e: {
                            stakedTokenStandard: number;
                            stakedTokenId: any;
                            stakedToken: any;
                            rewardToken: any;
                            stakedAmount: any;
                            lockDeposit: any;
                            minDeposit: any;
                            harvestInterval: any;
                            depositFee: any;
                            minWithdrawlFee: any;
                            maxWithdrawlFee: any;
                            totalShares: any;
                        }) => {
                            return {
                                projectId: projectId,
                                stakedTokenStandard: e.stakedTokenStandard as number,
                                stakedTokenId: toBigNumber(e.stakedTokenId),
                                stakedToken: e.stakedToken,
                                rewardToken: e.rewardToken,
                                stakedAmount: toBigNumber(e.stakedAmount),
                                lockDeposit: e.lockDeposit,
                                minDeposit: toBigNumber(e.minDeposit),
                                harvestInterval: toBigNumber(e.harvestInterval),
                                depositFee: toBigNumber(e.depositFee),
                                minWithdrawlFee: toBigNumber(e.minWithdrawlFee),
                                maxWithdrawlFee: toBigNumber(e.maxWithdrawlFee),
                                totalShares: toBigNumber(e.totalShares),
                            };
                        }
                    ),
                });
            } catch (e) {
                console.log(e);
            }
            setLoading(false);
        };
        fetchProject();
    }, [projectHandler]);

    return { project, loading };
};

const toBigNumber = (value: any): BigNumber => {
    if (value) {
        if (Number.isInteger(value)) return new BigNumber(value);
        if (value._isBigNumber) return new BigNumber(value.toHexString());
    }
    return new BigNumber(0);
};
