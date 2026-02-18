import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, ChevronDown, Check } from 'lucide-react';

export default function ModelSelector({ socket, currentModel = 'deepseek-r1:1.5b' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [models, setModels] = useState([]);
    const [selected, setSelected] = useState(currentModel);

    useEffect(() => {
        if (!socket) return;

        // Request models on mount
        socket.emit('get-llm-models');

        socket.on('llm-models-list', (list) => {
            if (list && list.length > 0) setModels(list);
            else setModels(['deepseek-r1:1.5b', 'llama3', 'mistral']); // Fallbacks
        });

        socket.on('model-changed', (newModel) => {
            setSelected(newModel);
        });

        return () => {
            socket.off('llm-models-list');
            socket.off('model-changed');
        };
    }, [socket]);

    const handleSelect = (model) => {
        setSelected(model);
        setIsOpen(false);
        socket.emit('switch-llm-model', model);
    };

    return (
        <div className="relative z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors"
            >
                <Cpu size={14} className="text-cyan-400" />
                <span className="text-sm font-medium text-cyan-100">{selected.split(':')[0]}</span>
                <ChevronDown size={12} className={`text-cyan-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-48 bg-[#0a0f18] border border-cyan-500/20 rounded-lg shadow-xl shadow-cyan-900/20 overflow-hidden"
                    >
                        <div className="p-2">
                            <p className="text-xs text-gray-500 mb-2 px-2">Local LLM Models</p>
                            {models.map(model => (
                                <button
                                    key={model}
                                    onClick={() => handleSelect(model)}
                                    className="w-full text-left px-2 py-1.5 text-sm text-gray-300 hover:bg-white/5 rounded flex justify-between items-center group"
                                >
                                    <span className="group-hover:text-white transition-colors">{model}</span>
                                    {selected === model && <Check size={12} className="text-cyan-400" />}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
