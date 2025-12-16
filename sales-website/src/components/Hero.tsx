'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Play, Check } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      <div className="absolute inset-0 gradient-bg opacity-5"></div>
      
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-60 h-60 bg-cyan-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Now with Mobile App Support
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Modular Transportation Management
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
                Pay Only For What You Need
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-xl">
              Scale your fleet operations with our flexible, subscription-based platform. 
              Choose the modules that fit your business and add more as you grow.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <a 
                href="#pricing"
                className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold text-lg shadow-lg shadow-blue-600/30"
              >
                View Pricing
                <ArrowRight className="ml-2 w-5 h-5" />
              </a>
              <a 
                href="#contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-800 rounded-xl hover:bg-gray-50 transition font-semibold text-lg border border-gray-200"
              >
                <Play className="mr-2 w-5 h-5 text-blue-600" />
                Book a Demo
              </a>
            </div>

            <div className="flex flex-wrap gap-6 text-sm text-gray-600">
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-2" />
                No long-term contracts
              </div>
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-2" />
                Scale up or down anytime
              </div>
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-2" />
                White-label mobile apps
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl transform rotate-3 opacity-20"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                <div className="bg-gray-800 px-4 py-3 flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="ml-4 text-gray-400 text-sm">dashboard.unonsolutions.com</span>
                </div>
                <div className="p-6 bg-gradient-to-br from-gray-50 to-white">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600">247</div>
                      <div className="text-xs text-gray-500">Active Vehicles</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl">
                      <div className="text-2xl font-bold text-green-600">1.2K</div>
                      <div className="text-xs text-gray-500">Trips Today</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl">
                      <div className="text-2xl font-bold text-purple-600">98%</div>
                      <div className="text-xs text-gray-500">On-Time Rate</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium text-gray-800">Live Fleet Map</span>
                      <span className="text-xs text-green-500">Real-time</span>
                    </div>
                    <div className="h-32 bg-gradient-to-br from-blue-100 to-cyan-50 rounded-lg flex items-center justify-center">
                      <div className="text-gray-400 text-sm">Interactive Map View</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-4 border border-gray-100"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-800">Booking Confirmed</div>
                  <div className="text-xs text-gray-500">SMS sent to customer</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
