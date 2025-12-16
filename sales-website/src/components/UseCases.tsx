'use client'

import { motion } from 'framer-motion'
import { Quote, Building2, Truck, Car, Users } from 'lucide-react'

const useCases = [
  {
    icon: Building2,
    company: 'Small Courier Service',
    title: 'Started with Just the Essentials',
    description: 'We began with only the Backend API to manage our 5 vehicles. The affordable entry point let us test the platform without a huge investment. Now we have added the web dashboard and SMS as we have grown.',
    stats: { label: 'Monthly Cost', value: '$99 initially' },
    color: 'from-blue-500 to-blue-600',
    modules: ['Backend API']
  },
  {
    icon: Truck,
    company: 'Regional Delivery Fleet',
    title: 'Added Features as We Expanded',
    description: 'When we expanded to 50 vehicles, we added the Web Dashboard for better dispatch management and SMS for customer notifications. The modular approach meant we only paid for features when we actually needed them.',
    stats: { label: 'Fleet Size', value: '50+ vehicles' },
    color: 'from-purple-500 to-purple-600',
    modules: ['Backend API', 'Web Dashboard', 'SMS']
  },
  {
    icon: Car,
    company: 'Luxury Limo Service',
    title: 'Full Suite with White-Label Apps',
    description: 'As a premium service, we needed the complete package including white-label mobile apps for both our clients and drivers. The branded apps give us a professional edge over competitors using generic solutions.',
    stats: { label: 'Customer Rating', value: '4.9 stars' },
    color: 'from-green-500 to-green-600',
    modules: ['Backend API', 'Web Dashboard', 'SMS', 'Customer App', 'Driver App']
  }
]

export default function UseCases() {
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
            Success Stories
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See how businesses of all sizes use our modular platform to streamline their operations.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.company}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className={`h-2 bg-gradient-to-r ${useCase.color}`}></div>
              
              <div className="p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${useCase.color} flex items-center justify-center`}>
                    <useCase.icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{useCase.company}</div>
                    <div className="text-sm text-gray-500">{useCase.stats.label}: {useCase.stats.value}</div>
                  </div>
                </div>

                <Quote className="w-8 h-8 text-gray-200 mb-4" />
                
                <h3 className="text-xl font-bold text-gray-900 mb-3">{useCase.title}</h3>
                <p className="text-gray-600 mb-6">{useCase.description}</p>
                
                <div className="border-t border-gray-100 pt-6">
                  <div className="text-sm text-gray-500 mb-2">Modules Used:</div>
                  <div className="flex flex-wrap gap-2">
                    {useCase.modules.map((module) => (
                      <span
                        key={module}
                        className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full"
                      >
                        {module}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center justify-center space-x-8 py-8 px-12 bg-white rounded-2xl shadow-lg">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">500+</div>
              <div className="text-gray-500">Active Companies</div>
            </div>
            <div className="w-px h-16 bg-gray-200"></div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">10K+</div>
              <div className="text-gray-500">Vehicles Managed</div>
            </div>
            <div className="w-px h-16 bg-gray-200"></div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600">1M+</div>
              <div className="text-gray-500">Trips Completed</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
