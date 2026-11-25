import React from 'react'

// One goal with its round tick. Used on the Goals page and the homepage tile.
const GoalCheck = ({ text, done, onToggle, disabled }) => (
    <label className={`flex flex-1 min-w-0 items-center gap-3 select-none ${disabled ? 'cursor-default' : 'cursor-pointer'}`}>
        <input type="checkbox" checked={done} onChange={onToggle} disabled={disabled} className="peer sr-only" />
        <span className="w-5 h-5 shrink-0 rounded-full border-2 border-leaf flex items-center justify-center transition-colors peer-checked:bg-leaf peer-focus-visible:ring-3 peer-focus-visible:ring-leaf/30" aria-hidden="true">
            <span className={`material-symbols-outlined text-[14px] text-on-primary ${done ? '' : 'invisible'}`}>check</span>
        </span>
        <span className="text-[15px] font-medium text-heading break-words peer-checked:text-body peer-checked:line-through">{text}</span>
    </label>
)

export default GoalCheck
