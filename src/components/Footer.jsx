import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-4">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm mb-2 md:mb-0">
                &copy; {new Date().getFullYear()} Burnout Check. All rights reserved.
            </p>
            <div className="flex space-x-4">
                <Link to="/assessment" className="hover:underline">
                    Take the check
                </Link>
                <Link to="/tips" className="hover:underline">
                    Tips
                </Link>
            </div>
        </div>
    </footer>
  )
}