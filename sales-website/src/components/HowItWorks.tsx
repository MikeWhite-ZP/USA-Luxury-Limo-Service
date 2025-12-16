'use client'

import { motion } from 'framer-motion'
import { Settings, Rocket, TrendingUp, Check } from 'lucide-react'

const steps = [
  {
    number: '01',
    title: 'Choose Your Modules',
    description: 'Select only the modules your business needs. Start with the Backend API as your foundation and add additional features like web dashboard, SMS notifications, and mobile apps.',
    icon: Settings,
    color: 'from-blue-500 to-blue-600',
    features: ['Flexible selection', 'No forced bundles', 'Pay for what you use']
  },
  {
    number: '02',
    title: 'Deploy In Minutes',
    description: 'Our automated deployment system gets your platform running quickly. We handle all the technical setup, server configuration, and security so you can focus on your business.',
    icon: Rocket,
    color: 'from-purple-500 to-purple-600',
    features: ['Automated setup', 'Cloud-hosted', 'Enterprise security']
  },
  {
    number: '03',
    title: 'Scale As You Grow',
    description: 'Add new modules anytime as your business expands. No migrations, no downtime. Simply upgrade your subscription and new features are instantly available.',
    icon: TrendingUp,
    color: 'from-green-500 to-green-600',
    features: ['Instant upgrades', 'No downtime', 'Flexible scaling']
  }
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get your transportation management platform up and running in three simple steps.
          </p>
        </motion.div>

        <div className="relative">
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-purple-200 to-green-200 -translate-y-1/2"></div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 relative z-10">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <div className="absolute top-8 right-8 text-6xl font-bold text-gray-100">
                    {step.number}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
                  <p className="text-gray-600 mb-6">{step.description}</p>
                  
                  <ul className="space-y-2">
                    {step.features.map((feature) => (
                      <li key={feature} className="flex items-center text-sm text-gray-600">
                        <Check className="w-5 h-5 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
