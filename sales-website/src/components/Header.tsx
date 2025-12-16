'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">U</span>
            </div>
            <span className="text-xl font-bold text-gray-900">UNON Solutions</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#modules" className="text-gray-600 hover:text-blue-600 transition">Modules</a>
            <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition">Pricing</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition">How It Works</a>
            <a href="#faq" className="text-gray-600 hover:text-blue-600 transition">FAQ</a>
            <a href="#contact" className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition font-medium">
              Get Started
            </a>
          </div>

          <button 
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col space-y-4">
              <a href="#modules" className="text-gray-600 hover:text-blue-600 transition">Modules</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition">Pricing</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition">How It Works</a>
              <a href="#faq" className="text-gray-600 hover:text-blue-600 transition">FAQ</a>
              <a href="#contact" className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition font-medium text-center">
                Get Started
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
