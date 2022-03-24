import { FarmSdkConfig } from "../config/types";
import React, { useContext } from "react";

const FarmsSdkContext = React.createContext<{
    config: FarmSdkConfig;
    setConfig: (config: FarmSdkConfig) => void;
}>({
    config: { provider: undefined },
    setConfig: () => {},
});

export const useConfig = () => {
    return useContext(FarmsSdkContext);
};

export default FarmsSdkContext;
