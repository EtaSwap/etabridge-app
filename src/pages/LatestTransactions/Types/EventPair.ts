import {TokensBridgedEvent} from "./TokensBridgedEvent";
import {TokensReleasedEvent} from "./TokensReleasedEvent";

export type EventPair = {
    income: TokensBridgedEvent;
    outcome?: TokensReleasedEvent;
}