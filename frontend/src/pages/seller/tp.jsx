

{item.notes && (
    <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border-l-4 border-blue-400">
        <div className="flex items-start">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Buyer's Note:</p>
                <p className="text-sm text-blue-700 dark:text-blue-400">{item.notes}</p>
            </div>
        </div>
    </div>
)}