
import React, { useState, FormEvent, useEffect, ChangeEvent, useMemo } from 'react';
import { Trade, TradeType, Outcome } from '../types';

interface TradeFormProps {
  addTrade: (trade: Omit<Trade, 'id'>) => void;
  onTradeAdded: () => void;
}

const ImageUploadSlot: React.FC<{
    label: string;
    preview: string | null;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onClear: () => void;
    disabled: boolean;
    id: string;
}> = ({ label, preview, onChange, onClear, disabled, id }) => (
    <div className={`relative border-2 border-dashed border-gray-600 rounded-lg p-4 flex flex-col items-center justify-center h-40 text-center transition-opacity ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {preview ? (
            <>
                <img src={preview} alt={`Preview for ${label}`} className="max-h-full max-w-full rounded" />
                <button
                    type="button"
                    onClick={onClear}
                    disabled={disabled}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold disabled:cursor-not-allowed"
                >
                    &times;
                </button>
            </>
        ) : (
            <>
                <label htmlFor={id} className={`flex flex-col items-center ${disabled ? '' : 'cursor-pointer text-sm text-gray-400 hover:text-primary'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    <span>{label}</span>
                    <input
                        id={id}
                        type="file"
                        accept="image/*"
                        onChange={onChange}
                        className="sr-only"
                        disabled={disabled}
                    />
                </label>
            </>
        )}
    </div>
);


export const TradeForm: React.FC<TradeFormProps> = ({ addTrade, onTradeAdded }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [outcome, setOutcome] = useState<Outcome>(Outcome.TP);
  const [type, setType] = useState<TradeType | undefined>(TradeType.BUY);
  const [slSize, setSlSize] = useState('');
  const [tpSize, setTpSize] = useState('');
  const [rangeSize, setRangeSize] = useState('');
  const [rr, setRr] = useState('');
  const [activationTime, setActivationTime] = useState('');
  const [slSweepNotes, setSlSweepNotes] = useState('');
  const [images, setImages] = useState<{ [key: string]: string | null }>({ before: null, after: null, metatrader: null });
  const [imagePreviews, setImagePreviews] = useState<{ [key: string]: string | null }>({ before: null, after: null, metatrader: null });
  const [isUploading, setIsUploading] = useState(false);
  const [notes, setNotes] = useState('');

  const dayOfWeek = useMemo(() => {
    if (!date) return '';
    // Adding T00:00:00 ensures the date is parsed in the local timezone, avoiding off-by-one day errors.
    const day = new Date(date + 'T00:00:00');
    return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(day);
  }, [date]);

  const isNoTradeDay = outcome === Outcome.NO_TRADE;

  useEffect(() => {
    if (isNoTradeDay) {
      setType(undefined);
      setSlSize('');
      setTpSize('');
      setRr('');
      setActivationTime('');
      setSlSweepNotes('');
      setImages({ before: null, after: null, metatrader: null });
      setImagePreviews({ before: null, after: null, metatrader: null });
    } else if (type === undefined) {
      setType(TradeType.BUY);
    }
  }, [outcome, isNoTradeDay, type]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const previewUrl = URL.createObjectURL(file);
    setImagePreviews(prev => ({ ...prev, [key]: previewUrl }));

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const base64String = reader.result as string;
        setImages(prev => ({ ...prev, [key]: base64String }));
        setIsUploading(false);
    };
    reader.onerror = (error) => {
        console.error("Error converting file to base64", error);
        setIsUploading(false);
    };
    e.target.value = ''; // Allow re-uploading the same file
  };

  const clearImage = (key: string) => {
    setImages(prev => ({ ...prev, [key]: null }));
    
    if (imagePreviews[key]) {
        URL.revokeObjectURL(imagePreviews[key]!);
    }
    setImagePreviews(prev => ({ ...prev, [key]: null }));
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
     if (isUploading) {
        alert("Please wait for images to finish processing.");
        return;
    }
    
    const finalImages = Object.fromEntries(
        Object.entries(images).filter(([_, value]) => value !== null)
    );

    const tradeData: Omit<Trade, 'id'> = {
      date,
      outcome,
      notes,
      rangeSize: rangeSize ? parseFloat(rangeSize) : undefined,
      images: finalImages,
      ...( !isNoTradeDay ? {
          type: type!,
          slSize: slSize ? parseFloat(slSize) : undefined,
          tpSize: tpSize ? parseFloat(tpSize) : undefined,
          rr: rr ? parseFloat(rr) : undefined,
          activationTime: activationTime || undefined,
          slSweepNotes: slSweepNotes || undefined,
      } : {
          type: undefined,
          slSize: undefined,
          tpSize: undefined,
          rr: undefined,
          activationTime: undefined,
          slSweepNotes: undefined,
      })
    };

    addTrade(tradeData);
    onTradeAdded();
  };
  
  const disabledClasses = "disabled:bg-gray-700/50 disabled:cursor-not-allowed disabled:opacity-70";
  const inputClasses = `w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary ${disabledClasses}`;

  const imageSlots = [
    { key: 'before', label: 'Before Trade' },
    { key: 'after', label: 'After Trade' },
    { key: 'metatrader', label: 'MetaTrader Screen' },
  ];

  return (
    <div className="max-w-2xl mx-auto bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-700">
      <h2 className="text-2xl font-bold text-primary mb-6">Log a New Trade</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1">Date</label>
            <div className="flex items-center gap-2">
                <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required
                       className="flex-grow bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary"/>
                <span className="bg-gray-900/50 px-3 py-2 rounded-md text-sm text-gray-300 w-32 text-center truncate">{dayOfWeek}</span>
            </div>
          </div>
          <div>
            <label htmlFor="outcome" className="block text-sm font-medium text-gray-300 mb-1">Outcome</label>
            <select id="outcome" value={outcome} onChange={e => setOutcome(e.target.value as Outcome)} required
                    className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary">
              {Object.values(Outcome).map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        
          <>
            <div className={isNoTradeDay ? 'opacity-50' : ''}>
              <label className="block text-sm font-medium text-gray-300 mb-2">Trade Type</label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" name="type" value={TradeType.BUY} checked={type === TradeType.BUY} onChange={() => setType(TradeType.BUY)} disabled={isNoTradeDay}
                         className="form-radio h-4 w-4 text-primary bg-gray-700 border-gray-600 focus:ring-primary disabled:cursor-not-allowed"/>
                  <span className="text-green-400 font-semibold">BUY</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" name="type" value={TradeType.SELL} checked={type === TradeType.SELL} onChange={() => setType(TradeType.SELL)} disabled={isNoTradeDay}
                         className="form-radio h-4 w-4 text-red-500 bg-gray-700 border-gray-600 focus:ring-red-500 disabled:cursor-not-allowed"/>
                  <span className="text-red-400 font-semibold">SELL</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="tpSize" className="block text-sm font-medium text-gray-300 mb-1">TP Size (pips/points)</label>
                <input type="number" step="any" id="tpSize" value={tpSize} onChange={e => setTpSize(e.target.value)} disabled={isNoTradeDay}
                       className={inputClasses} />
              </div>
              <div>
                <label htmlFor="slSize" className="block text-sm font-medium text-gray-300 mb-1">SL Size (pips/points)</label>
                <input type="number" step="any" id="slSize" value={slSize} onChange={e => setSlSize(e.target.value)} disabled={isNoTradeDay}
                       className={inputClasses} />
              </div>
            </div>
             <div>
                <label htmlFor="rangeSize" className="block text-sm font-medium text-gray-300 mb-1">Range Size (pips/points)</label>
                <input type="number" step="any" id="rangeSize" value={rangeSize} onChange={e => setRangeSize(e.target.value)}
                       placeholder="Size of consolidation range"
                       className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary" />
            </div>
             <div>
                <label htmlFor="rr" className="block text-sm font-medium text-gray-300 mb-1">R/R Taken</label>
                <input type="number" step="any" id="rr" value={rr} onChange={e => setRr(e.target.value)} disabled={isNoTradeDay}
                       placeholder="e.g., 2.5 (Overrides TP/SL calculation)"
                       className={inputClasses} />
            </div>
             <div>
                <label htmlFor="activationTime" className="block text-sm font-medium text-gray-300 mb-1">Candle Activation Time</label>
                <input type="time" id="activationTime" value={activationTime} onChange={e => setActivationTime(e.target.value)} disabled={isNoTradeDay}
                       className={inputClasses} />
            </div>
             <div>
                <label htmlFor="slSweepNotes" className="block text-sm font-medium text-gray-300 mb-1">Candle Sweep Notes</label>
                <textarea id="slSweepNotes" value={slSweepNotes} onChange={e => setSlSweepNotes(e.target.value)} rows={3} disabled={isNoTradeDay}
                          placeholder="Describe the candle that hit your SL..."
                          className={inputClasses}></textarea>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Trade Images</label>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     {imageSlots.map(slot => (
                        <ImageUploadSlot 
                            key={slot.key}
                            id={`image-${slot.key}`}
                            label={slot.label}
                            preview={imagePreviews[slot.key]}
                            onChange={(e) => handleImageChange(e, slot.key)}
                            onClear={() => clearImage(slot.key)}
                            disabled={isNoTradeDay}
                        />
                     ))}
                 </div>
            </div>
          </>
        
        
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">General Notes</label>
          <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                    placeholder={isNoTradeDay ? "Notes about why you didn't trade..." : "Market conditions, entry confluence, etc..."}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary"></textarea>
        </div>

        <div className="flex justify-end">
          <button type="submit"
                  disabled={isUploading}
                  className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
            {isUploading ? 'Processing...' : 'Add Trade'}
          </button>
        </div>
      </form>
    </div>
  );
};
