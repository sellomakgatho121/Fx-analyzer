'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, AlertTriangle, Shield, Target, DollarSign, Crosshair, Zap, Divide } from 'lucide-react';

export default function TradePanel({ currentPrice = 1.0865, symbol = 'EUR/USD' }) {
    const [lotSize, setLotSize] = useState(0.1);
    const [stopLoss, setStopLoss] = useState(20);
    const [takeProfit, setTakeProfit] = useState(40);
    const [riskPercent, setRiskPercent] = useState(1);
    const [isBuy, setIsBuy] = useState(true);
    const [assetClass, setAssetClass] = useState('FOREX'); // FOREX, CRYPTO, INDICES, SHARES

    const lotPresets = [0.01, 0.05, 0.1, 0.5, 1.0];
    const accountBalance = 10000; // Mock balance

    const pipValue = lotSize * 10; // Simplified for major pairs
    const slValue = (stopLoss * pipValue).toFixed(2);
    const tpValue = (takeProfit * pipValue).toFixed(2);

    // Dynamic Accent Colors
    const accentColor = isBuy ? 'var(--acid-lime)' : 'var(--hyper-red)';
    const textAccent = isBuy ? 'text-[var(--acid-lime)]' : 'text-[var(--hyper-red)]';
    const borderAccent = isBuy ? 'border-[var(--acid-lime)]' : 'border-[var(--hyper-red)]';

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="panel-glass p-6 h-full flex flex-col relative overflow-hidden group"
        >
            {/* Background Decor */}
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Crosshair size={120} strokeWidth={0.5} />
            </div>

            <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                <div className={`p-2 rounded bg-white/5 ${textAccent}`}>
                    <Calculator size={20} />
                </div>
                <div>
                    <h3 className="text-xl font-display font-bold tracking-tight">Command Center</h3>
                    <p className="text-xs text-white/40 font-mono uppercase tracking-wider">Manual Execution</p>
                </div>
            </div>

            {/* Asset Class Selector */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
                {['FOREX', 'CRYPTO', 'INDICES', 'SHARES'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setAssetClass(type)}
                        className={`px-3 py-1 text-[10px] font-bold rounded border transition-all whitespace-nowrap ${assetClass === type
                                ? 'bg-white text-black border-white'
                                : 'bg-transparent text-white/40 border-white/10 hover:border-white/30'
                            }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Direction Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-lg mb-6 border border-white/5">
                <button
                    onClick={() => setIsBuy(true)}
                    className={`nav-btn py-3 rounded-md font-bold text-sm tracking-wide transition-all ${isBuy ? 'bg-[var(--acid-lime)] text-black shadow-[0_0_20px_rgba(204,255,0,0.3)]' : 'text-white/40 hover:text-white'
                        }`}
                >
                    BUY LONG
                </button>
                <button
                    onClick={() => setIsBuy(false)}
                    className={`nav-btn py-3 rounded-md font-bold text-sm tracking-wide transition-all ${!isBuy ? 'bg-[var(--hyper-red)] text-white shadow-[0_0_20px_rgba(255,15,66,0.3)]' : 'text-white/40 hover:text-white'
                        }`}
                >
                    SELL SHORT
                </button>
            </div>

            {/* Current Price Display */}
            <div className="mb-8 relative">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-xs text-white/40 font-mono uppercase">Market Price</span>
                    <span className={`text-xs font-bold ${textAccent} bg-white/5 px-2 py-0.5 rounded`}>LIVE</span>
                </div>
                <div className="text-5xl font-mono font-bold tracking-tighter text-white tabular-nums">
                    {currentPrice.toFixed(5)}
                </div>
                <div className={`h-px w-full mt-2 bg-gradient-to-r from-transparent via-white/20 to-transparent`} />
            </div>

            {/* Controls */}
            <div className="space-y-6 flex-1">
                {/* Lot Size */}
                <div>
                    <label className="flex justify-between text-xs text-white/60 mb-3 font-mono">
                        <span className="flex items-center gap-1"><DollarSign size={12} /> VOLUME (LOTS)</span>
                        <span className="text-white">{lotSize}</span>
                    </label>
                    <div className="grid grid-cols-5 gap-2 mb-3">
                        {lotPresets.map((preset) => (
                            <button
                                key={preset}
                                onClick={() => setLotSize(preset)}
                                className={`py-1.5 text-xs font-mono border rounded transition-all ${lotSize === preset
                                    ? `bg-white/10 text-white border-white/40`
                                    : 'border-white/5 text-white/30 hover:border-white/20'
                                    }`}
                            >
                                {preset}
                            </button>
                        ))}
                    </div>
                    <input
                        type="range"
                        min="0.01"
                        max="5.0"
                        step="0.01"
                        value={lotSize}
                        onChange={(e) => setLotSize(parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white hover:accent-[var(--acid-lime)] transition-all"
                    />
                </div>

                {/* SL / TP Inputs */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded bg-white/5 border border-white/5">
                        <label className="text-[10px] text-white/40 uppercase font-bold mb-1 block">Stop Loss (Pips)</label>
                        <input
                            type="number"
                            value={stopLoss}
                            onChange={(e) => setStopLoss(parseInt(e.target.value))}
                            className="bg-transparent text-xl font-mono font-bold text-white w-full outline-none border-b border-transparent focus:border-[var(--hyper-red)] transition-colors"
                        />
                        <div className="text-xs text-[var(--hyper-red)] mt-1 font-mono">-${slValue}</div>
                    </div>
                    <div className="p-3 rounded bg-white/5 border border-white/5">
                        <label className="text-[10px] text-white/40 uppercase font-bold mb-1 block">Take Profit (Pips)</label>
                        <input
                            type="number"
                            value={takeProfit}
                            onChange={(e) => setTakeProfit(parseInt(e.target.value))}
                            className="bg-transparent text-xl font-mono font-bold text-white w-full outline-none border-b border-transparent focus:border-[var(--acid-lime)] transition-colors"
                        />
                        <div className="text-xs text-[var(--acid-lime)] mt-1 font-mono">+${tpValue}</div>
                    </div>
                </div>

                {/* Risk Gauge */}
                <div className="p-4 rounded-lg bg-black/40 border border-white/5">
                    <div className="flex items-center gap-2 mb-3 text-xs text-amber-500/80">
                        <AlertTriangle size={12} />
                        <span className="uppercase font-bold tracking-wider">Risk Analysis</span>
                    </div>

                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-white/50">Risk/Reward Ratio</span>
                        <span className="font-mono text-white text-sm">1:{(takeProfit / stopLoss).toFixed(1)}</span>
                    </div>

                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden flex">
                        <div style={{ width: '30%' }} className="bg-[var(--hyper-red)] h-full" />
                        <div style={{ width: '70%' }} className="bg-[var(--acid-lime)] h-full" />
                    </div>
                    <div className="flex justify-between text-[10px] text-white/30 mt-1 font-mono">
                        <span>LOSS</span>
                        <span>PROFIT</span>
                    </div>
                </div>
            </div>

            {/* Execute Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-4 mt-6 rounded-lg font-display font-bold text-lg tracking-widest flex items-center justify-center gap-3 transition-shadow ${isBuy
                    ? 'bg-[var(--acid-lime)] text-black shadow-[0_0_40px_-10px_rgba(204,255,0,0.4)] hover:shadow-[0_0_60px_-10px_rgba(204,255,0,0.6)]'
                    : 'bg-[var(--hyper-red)] text-white shadow-[0_0_40px_-10px_rgba(255,15,66,0.4)] hover:shadow-[0_0_60px_-10px_rgba(255,15,66,0.6)]'
                    }`}
            >
                <Zap size={20} fill="currentColor" />
                EXECUTE {isBuy ? 'BUY' : 'SELL'}
            </motion.button>
        </motion.div>
    );
}
