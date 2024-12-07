import './AssociateNewToken.css'
import {Token} from "../../../../types/token";
import {TokenConfig} from "../../../../models/TokenConfig";

export interface IAssociateNewTokenProps{
    handleClick: (value: TokenConfig) => void;
    associatedButtons: TokenConfig[];
}

const AssociateNewToken = ({associatedButtons, handleClick}: IAssociateNewTokenProps) => {
    return <>
        {associatedButtons.map((token: TokenConfig) => {
            return <div key={token.address} className={'associate-button'}>
                <button onClick={() => handleClick(token)} className='button swap__button'>
                    Associate {token.symbol} ({token.address.substring(0, 5)}...{token.address.substring(32)})
                    <span className='swap__button-subtitle'>Token is not associated with your account</span>
                </button>
            </div>
        })}
        </>
}

export default AssociateNewToken
