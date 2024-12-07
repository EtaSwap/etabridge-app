import {BigNumber} from "ethers";

export type TokensBridgedEvent = {
    sender: string;
    token: string;
    amount: BigNumber;
    receiver: string;
    fee: BigNumber;
    targetChainId: BigNumber;
}