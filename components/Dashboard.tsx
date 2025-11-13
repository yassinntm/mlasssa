
import React, { useMemo, useState } from 'react';
import { Trade, Outcome, TradeType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface DashboardProps {
  trades: Trade[];
  deleteTrade: (id: string) => void;
}

type SortableTradeKeys = keyof Trade;

const StatCard: React.FC<{ title: string; value: string; subtext?: string, colorClass?: string }> = ({ title, value, subtext, colorClass = 'text-white' }) => (
  <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</h3>
    <p className={`text-3xl font-bold mt-2 ${colorClass}`}>{value}</p>
    {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
  </div>
);

const ImageModal: React.FC<{ trade: Trade, onClose: () => void }> = ({ trade, onClose }) => (
    <div 
        className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
        onClick={onClose}
    >
        <div 
            className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl max-w-5xl w-full border border-gray-700"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-primary">Trade Images - {new Date(trade.date).toLocaleDateString()}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
            </div>
            {(!trade.images || Object.keys(trade.images).length === 0) ? (
                <p className="text-center text-gray-500">No images for this trade.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(trade.images).map(([key, imgData]) => (
                        <div key={key} className="bg-gray-900 rounded-md p-2">
                            <h4 className="text-sm font-semibold text-center mb-2 text-gray-400 capitalize">
                              {key === 'metatrader' ? 'MetaTrader Screen' : key}
                            </h4>
                            <img src={imgData} alt={`Trade image ${key}`} className="w-full h-auto object-contain rounded" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
);

const SortIcon: React.FC<{ direction?: 'ascending' | 'descending' }> = ({ direction }) => {
    if (!direction) return <span className="inline-block w-3 h-3 ml-1 opacity-30">↕</span>;
    return <span className="inline-block w-3 h-3 ml-1">{direction === 'ascending' ? '▲' : '▼'}</span>;
};


export const Dashboard: React.FC<DashboardProps> = ({ trades, deleteTrade }) => {
  const [viewingTrade, setViewingTrade] = useState<Trade | null>(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    outcome: 'all',
    type: 'all',
    rangeSize: 'all',
    dayOfWeek: 'all',
  });
  const [sortConfig, setSortConfig] = useState<{ key: SortableTradeKeys; direction: 'ascending' | 'descending' }>({ key: 'date', direction: 'descending' });


  const stats = useMemo(() => {
    const totalTrades = trades.filter(t => t.outcome !== Outcome.NO_TRADE).length;
    const wins = trades.filter(t => t.outcome === Outcome.TP).length;
    const losses = trades.filter(t => t.outcome === Outcome.SL).length;
    const breakEvens = trades.filter(t => t.outcome === Outcome.BE).length;
    const winRate = totalTrades > 0 && (wins + losses > 0) ? ((wins / (wins + losses)) * 100).toFixed(1) : '0.0';

    const totalRREarned = trades
      .filter(t => t.outcome !== Outcome.NO_TRADE)
      .reduce((acc, trade) => {
        if (trade.rr !== undefined && trade.rr !== null) { // Prioritize manually entered RR
            // For SL, it is always -1R, regardless of what's in rr field.
            return acc + (trade.outcome === Outcome.SL ? -1 : trade.rr);
        }
        if (trade.outcome === Outcome.TP && trade.slSize && trade.tpSize && trade.slSize > 0) {
            return acc + (trade.tpSize / trade.slSize);
        }
        if (trade.outcome === Outcome.SL) {
            return acc - 1;
        }
        // For BE or other cases without specified RR, add 0.
        return acc;
    }, 0);
    
    const averageRR = totalTrades > 0 ? totalRREarned / totalTrades : 0;

    return {
      totalTrades,
      wins,
      losses,
      breakEvens,
      winRate,
      totalRREarned,
      averageRR,
    };
  }, [trades]);
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({ startDate: '', endDate: '', outcome: 'all', type: 'all', rangeSize: 'all', dayOfWeek: 'all' });
  };
  
  const requestSort = (key: SortableTradeKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const filteredAndSortedTrades = useMemo(() => {
    let filteredTrades = [...trades];

    if (filters.startDate) {
        filteredTrades = filteredTrades.filter(t => new Date(t.date) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
        filteredTrades = filteredTrades.filter(t => new Date(t.date) <= new Date(filters.endDate));
    }
    if (filters.outcome !== 'all') {
        filteredTrades = filteredTrades.filter(t => t.outcome === filters.outcome);
    }
    if (filters.type !== 'all') {
        filteredTrades = filteredTrades.filter(t => t.type === filters.type);
    }
    if (filters.rangeSize !== 'all') {
        const [minStr, maxStr] = filters.rangeSize.split('-');
        const min = parseFloat(minStr);
        const max = maxStr ? parseFloat(maxStr) : Infinity;

        filteredTrades = filteredTrades.filter(t => {
            if (t.rangeSize == null) return false;
            return t.rangeSize >= min && t.rangeSize < max;
        });
    }
    if (filters.dayOfWeek !== 'all') {
        filteredTrades = filteredTrades.filter(t => {
            const date = new Date(t.date);
            const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
            // In JS, getUTCDay() is 0 for Sunday, 1 for Monday, ..., 6 for Saturday.
            return utcDate.getUTCDay().toString() === filters.dayOfWeek;
        });
    }

    filteredTrades.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue == null) return 1;
        if (bValue == null) return -1;

        let comparison = 0;
        if (sortConfig.key === 'date') {
            comparison = new Date(aValue as string).getTime() - new Date(bValue as string).getTime();
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
            comparison = aValue - bValue;
        } else {
            comparison = String(aValue).localeCompare(String(bValue));
        }
        
        return sortConfig.direction === 'descending' ? -comparison : comparison;
    });

    return filteredTrades;
  }, [trades, filters, sortConfig]);

  const outcomeData = useMemo(() => {
    return [
      { name: 'Take Profit', value: stats.wins },
      { name: 'Stop Loss', value: stats.losses },
      { name: 'Break Even', value: stats.breakEvens },
      { name: 'No Trade Days', value: trades.filter(t=> t.outcome === Outcome.NO_TRADE).length },
    ].filter(d => d.value > 0);
  }, [trades, stats]);

  const COLORS = {
    'Take Profit': '#22c55e',
    'Stop Loss': '#ef4444',
    'Break Even': '#f59e0b',
    'No Trade Days': '#6b7280'
  };

  const weeklyWinRateData = useMemo(() => {
    const weeks: { [key: string]: { wins: number, losses: number, total: number } } = {};
    
    trades.forEach(trade => {
        if (trade.outcome === Outcome.TP || trade.outcome === Outcome.SL) {
            const date = new Date(trade.date);
            const firstDay = new Date(date.setDate(date.getDate() - date.getDay()));
            const weekKey = firstDay.toISOString().split('T')[0];

            if (!weeks[weekKey]) {
                weeks[weekKey] = { wins: 0, losses: 0, total: 0 };
            }
            if (trade.outcome === Outcome.TP) {
                weeks[weekKey].wins++;
            } else if (trade.outcome === Outcome.SL) {
                weeks[weekKey].losses++;
            }
        }
    });

    return Object.entries(weeks).map(([week, data]) => ({
      name: week,
      'Win Rate': data.wins + data.losses > 0 ? (data.wins / (data.wins + data.losses)) * 100 : 0,
      wins: data.wins,
      losses: data.losses
    })).sort((a,b) => new Date(a.name).getTime() - new Date(b.name).getTime());
  }, [trades]);

  const dailyTpslData = useMemo(() => {
    const dailyData: { [key: string]: { TP: number; SL: number } } = {};

    trades.forEach((trade) => {
      if (trade.outcome === Outcome.TP || trade.outcome === Outcome.SL) {
        const dayKey = new Date(trade.date).toISOString().split('T')[0];

        if (!dailyData[dayKey]) {
          dailyData[dayKey] = { TP: 0, SL: 0 };
        }
        if (trade.outcome === Outcome.TP) {
          dailyData[dayKey].TP++;
        } else if (trade.outcome === Outcome.SL) {
          dailyData[dayKey].SL++;
        }
      }
    });

    return Object.entries(dailyData)
      .map(([day, data]) => ({
        name: day,
        TP: data.TP,
        SL: data.SL,
      }))
      .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
  }, [trades]);
  
  const cumulativeRRData = useMemo(() => {
    // Step 1: Process and sort all trades by date
    const sortedTrades = trades
      .filter(t => t.outcome !== Outcome.NO_TRADE)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (sortedTrades.length === 0) {
      return [];
    }

    // Step 2: Group trades by day and calculate daily R/R sum
    const dailyData: Map<string, number> = new Map();
    sortedTrades.forEach(trade => {
      const dayKey = new Date(trade.date).toISOString().split('T')[0];
      
      let tradeRR = 0;
      if (trade.rr !== undefined && trade.rr !== null) {
        tradeRR = trade.outcome === Outcome.SL ? -1 : trade.rr;
      } else if (trade.outcome === Outcome.TP && trade.tpSize && trade.slSize && trade.slSize > 0) {
        tradeRR = trade.tpSize / trade.slSize;
      } else if (trade.outcome === Outcome.SL) {
        tradeRR = -1;
      }

      const currentDailyRR = dailyData.get(dayKey) || 0;
      dailyData.set(dayKey, currentDailyRR + tradeRR);
    });

    // Step 3: Calculate the cumulative R/R for each day
    let cumulativeRR = 0;
    const chartData = [];
    
    // The map keys will be in insertion order, which is chronological because we processed sorted trades.
    for (const [day, dailyRR] of dailyData.entries()) {
      cumulativeRR += dailyRR;
      chartData.push({
        name: day,
        'Cumulative R/R': cumulativeRR,
      });
    }

    // Step 4: Prepend a starting point for the equity curve
    return [
      { name: 'Start', 'Cumulative R/R': 0 },
      ...chartData,
    ];
  }, [trades]);

  const performanceByDayData = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyStats: { [key: string]: { wins: number; losses: number; trades: number } } = days.reduce((acc, day) => {
        acc[day] = { wins: 0, losses: 0, trades: 0 };
        return acc;
    }, {} as { [key: string]: { wins: number; losses: number; trades: number } });

    trades.forEach(trade => {
        if (trade.outcome === Outcome.NO_TRADE) return;
        // Adjust for timezone by using UTC date parts
        const date = new Date(trade.date);
        const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
        const dayName = days[utcDate.getUTCDay()];
        
        dailyStats[dayName].trades++;
        if (trade.outcome === Outcome.TP) {
            dailyStats[dayName].wins++;
        } else if (trade.outcome === Outcome.SL) {
            dailyStats[dayName].losses++;
        }
    });

    const orderedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    return orderedDays.map(day => ({
        name: day.substring(0, 3),
        'Win Rate': (dailyStats[day].wins + dailyStats[day].losses > 0)
            ? (dailyStats[day].wins / (dailyStats[day].wins + dailyStats[day].losses)) * 100 : 0,
        'Trades': dailyStats[day].trades,
    }));
  }, [trades]);

  const renderSortableHeader = (label: string, key: SortableTradeKeys) => (
    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
        <button className="flex items-center" onClick={() => requestSort(key)}>
            {label}
            <SortIcon direction={sortConfig.key === key ? sortConfig.direction : undefined} />
        </button>
    </th>
  );

  const rangeOptions = [
    { value: 'all', label: 'All' },
    { value: '0-5', label: '0-5 pips' },
    { value: '5-10', label: '5-10 pips' },
    { value: '10-20', label: '10-20 pips' },
    { value: '20-', label: '20+ pips' },
  ];

  return (
    <div className="space-y-8">
      {viewingTrade && <ImageModal trade={viewingTrade} onClose={() => setViewingTrade(null)} />}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <StatCard title="Total Trades" value={stats.totalTrades.toString()} />
        <StatCard title="Win Rate" value={`${stats.winRate}%`} colorClass={parseFloat(stats.winRate) >= 50 ? 'text-success' : 'text-danger'} />
        <StatCard 
            title="Total R/R Earned" 
            value={`${stats.totalRREarned.toFixed(2)}R`} 
            colorClass={stats.totalRREarned >= 0 ? 'text-success' : 'text-danger'}
        />
        <StatCard
            title="Average R/R"
            value={`${stats.averageRR.toFixed(2)}R`}
            colorClass={stats.averageRR >= 0 ? 'text-success' : 'text-danger'}
            subtext="per trade"
        />
        <StatCard title="Wins" value={stats.wins.toString()} subtext="Take Profits" colorClass="text-success" />
        <StatCard title="Losses" value={stats.losses.toString()} subtext="Stop Losses" colorClass="text-danger" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
             <h3 className="text-lg font-semibold mb-4">Weekly Win Rate</h3>
             <ResponsiveContainer width="100%" height={300}>
                 <BarChart data={weeklyWinRateData}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                     <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                     <YAxis stroke="#9ca3af" unit="%" />
                     <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                     <Legend />
                     <Bar dataKey="Win Rate" fill="#00A86B" />
                 </BarChart>
             </ResponsiveContainer>
         </div>
         <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
             <h3 className="text-lg font-semibold mb-4">Outcome Distribution</h3>
             <ResponsiveContainer width="100%" height={300}>
                 <PieChart>
                     <Pie data={outcomeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                         {outcomeData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                         ))}
                     </Pie>
                     <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                     <Legend />
                 </PieChart>
             </ResponsiveContainer>
         </div>
      </div>
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">TP & SL Frequency</h3>
          <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyTpslData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#9ca3af" allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                  <Legend />
                  <Bar dataKey="TP" name="Take Profit" fill={COLORS['Take Profit']} />
                  <Bar dataKey="SL" name="Stop Loss" fill={COLORS['Stop Loss']} />
              </BarChart>
          </ResponsiveContainer>
      </div>
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">R/R Equity Curve</h3>
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cumulativeRRData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9ca3af" unit="R" domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  formatter={(value: number) => [`${value.toFixed(2)}R`, 'Cumulative R/R']}
                />
                <Legend />
                <Line 
                    type="monotone" 
                    dataKey="Cumulative R/R" 
                    stroke={stats.totalRREarned >= 0 ? COLORS['Take Profit'] : COLORS['Stop Loss']} 
                    strokeWidth={2}
                    dot={{ r: 2, fill: stats.totalRREarned >= 0 ? COLORS['Take Profit'] : COLORS['Stop Loss'] }}
                    activeDot={{ r: 6 }}
                />
            </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
         <h3 className="text-lg font-semibold mb-4">Performance by Day of Week</h3>
         <ResponsiveContainer width="100%" height={300}>
             <BarChart data={performanceByDayData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                 <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                 <YAxis yAxisId="left" orientation="left" stroke="#00A86B" unit="%" />
                 <YAxis yAxisId="right" orientation="right" stroke="#6b7280" allowDecimals={false} dataKey="Trades" />
                 <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} 
                    formatter={(value: number, name: string) => [name === 'Win Rate' ? `${value.toFixed(1)}%` : value, name]}
                 />
                 <Legend />
                 <Bar yAxisId="left" dataKey="Win Rate" fill="#00A86B" name="Win Rate (%)" />
                 <Bar yAxisId="right" dataKey="Trades" fill="#3c3c3c" name="Total Trades" />
             </BarChart>
         </ResponsiveContainer>
       </div>


      <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Trade History</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6 p-4 bg-gray-900/50 rounded-lg">
            <div>
                <label className="text-xs text-gray-400">Start Date</label>
                <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm text-white focus:outline-none focus:ring-primary focus:border-primary" />
            </div>
            <div>
                <label className="text-xs text-gray-400">End Date</label>
                <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm text-white focus:outline-none focus:ring-primary focus:border-primary" />
            </div>
            <div>
                <label className="text-xs text-gray-400">Outcome</label>
                <select name="outcome" value={filters.outcome} onChange={handleFilterChange} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm text-white focus:outline-none focus:ring-primary focus:border-primary">
                    <option value="all">All</option>
                    {Object.values(Outcome).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
            </div>
            <div>
                <label className="text-xs text-gray-400">Type</label>
                <select name="type" value={filters.type} onChange={handleFilterChange} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm text-white focus:outline-none focus:ring-primary focus:border-primary">
                    <option value="all">All</option>
                    {Object.values(TradeType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <div>
                <label className="text-xs text-gray-400">Range Size</label>
                <select name="rangeSize" value={filters.rangeSize} onChange={handleFilterChange} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm text-white focus:outline-none focus:ring-primary focus:border-primary">
                    {rangeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>
            <div>
                <label className="text-xs text-gray-400">Day of Week</label>
                <select name="dayOfWeek" value={filters.dayOfWeek} onChange={handleFilterChange} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm text-white focus:outline-none focus:ring-primary focus:border-primary">
                    <option value="all">All</option>
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                </select>
            </div>
            <div className="flex items-end">
                <button onClick={resetFilters} className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors">Reset</button>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700/50">
                <tr>
                  {renderSortableHeader('Date', 'date')}
                  {renderSortableHeader('Time', 'activationTime')}
                  {renderSortableHeader('Type', 'type')}
                  {renderSortableHeader('Outcome', 'outcome')}
                  {renderSortableHeader('R/R', 'rr')}
                  {renderSortableHeader('Range', 'rangeSize')}
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">SL Sweep Notes</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Notes</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Images</th>
                  <th scope="col" className="relative px-4 py-3"><span className="sr-only">Delete</span></th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {filteredAndSortedTrades.map(trade => (
                  <tr key={trade.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">{new Date(trade.date).toLocaleDateString()}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{trade.activationTime || 'N/A'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${trade.type === 'BUY' ? 'bg-green-900 text-green-300' : trade.type === 'SELL' ? 'bg-red-900 text-red-300' : 'bg-gray-700 text-gray-300'}`}>
                        {trade.type ?? 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className={`font-bold ${trade.outcome === Outcome.TP ? 'text-success' : trade.outcome === Outcome.SL ? 'text-danger' : trade.outcome === Outcome.BE ? 'text-warning' : 'text-gray-400'}`}>
                            {trade.outcome}
                        </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      {trade.rr ? `${trade.rr.toFixed(2)}R` : (trade.tpSize && trade.slSize && trade.slSize > 0) ? `${(trade.tpSize / trade.slSize).toFixed(2)}R` : 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      {trade.rangeSize != null ? `${trade.rangeSize}p` : 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400 max-w-xs truncate" title={trade.slSweepNotes}>
                        {trade.slSweepNotes || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400 max-w-xs truncate" title={trade.notes}>
                        {trade.notes}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {trade.images && Object.keys(trade.images).length > 0 && (
                          <button onClick={() => setViewingTrade(trade)} className="text-primary hover:underline text-xs">
                              View ({Object.keys(trade.images).length})
                          </button>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => deleteTrade(trade.id)} className="text-danger hover:text-red-400">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAndSortedTrades.length === 0 && <p className="text-center py-8 text-gray-500">No trades match the current filters.</p>}
        </div>
      </div>
    </div>
  );
};
