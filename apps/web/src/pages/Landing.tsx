import { motion } from 'framer-motion';
import { ArrowRight, BarChart2, Users, FileText, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Landing() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 z-0" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mt-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
                Business Management <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Reimagined
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                Streamline your operations, manage clients, and track finances in one powerful, intuitive platform designed for growth.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/register" className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 md:text-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-105">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link to="/login" className="inline-flex items-center justify-center px-8 py-4 border border-gray-300 text-lg font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 md:text-xl transition-all hover:scale-105">
                  Live Demo
                </Link>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="mt-16 relative"
            >
              <div className="absolute inset-0 bg-blue-600 blur-3xl opacity-10 rounded-full" />
              <img 
                src="https://placehold.co/1200x800/e2e8f0/1e293b?text=Dashboard+Preview" 
                alt="App Dashboard" 
                className="relative rounded-2xl shadow-2xl border border-gray-200 w-full" 
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to run your business
            </p>
          </div>

          <motion.div 
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-12"
          >
            {[
              {
                icon: <BarChart2 className="h-8 w-8 text-white" />,
                title: "Advanced Analytics",
                desc: "Get real-time insights into your business performance with detailed reports and customizable dashboards.",
                color: "bg-blue-500"
              },
              {
                icon: <Users className="h-8 w-8 text-white" />,
                title: "CRM & Client Management",
                desc: "Keep track of every interaction. manage leads, and build stronger relationships with your customers.",
                color: "bg-indigo-500"
              },
              {
                icon: <FileText className="h-8 w-8 text-white" />,
                title: "Smart Invoicing",
                desc: "Create professional invoices in seconds, track payments, and automate follow-ups.",
                color: "bg-purple-500"
              }
            ].map((feature, index) => (
              <motion.div 
                key={index} 
                variants={fadeInUp}
                className="relative p-8 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl transition-shadow"
              >
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${feature.color.replace('bg-', '')} to-transparent opacity-50`} />
                <div className={`inline-flex items-center justify-center p-3 rounded-xl ${feature.color} shadow-lg mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-6">
                Enterprise-grade security for everyone.
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                We take data security seriously. Your information is encrypted, backed up, and protected by industry-leading standards.
              </p>
              <ul className="space-y-4">
                {[
                  "Bank-level 256-bit encryption",
                  "Daily automated backups",
                  "Role-based access control",
                  "99.9% Uptime SLA"
                ].map((item, i) => (
                  <li key={i} className="flex items-center text-gray-700">
                    <Shield className="h-5 w-5 text-green-500 mr-3" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
               <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl transform rotate-2"></div>
               <div className="relative bg-white p-8 rounded-xl shadow-lg">
                 <div className="flex items-center mb-6">
                   <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600">JD</div>
                   <div className="ml-4">
                     <h4 className="text-lg font-bold text-gray-900">John Doe</h4>
                     <p className="text-gray-500">CEO, TechStart Inc.</p>
                   </div>
                 </div>
                 <p className="text-gray-600 italic">
                   "FluxERP has completely transformed how we manage our agency. The invoicing features alone have saved us hours every week. Highly recommended!"
                 </p>
                 <div className="flex mt-4 text-yellow-400">
                   {[...Array(5)].map((_, i) => (
                     <svg key={i} className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                       <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                     </svg>
                   ))}
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-600 rounded-3xl p-12 text-center text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <h2 className="text-3xl font-extrabold mb-4 relative z-10">Ready to get started?</h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto relative z-10">
              Join thousands of businesses that trust FluxERP to power their growth. No credit card required.
            </p>
            <Link to="/register" className="relative z-10 inline-block bg-white text-blue-600 font-bold py-4 px-10 rounded-lg shadow-lg hover:bg-gray-50 transition-colors transform hover:-translate-y-1">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
