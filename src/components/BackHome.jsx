import React from 'react'
import { Link } from 'react-router-dom'

// A small "Back to home" link at the end of every page where people write or edit,
// so the way back is right where they finish instead of up in the navbar.
const BackHome = () => (
    <div className="pt-2 flex justify-center">
        <Link to="/home" className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-hairline bg-card text-[14px] font-medium text-body hover:text-forest hover:border-leaf transition-colors">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">home</span>
            Back to home
        </Link>
    </div>
)

export default BackHome
