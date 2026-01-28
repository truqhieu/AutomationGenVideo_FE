'use client';

import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SearchVideoPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <motion.div 
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-slate-100 p-8 rounded-full mb-6"
            >
                <Search className="w-16 h-16 text-slate-400" />
            </motion.div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Search Video</h1>
            <p className="text-slate-500 text-lg">This feature is currently under development.</p>
        </div>
    )
}
