import { FarmSdkConfig } from '../config/types'
import { useState } from 'react'
import FarmsSdkContext from '../contexts/farmsSdkContext'

const FarmsSdkProvider = ({ children, config }: { children: JSX.Element, config: FarmSdkConfig }) => {
    const [_config, _setConfig] = useState(config)

    return (
        <FarmsSdkContext.Provider value={{ config: _config, setConfig: _setConfig }}>
            {children}
        </FarmsSdkContext.Provider >
    )
}

export { FarmsSdkContext, FarmsSdkProvider };