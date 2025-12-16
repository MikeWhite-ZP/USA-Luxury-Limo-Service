'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Server, Monitor, MessageSquare, Smartphone, Users, ArrowRight, Lock } from 'lucide-react'

const modules = [
  { id: 'backend-api', name: 'Backend API', price: 99, icon: Server, required: true, description: 'Core platform - always included' },
  { id: 'frontend-web', name: 'Web Dashboard', price: 49, icon: Monitor, required: false, description: 'Desktop management interface' },
  { id: 'sms-service', name: 'SMS Notifications', price: 29, icon: MessageSquare, required: false, description: 'Automated alerts & messaging' },
  { id: 'customer-app', name: 'Customer Mobile App', price: 79, icon: Smartphone, required: false, description: 'White-label iOS & Android' },
  { id: 'admin-app', name: 'Driver/Admin App', price: 79, icon: Users, required: false, description: 'Driver mobile application' },
]

const tiers = [
  { name: 'Basic', price: 99, modules: ['backend-api'], popular: false, description: 'API access only' },
  { name: 'Standard', price: 177, modules: ['backend-api', 'frontend-web', 'sms-service'], popular: true, description: 'Most popular choice' },
  { name: 'Professional', price: 256, modules: ['backend-api', 'frontend-web', 'sms-service', 'customer-app'], popular: false, description: 'With customer app' },
  { name: 'Enterprise', price: 335, modules: ['backend-api', 'frontend-web', 'sms-service', 'customer-app', 'admin-app'], popular: false, description: 'Full suite' },
]

export default function PricingCalculator() {
  const [selectedModules, setSelectedModules] = useState<string[]>(['backend-api'])

  const toggleModule = (moduleId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (moduleId === 'backend-api') return
    
    setSelectedModules(prev => 
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    )
  }

  const selectTier = (tierModules: string[], e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedModules(tierModules)
  }

  const totalPrice = modules
    .filter(m => selectedModules.includes(m.id))
    .reduce((sum, m) => sum + m.price, 0)

  const isModuleSelected = (moduleId: string) => selectedModules.includes(moduleId)

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Build Your Perfect Plan
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select the modules you need and see your monthly price instantly. 
            No hidden fees, no surprises.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-gray-50 rounded-2xl p-8"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Select Your Modules</h3>
            
            <div className="space-y-4">
              {modules.map((module) => {
                const isSelected = isModuleSelected(module.id)
                return (
                  <div
                    key={module.id}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-blue-600' : 'bg-gray-200'
                      }`}>
                        <module.icon className={`w-6 h-6 ${
                          isSelected ? 'text-white' : 'text-gray-500'
                        }`} />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                          {module.name}
                          {module.required && (
                            <Lock className="w-3 h-3 text-blue-600" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{module.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="font-bold text-gray-900 text-lg">
                        ${module.price}<span className="text-sm font-normal text-gray-500">/mo</span>
                      </span>
                      
                      {module.required ? (
                        <div className="w-14 h-8 rounded-full bg-blue-600 flex items-center justify-center px-1">
                          <Check className="w-4 h-4 text-white" />
                          <span className="text-xs text-white ml-1">ON</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => toggleModule(module.id, e)}
                          className={`relative w-14 h-8 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            isSelected ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                          aria-pressed={isSelected}
                          aria-label={`Toggle ${module.name}`}
                        >
                          <span
                            className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 flex items-center justify-center ${
                              isSelected ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-blue-600" />}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100">Selected modules:</span>
                <span className="font-medium">{selectedModules.length} of {modules.length}</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-medium text-blue-100">Your Monthly Total</span>
                <div className="text-right">
                  <span className="text-4xl font-bold">${totalPrice}</span>
                  <span className="text-blue-200">/month</span>
                </div>
              </div>
              <div className="flex gap-4">
                <a 
                  href="#contact"
                  className="flex-1 text-center py-3 px-6 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
                >
                  Start Free Trial
                </a>
                <a 
                  href="#contact"
                  className="flex-1 text-center py-3 px-6 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 transition border border-blue-400"
                >
                  Contact Sales
                </a>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Or Choose a Package</h3>
            
            <div className="space-y-4">
              {tiers.map((tier) => {
                const isCurrentTier = JSON.stringify(selectedModules.sort()) === JSON.stringify(tier.modules.sort())
                return (
                  <div
                    key={tier.name}
                    className={`relative p-6 rounded-xl border-2 transition ${
                      isCurrentTier
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : tier.popular 
                          ? 'border-blue-300 bg-blue-50/50' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    {tier.popular && (
                      <div className="absolute -top-3 right-6">
                        <span className="px-4 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
                          Most Popular
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          {tier.name}
                          {isCurrentTier && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              Selected
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-500">{tier.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-gray-900">${tier.price}</div>
                        <div className="text-gray-500 text-sm">/month</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4">
                      {tier.modules.map((moduleId) => {
                        const module = modules.find(m => m.id === moduleId)
                        if (!module) return null
                        return (
                          <div 
                            key={moduleId}
                            className="group relative w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center cursor-help"
                          >
                            <module.icon className="w-4 h-4 text-blue-600" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              {module.name}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    <button 
                      type="button"
                      onClick={(e) => selectTier(tier.modules, e)}
                      disabled={isCurrentTier}
                      className={`w-full py-3 rounded-lg font-medium transition flex items-center justify-center ${
                        isCurrentTier
                          ? 'bg-green-100 text-green-700 cursor-default'
                          : tier.popular
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {isCurrentTier ? (
                        <>
                          <Check className="mr-2 w-4 h-4" />
                          Currently Selected
                        </>
                      ) : (
                        <>
                          Select This Package
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
