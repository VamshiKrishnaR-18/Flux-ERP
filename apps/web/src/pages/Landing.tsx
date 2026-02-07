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
              <h1 className="text-6xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
                Flux ERP/CRM
                <br />
                <span className="text-4xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Demo
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                Portfolio ERP/CRM covering clients, invoices, quotes, expenses, products, dashboards, and reports. Built to demonstrate a complete workflow, data modeling, and UI polish.
              </p>
	              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/login" className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 md:text-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-105">
                  Explore Demo <ArrowRight className="ml-2 h-5 w-5" />
	                </Link>
	                <Link to="/login" className="inline-flex items-center justify-center px-8 py-4 border border-gray-300 text-lg font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 md:text-xl transition-all hover:scale-105">
	                  Sign in
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
	              <div className="relative rounded-2xl shadow-2xl border border-gray-200 w-full bg-white/80 backdrop-blur">
	                <div className="p-6 md:p-8 grid gap-6 md:grid-cols-3">
	                  <div className="space-y-3">
	                    <div className="h-3 w-24 bg-gray-200 rounded-full" />
	                    <div className="h-6 w-40 bg-gray-100 rounded-lg" />
	                    <div className="h-4 w-28 bg-gray-100 rounded-lg" />
	                  </div>
	                  <div className="md:col-span-2 grid grid-cols-3 gap-3">
	                    {Array.from({ length: 6 }).map((_, i) => (
	                      <div key={i} className="h-20 rounded-xl border border-gray-100 bg-gray-50" />
	                    ))}
	                  </div>
	                </div>
	              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">Project Modules</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Core flows implemented in the demo
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
                title: "Dashboard & insights",
                desc: "Revenue, expenses, trends, and KPIs presented with charts and summary cards.",
                color: "bg-blue-500",
                accent: "via-blue-500"
	              },
	              {
	                icon: <Users className="h-8 w-8 text-white" />,
                title: "Clients & CRM",
                desc: "Client profiles, portal links, and activity views with searchable lists.",
                color: "bg-indigo-500",
                accent: "via-indigo-500"
	              },
	              {
	                icon: <FileText className="h-8 w-8 text-white" />,
                title: "Invoices & quotes",
                desc: "Create, edit, and export PDFs with status tracking and payments.",
                color: "bg-purple-500",
                accent: "via-purple-500"
	              }
	            ].map((feature, index) => (
              <motion.div 
                key={index} 
                variants={fadeInUp}
                className="relative p-8 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl transition-shadow"
              >
	                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${feature.accent} to-transparent opacity-50`} />
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

	      <section id="about" className="py-20 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-6">
                Project overview
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                A full-stack ERP/CRM demo with secure auth, shared types, and a realistic data model for business operations. Built for portfolio review and technical discussions.
              </p>
	              <ul className="space-y-4">
	                {[
                  "JWT-based authentication and protected routes",
                  "Client, invoice, quote, expense, and product workflows",
                  "Exports via PDF and CSV for real-world use cases"
	                ].map((item, i) => (
	                  <li key={i} className="flex items-center text-gray-700">
	                    <Shield className="h-5 w-5 text-green-500 mr-3" />
	                    {item}
	                  </li>
	                ))}
	              </ul>
	            </div>
	            <div className="relative">
	              <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl transform rotate-2" />
	              <div className="relative bg-white p-8 rounded-xl shadow-lg">
	                <h3 className="text-sm font-semibold text-gray-900 tracking-wide uppercase mb-4">
                  Modules included
	                </h3>
	                <ul className="space-y-3 text-sm text-gray-600">
	                  <li className="flex items-center justify-between">
                    <span>Clients & contacts</span>
	                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-xs font-medium text-blue-700">
                      CRM
	                    </span>
	                  </li>
	                  <li className="flex items-center justify-between">
                    <span>Invoices & quotes</span>
	                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-xs font-medium text-emerald-700">
                      Billing
	                    </span>
	                  </li>
	                  <li className="flex items-center justify-between">
                    <span>Expenses & cash flow</span>
	                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-xs font-medium text-amber-700">
                      Finance
	                    </span>
	                  </li>
	                </ul>
	              </div>
	            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">Tech Used</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Technologies powering the demo
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Frontend</h3>
              <div className="flex flex-wrap gap-2">
                {["React 19", "Vite", "Tailwind", "React Query", "RHF + Zod", "Recharts", "React PDF"].map((item) => (
                  <span key={item} className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-700">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Backend</h3>
              <div className="flex flex-wrap gap-2">
                {["Node 24", "Express", "Serverless", "JWT Auth", "Mongoose"].map((item) => (
                  <span key={item} className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-700">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Infrastructure</h3>
              <div className="flex flex-wrap gap-2">
                {["AWS Lambda", "API Gateway", "MongoDB Atlas"].map((item) => (
                  <span key={item} className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-700">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Tooling</h3>
              <div className="flex flex-wrap gap-2">
                {["Turborepo", "TypeScript", "ESLint", "Vitest", "Jest"].map((item) => (
                  <span key={item} className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-700">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

	      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-600 rounded-3xl p-12 text-center text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <h2 className="text-3xl font-extrabold mb-4 relative z-10">Explore the technical demo</h2>
	            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto relative z-10">
              This is a showcase application highlighting architecture and implementation decisions across the stack.
	            </p>
            <Link to="/login" className="relative z-10 inline-block bg-white text-blue-600 font-bold py-4 px-10 rounded-lg shadow-lg hover:bg-gray-50 transition-colors transform hover:-translate-y-1">
              View Demo
	            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
