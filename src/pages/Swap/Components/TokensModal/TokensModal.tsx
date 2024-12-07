import {Input, Modal} from "antd";
import {useEffect} from "react";
import {Token} from '../../../../types/token';
import {CHAIN_LOGO_MAP, QUICK_ACCESS_TOKENS} from "../../../../config";
// @ts-ignore
import defaultImage from '../../../../assets/img/default.svg';
import {TokenConfig} from "../../../../models/TokenConfig";

export function TokensModal({
                                isOpen,
                                setSearchPhrase,
                                searchPhrase,
                                modifyToken,
                                setIsOpen,
                                hiddenTokens,
                                associatedTokens,
                                tokens,
                                setHiddenTokens,
                            }: {
    isOpen: boolean,
    setSearchPhrase: any,
    searchPhrase: string,
    modifyToken: any,
    setIsOpen: any,
    hiddenTokens: number[],
    associatedTokens: any,
    tokens: TokenConfig[],
    setHiddenTokens: any,
}) {

    useEffect(() => {
        const lowerCase = searchPhrase.toLowerCase();
        const hiddenTokens: number[] = [];
        if (lowerCase) {
            tokens.forEach((token: TokenConfig, i: any) => {
                if (
                    !token.symbol.toLowerCase().includes(lowerCase)
                    && !token.chain.toLowerCase().includes(lowerCase)
                    && !token.address.toLowerCase().includes(lowerCase)
                ) {
                    hiddenTokens.push(i);
                }
            });
        }
        setHiddenTokens(hiddenTokens);
    }, [searchPhrase]);

    return <Modal
        open={isOpen}
        footer={null}
        onCancel={() => {
            setIsOpen(false)
        }}
        title='Select a token'
        width='440px'
        wrapClassName='modal__wrapper'
    >
        <div className='modal'>
            <div className="modal__search">
                <Input
                    type='search'
                    className='token__search-field'
                    placeholder='Search by name, address, symbol'
                    onChange={(e) => setSearchPhrase(e.target.value)}
                    value={searchPhrase}
                />
            </div>
            <hr className='swap__divider'/>
            <div className='modal__tokens'>
                {tokens?.map((token, index) => {
                    const tokenBalance = associatedTokens?.get(token.address || 'HBAR');
                    return (
                        <div
                            className={'modal__token' + (hiddenTokens.includes(index) ? ' hidden' : '')}
                            key={token.address}
                            onClick={() => modifyToken(index)}
                        >
                            <img
                                src={token?.icon || ''}
                                alt={token.symbol}
                                className="modal__token-logo"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).onerror = null;
                                    (e.target as HTMLImageElement).src = defaultImage;
                                }}
                            />
                            <img
                                src={CHAIN_LOGO_MAP.get(token.chain) || ''}
                                alt={token.chain}
                                className="modal__token-logo-chain"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).onerror = null;
                                    (e.target as HTMLImageElement).src = defaultImage;
                                }}
                            />
                            <div className='modal__token-description'>
                                <div className='modal__token-name'>
                                    {token.symbol} ({token.chain})
                                </div>
                                <div className='modal__token-address'>
                                    {token.address.substring(0, 5)}...{token.address.substring(30)}
                                </div>
                            </div>
                            <div className='modal__token-balance'>
                                {tokenBalance ? `Balance: ${tokenBalance?.div(Math.pow(10, token.decimals)).toString()}` : ''}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    </Modal>
}
