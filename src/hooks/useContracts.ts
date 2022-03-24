import FARM_ABI from "../assets/abi/farm.json";
import CARD_HANDLER_ABI from "../assets/abi/card_handler.json";
import PROJECT_HANDLER_ABI from "../assets/abi/project_handler.json";
import FEE_RECEIVER_ABI from "../assets/abi/feeReceiver.json";
import REFERRAL_ABI from "../assets/abi/referral.json";
import TIMELOCK_ABI from "../assets/abi/timelock.json";
import {
    CARD_HANDLER_ADDRESS,
    FARM_ADDRESS,
    PROJECT_HANDLER_ADDRESS,
    REFERRAL_ADDRESS,
} from "../config";
import { useContract } from "@react-dapp/utils";

export const useNftVillageChiefContract = () => {
    return useContract(FARM_ABI, FARM_ADDRESS);
};

export const useProjectHandlerContract = () => {
    return useContract(PROJECT_HANDLER_ABI, PROJECT_HANDLER_ADDRESS);
};

export const useCardHandlerContract = () => {
    return useContract(CARD_HANDLER_ABI, CARD_HANDLER_ADDRESS);
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
