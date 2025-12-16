'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'Can I upgrade or downgrade modules anytime?',
    answer: 'Yes! You can add or remove modules at any time through your dashboard. Changes take effect immediately, and your billing is adjusted automatically on your next billing cycle. No penalties or waiting periods.'
  },
  {
    question: 'Is there a free trial available?',
    answer: 'Absolutely. We offer a 14-day free trial with access to all modules so you can fully evaluate the platform. No credit card required to start. At the end of your trial, simply choose the modules you want to keep.'
  },
  {
    question: 'What is included in the setup?',
    answer: 'Our setup includes complete platform configuration, data import assistance, team training sessions, and dedicated onboarding support. We also help configure your white-label mobile apps with your branding if you choose those modules.'
  },
  {
    question: 'Do you offer custom development?',
    answer: 'Yes, we offer custom development services for enterprises that need specific integrations, features, or workflows. Contact our sales team to discuss your requirements and get a custom quote.'
  },
  {
    question: 'What is your cancellation policy?',
    answer: 'You can cancel anytime with no penalties. Your access continues until the end of your current billing period. We also offer data export so you can take your information with you if needed.'
  },
  {
    question: 'How secure is the platform?',
    answer: 'Security is our top priority. We use enterprise-grade encryption, SOC 2 compliant infrastructure, regular security audits, and multi-factor authentication. All data is backed up daily and stored in secure, geographically distributed data centers.'
  },
  {
    question: 'Can I use my own branding on the mobile apps?',
    answer: 'Yes! Both the Customer Mobile App and Driver/Admin App modules include full white-label capabilities. You can customize the app name, logo, colors, and other branding elements to match your company identity.'
  },
  {
    question: 'What kind of support do you offer?',
    answer: 'We offer email support for all plans, with priority support for Standard and above. Professional and Enterprise plans include phone support and a dedicated account manager. Our average response time is under 2 hours.'
  }
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Got questions? We have got answers.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition"
              >
                <span className="font-semibold text-gray-900 pr-8">{faq.question}</span>
                <ChevronDown 
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 text-gray-600">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-gray-600 mb-4">Still have questions?</p>
          <a 
            href="#contact"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Contact Our Team
          </a>
        </motion.div>
      </div>
    </section>
  )
}
