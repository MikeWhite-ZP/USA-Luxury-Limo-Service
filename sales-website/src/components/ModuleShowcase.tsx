'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Server, Monitor, MessageSquare, Smartphone, Users, Check, Star, ChevronDown, ChevronUp } from 'lucide-react'

const modules = [
  {
    id: 'backend-api',
    name: 'Backend API',
    price: 99,
    icon: Server,
    color: 'from-blue-500 to-blue-700',
    bgColor: 'bg-blue-50',
    hoverBg: 'hover:bg-blue-100',
    borderColor: 'border-blue-200',
    required: true,
    description: 'The Foundation: RESTful API, fleet management, dispatch, reporting',
    features: [
      'Complete RESTful API',
      'Fleet & vehicle management',
      'Dispatch operations',
      'Route optimization',
      'Real-time tracking',
      'Reporting & analytics',
      'User authentication',
      'Multi-tenant support'
    ]
  },
  {
    id: 'frontend-web',
    name: 'Web Dashboard',
    price: 49,
    icon: Monitor,
    color: 'from-purple-500 to-purple-700',
    bgColor: 'bg-purple-50',
    hoverBg: 'hover:bg-purple-100',
    borderColor: 'border-purple-200',
    required: false,
    description: 'Desktop Command Center: Full-featured web interface for operations',
    features: [
      'Dispatch dashboard',
      'Fleet management UI',
      'Driver management',
      'Booking management',
      'Real-time map view',
      'Analytics dashboard',
      'Customer management',
      'Invoice generation'
    ]
  },
  {
    id: 'sms-service',
    name: 'SMS Notifications',
    price: 29,
    icon: MessageSquare,
    color: 'from-green-500 to-green-700',
    bgColor: 'bg-green-50',
    hoverBg: 'hover:bg-green-100',
    borderColor: 'border-green-200',
    required: false,
    description: 'Automated Alerts: Driver dispatch, customer ETA, status updates',
    features: [
      'Driver dispatch alerts',
      'Customer booking confirmations',
      'ETA notifications',
      'Status updates',
      'Automated reminders',
      'Two-way messaging',
      'Delivery confirmations',
      'Custom templates'
    ]
  },
  {
    id: 'customer-app',
    name: 'Customer Mobile App',
    price: 79,
    icon: Smartphone,
    color: 'from-cyan-500 to-cyan-700',
    bgColor: 'bg-cyan-50',
    hoverBg: 'hover:bg-cyan-100',
    borderColor: 'border-cyan-200',
    required: false,
    description: 'White-Label Customer Experience: iOS & Android booking app',
    features: [
      'iOS & Android apps',
      'Easy booking interface',
      'Real-time tracking',
      'In-app payments',
      'Ride history',
      'Favorite locations',
      'Push notifications',
      'Your branding'
    ]
  },
  {
    id: 'admin-app',
    name: 'Driver/Admin App',
    price: 79,
    icon: Users,
    color: 'from-orange-500 to-orange-700',
    bgColor: 'bg-orange-50',
    hoverBg: 'hover:bg-orange-100',
    borderColor: 'border-orange-200',
    required: false,
    description: 'Driver Command Center: Accept jobs, navigate, update status',
    features: [
      'iOS & Android apps',
      'Job acceptance',
      'Turn-by-turn navigation',
      'Status updates',
      'Earnings tracking',
      'Document management',
      'Shift scheduling',
      'Your branding'
    ]
  }
]

function ModuleCard({ module, index }: { module: typeof modules[0], index: number }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <motion.div
      key={module.id}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className={`group relative bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all duration-300 ${
        module.required ? 'border-blue-400 shadow-blue-100' : 'border-gray-100 hover:border-gray-200 hover:shadow-xl'
      }`}
    >
      {module.required && (
        <div className="absolute top-4 right-4 z-10">
          <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
            <Star className="w-3 h-3 mr-1" />
            Required Base
          </span>
        </div>
      )}

      <div className={`p-6 ${module.bgColor} ${module.hoverBg} transition-colors duration-300`}>
        <div className="flex items-start justify-between">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
            <module.icon className="w-7 h-7 text-white" />
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">${module.price}</div>
            <div className="text-sm text-gray-500">/month</div>
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{module.name}</h3>
        <p className="text-gray-600 text-sm">{module.description}</p>
      </div>

      <div className="p-6 border-t border-gray-100">
        <ul className={`space-y-2 transition-all duration-300 ${isExpanded ? '' : 'max-h-32 overflow-hidden'}`}>
          {module.features.map((feature, i) => (
            <li key={i} className="flex items-start text-sm text-gray-600">
              <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              {feature}
            </li>
          ))}
        </ul>
        
        {module.features.length > 4 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
          >
            {isExpanded ? (
              <>Show less <ChevronUp className="w-4 h-4 ml-1" /></>
            ) : (
              <>Show all features <ChevronDown className="w-4 h-4 ml-1" /></>
            )}
          </button>
        )}
      </div>

      <div className="p-6 pt-0">
        <a
          href="#pricing"
          className={`block w-full py-3 px-4 rounded-xl font-medium transition text-center ${
            module.required 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-blue-600 hover:text-white'
          }`}
        >
          {module.required ? 'Always Included' : 'Add to Plan'}
        </a>
      </div>
    </motion.div>
  )
}

export default function ModuleShowcase() {
  return (
    <section id="modules" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Modules
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Build your perfect transportation management system by selecting only the modules you need. 
            Start with the essentials and add more as you grow.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {modules.map((module, index) => (
            <ModuleCard key={module.id} module={module} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-gray-500 mb-4">Not sure which modules you need?</p>
          <a 
            href="#pricing"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Use Our Pricing Calculator
          </a>
        </motion.div>
      </div>
    </section>
  )
}
