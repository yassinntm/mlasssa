
export enum TradeType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum Outcome {
  TP = 'TP',
  SL = 'SL',
  BE = 'BE',
  NO_TRADE = 'NO_TRADE',
}

export interface Trade {
  id: string;
  date: string; // ISO string format
  type?: TradeType;
  outcome: Outcome;
  slSize?: number;
  tpSize?: number;
  rr?: number; // R/R taken for the trade
  rangeSize?: number; // The size of the candle range for breakout
  notes: string;
  activationTime?: string; // e.g., "10:30"
  slSweepNotes?: string; // Notes about the candle that swept SL
  images?: {
    before?: string;
    after?: string;
    metatrader?: string;
  };
}
