'use client'

import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'

const features = [
  { name: 'Backend API', basic: true, standard: true, professional: true, enterprise: true },
  { name: 'Web Dashboard', basic: false, standard: true, professional: true, enterprise: true },
  { name: 'SMS Notifications', basic: false, standard: true, professional: true, enterprise: true },
  { name: 'Customer Mobile App', basic: false, standard: false, professional: true, enterprise: true },
  { name: 'Driver/Admin App', basic: false, standard: false, professional: false, enterprise: true },
  { name: 'API Access', basic: true, standard: true, professional: true, enterprise: true },
  { name: 'Real-time Tracking', basic: true, standard: true, professional: true, enterprise: true },
  { name: 'Custom Branding', basic: false, standard: false, professional: true, enterprise: true },
  { name: 'Priority Support', basic: false, standard: true, professional: true, enterprise: true },
  { name: 'Dedicated Account Manager', basic: false, standard: false, professional: false, enterprise: true },
]

const tiers = [
  { name: 'Basic', price: 99, key: 'basic' },
  { name: 'Standard', price: 177, key: 'standard', popular: true },
  { name: 'Professional', price: 256, key: 'professional' },
  { name: 'Enterprise', price: 335, key: 'enterprise' },
]

export default function ComparisonTable() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Compare Plans
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See what is included in each plan and choose the one that fits your needs.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-x-auto"
        >
          <table className="w-full bg-white rounded-2xl shadow-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="text-left py-6 px-6 font-semibold">Features</th>
                {tiers.map((tier) => (
                  <th key={tier.key} className="text-center py-6 px-6">
                    <div className="relative">
                      {tier.popular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full whitespace-nowrap">
                          Most Popular
                        </span>
                      )}
                      <div className="font-bold text-lg">{tier.name}</div>
                      <div className="text-gray-300 mt-1">
                        <span className="text-2xl font-bold text-white">${tier.price}</span>/mo
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr key={feature.name} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-4 px-6 text-gray-700 font-medium">{feature.name}</td>
                  {tiers.map((tier) => (
                    <td key={tier.key} className="text-center py-4 px-6">
                      {feature[tier.key as keyof typeof feature] ? (
                        <Check className="w-6 h-6 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-6 h-6 text-gray-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-gray-100">
                <td className="py-6 px-6"></td>
                {tiers.map((tier) => (
                  <td key={tier.key} className="text-center py-6 px-6">
                    <a
                      href="#contact"
                      className={`inline-block px-6 py-3 rounded-lg font-semibold transition ${
                        tier.popular
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Get Started
                    </a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  )
}
