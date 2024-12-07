import {BigNumber} from "ethers";

export type TokensReleasedEvent = {
    receiver: string;
    token: string;
    amount: BigNumber;
}