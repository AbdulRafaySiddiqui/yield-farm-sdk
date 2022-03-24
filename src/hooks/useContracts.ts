import FARM_ABI from "../assets/abi/farm.json";
import CARD_HANDLER_ABI from "../assets/abi/card_handler.json";
import PROJECT_HANDLER_ABI from "../assets/abi/project_handler.json";
import FEE_RECEIVER_ABI from "../assets/abi/feeReceiver.json";
import REFERRAL_ABI from "../assets/abi/referral.json";
import TIMELOCK_ABI from "../assets/abi/timelock.json";
import {
    CARD_HANDLER_ADDRESS_V2,
    CARD_HANDLER_ADDRESS_V1,
    FARM_ADDRESS_V2,
    FARM_ADDRESS_V1,
    PROJECT_HANDLER_ADDRESS_V2,
    PROJECT_HANDLER_ADDRESS_V1,
    REFERRAL_ADDRESS,
} from "../config";
import { useContract } from "@react-dapp/utils";

export const useNftVillageChiefContractV1 = () => {
    return useContract(FARM_ABI, FARM_ADDRESS_V1);
};

export const useProjectHandlerContractV1 = () => {
    return useContract(PROJECT_HANDLER_ABI, PROJECT_HANDLER_ADDRESS_V1);
};

export const useCardHandlerContractV1 = () => {
    return useContract(CARD_HANDLER_ABI, CARD_HANDLER_ADDRESS_V1);
};

export const useNftVillageChiefContractV2 = () => {
    return useContract(FARM_ABI, FARM_ADDRESS_V2);
};

export const useProjectHandlerContractV2 = () => {
    return useContract(PROJECT_HANDLER_ABI, PROJECT_HANDLER_ADDRESS_V2);
};

export const useCardHandlerContractV2 = () => {
    return useContract(CARD_HANDLER_ABI, CARD_HANDLER_ADDRESS_V2);
};

export const useReferralContract = () => {
    return useContract(REFERRAL_ABI, REFERRAL_ADDRESS);
};

export const useFeeReceiverContract = (address: string) => {
    return useContract(FEE_RECEIVER_ABI, address);
};

export const useTimeLockContract = (address: string) => {
    return useContract(TIMELOCK_ABI, address);
};
