import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const cards = [
    { id: 1, title: "Card 1", content: "This is the first card" },
    { id: 2, title: "Card 2", content: "This is the second card" },
    { id: 3, title: "Card 3", content: "This is the third card" },
];

const CardExpand = () => {
    const [selectedId, setSelectedId] = useState(null);

    return (
        <div className="flex flex-wrap gap-6 p-8 justify-center">
            {cards.map((card) => (
                <motion.div
                    key={card.id}
                    layoutId={`card-${card.id}`}
                    onClick={() => setSelectedId(card.id)}
                    className="bg-white shadow-md rounded-xl w-64 p-6 cursor-pointer hover:shadow-xl transition-shadow"
                >
                    <h2 className="text-lg font-semibold">{card.title}</h2>
                </motion.div>
            ))}

            <AnimatePresence>
                {selectedId && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="fixed inset-0 bg-black bg-opacity-40 z-40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedId(null)}
                        />

                        {/* Expanded Card */}
                        <motion.div
                            layoutId={`card-${selectedId}`}
                            className="fixed z-50 bg-white rounded-3xl shadow-2xl px-8 py-10"
                            style={{
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '90vw',
                                maxWidth: '800px',
                                height: 'auto',
                            }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.4, ease: 'easeInOut' }}
                        >
                            <h2 className="text-2xl font-bold mb-4">
                                {cards.find((c) => c.id === selectedId)?.title}
                            </h2>
                            <p className="text-gray-700 mb-4">
                                {cards.find((c) => c.id === selectedId)?.content}
                            </p>
                            <button
                                className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                onClick={() => setSelectedId(null)}
                            >
                                Close
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CardExpand;
