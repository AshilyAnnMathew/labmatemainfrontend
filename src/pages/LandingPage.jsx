import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Beaker,
  Users,
  FileText,
  BarChart3,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Shield,
  Zap,
  Heart,
  Clock,
  Award,
  CheckCircle2,
  Brain,
  Microscope,
  Stethoscope,
  Search,
  Download,
  Calendar,
  Home,
  AlertCircle
} from 'lucide-react'

// Import assets
import heroImg from '../assets/images/hero.png'
import featuresImg from '../assets/images/features.png'
import staffImg from '../assets/images/staff.png'

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      {/* Top Header Bar - Clinical Standard */}
      <div className="hidden lg:block bg-blue-900 py-3 text-white border-b border-blue-800">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-[12px] font-black uppercase tracking-widest">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Phone className="h-3.5 w-3.5 text-blue-300" />
              <span>Customer Care: +91 9495456894</span>
            </div>
            <div className="flex items-center space-x-2 border-l border-blue-700 pl-8">
              <MapPin className="h-3.5 w-3.5 text-blue-300" />
              <span>Network of 30+ Certified Labs</span>
            </div>
          </div>
          <div className="flex items-center space-x-8">
            <a href="#reports" className="hover:text-blue-300 transition-colors flex items-center">
              <Download className="h-3 w-3 mr-1.5" /> Download Reports
            </a>
            {/* <a href="#partner" className="hover:text-blue-300 transition-colors">Partner With Us</a> */}
            <a href="#contact" className="hover:text-blue-300 transition-colors">Support</a>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-100">
                <Microscope className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="text-2xl font-black text-gray-900 tracking-tighter uppercase">LABMATE <span className="text-blue-600">360</span></span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Smart Diagnostics</span>
              </div>
            </motion.div>

            <div className="hidden lg:flex items-center space-x-10">
              {['Home', 'Lab Tests', 'Health Packages', 'Our Network', 'About Us'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
                  className="text-[13px] font-black text-gray-700 hover:text-blue-600 transition-colors uppercase tracking-tight"
                >
                  {item}
                </a>
              ))}
              <div className="h-6 w-px bg-gray-200"></div>
              <Link
                to="/login"
                className="bg-blue-600 text-white px-8 py-3.5 rounded-full font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95 flex items-center text-[12px] uppercase tracking-widest"
              >
                <Users className="h-4 w-4 mr-2" />
                Patient Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - The "Real Lab" Look */}
      <header className="relative bg-white overflow-hidden border-b border-gray-100">
        <div className="max-w-[1600px] mx-auto grid lg:grid-cols-2 min-h-[600px] items-center gap-12">
          <div className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg mb-8 border border-blue-100">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-[11px] font-black text-blue-800 uppercase tracking-[0.2em]">NABL Accredited & ISO Certified</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-gray-900 leading-[1.05] mb-8">
                Excellence in <br />
                <span className="text-blue-600 underline decoration-blue-100 decoration-8 underline-offset-4">Diagnostics.</span>
              </h1>
              <p className="text-xl text-gray-600 mb-12 leading-relaxed max-w-xl font-medium">
                Accurate results, compassionate care, and advanced clinical laboratory services
                available at your convenience. Trusted by over 1 Million patients.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-8">
                <Link
                  to="/signup"
                  className="bg-blue-600 text-white px-12 py-5 rounded-2xl text-[16px] font-black hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 flex items-center justify-center group uppercase tracking-widest"
                >
                  Book a Test
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="bg-white text-gray-900 border-2 border-gray-200 px-12 py-5 rounded-2xl text-[16px] font-black hover:bg-gray-50 hover:border-blue-400 transition-all flex items-center justify-center uppercase tracking-widest">
                  View Packages
                </button>
              </div>

              <div className="mt-16 flex items-center space-x-12">
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-gray-900">1.2M+</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reports Delivered</span>
                </div>
                <div className="h-10 w-px bg-gray-200"></div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-gray-900">500+</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Specialists</span>
                </div>
                <div className="h-10 w-px bg-gray-200"></div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-gray-900">99.9%</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Accuracy Rate</span>
                </div>
              </div>
            </motion.div>
          </div>
          <div className="relative h-full lg:min-h-[700px] overflow-hidden">
            <motion.div
              className="absolute inset-0 z-0"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5 }}
            >
              <img
                src={heroImg}
                alt="Clinical Laboratory Interior"
                className="w-full h-full object-cover grayscale-[20%] brightness-95"
              />
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent"></div>
              <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-white to-transparent hidden lg:block"></div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Quick Access Bar - Realistic Healthcare UX */}
      <div className="max-w-[1600px] mx-auto px-4 -mt-16 relative z-20">
        <div className="bg-white rounded-[2rem] shadow-3xl grid md:grid-cols-4 border border-gray-100 divide-x divide-gray-50 overflow-hidden">
          {[
            { icon: <Home className="h-7 w-7 text-blue-600" />, label: "Sample Collection", desc: "Met us on laboratory" },
            { icon: <Search className="h-7 w-7 text-teal-600" />, label: "Find a Lab", desc: "Locate centers" },
            { icon: <Download className="h-7 w-7 text-blue-800" />, label: "Reports", desc: "Fast & Secure" },
            { icon: <Calendar className="h-7 w-7 text-orange-600" />, label: "Health Plans", desc: "Wellness checkups" }
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ backgroundColor: '#f9fafb' }}
              className="p-10 flex flex-col items-center text-center cursor-pointer transition-colors"
            >
              <div className="bg-gray-50 p-5 rounded-2xl mb-6 shadow-inner">
                {item.icon}
              </div>
              <h4 className="font-black text-gray-900 text-[14px] uppercase tracking-[0.1em] mb-2">{item.label}</h4>
              <p className="text-gray-400 text-[12px] font-bold uppercase tracking-widest">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Trusted Services Section */}
      <section id="services" className="py-32 bg-gray-50/30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-end mb-24 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-blue-600 font-black uppercase tracking-[0.3em] text-[12px] mb-6">Expert Healthcare Services</h2>
              <h3 className="text-4xl lg:text-6xl font-black text-gray-900 leading-[1.1]">Clinical Excellence <br /> In Every Test.</h3>
            </div>
            <p className="text-gray-500 max-w-sm font-bold text-sm uppercase tracking-wider leading-relaxed lg:text-right">
              We provide the most comprehensive range of diagnostic services across hematology, microbiology, and molecular pathology.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              { title: "Specialty Diagnostics", desc: "Highly specialized clinical tests including genomics, oncology, and rare disease panels." },
              { title: "Routine Pathology", desc: "Regular blood tests, urine analysis, and hormonal profiles with 24-hour turnaround." },
              { title: "Imaging Services", desc: "State-of-the-art MRI, CT Scans, and Ultrasound services at select health hubs." }
            ].map((service, i) => (
              <div key={i} className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-2xl hover:border-blue-100 transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-full -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
                <div className="bg-blue-600 text-white h-12 w-12 rounded-xl flex items-center justify-center mb-10 shadow-lg shadow-blue-100">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-tight">{service.title}</h4>
                <p className="text-gray-500 font-bold leading-relaxed mb-10 text-[14px] uppercase tracking-wider">{service.desc}</p>
                <div className="inline-flex items-center text-blue-600 font-black text-[12px] uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
                  Learn More <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Realistic Quality Section */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-20 items-center">
            <div className="lg:col-span-5 relative">
              <div className="rounded-[4rem] overflow-hidden shadow-4xl aspect-[4/5]">
                <img src={staffImg} alt="Doctor Consult" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-10 -right-10 bg-white p-12 rounded-[3rem] shadow-3xl border border-gray-100 max-w-[350px]">
                <div className="flex items-center space-x-1 mb-6">
                  {[1, 2, 3, 4, 5].map(s => <Award key={s} className="h-6 w-6 text-yellow-500 fill-yellow-500" />)}
                </div>
                <p className="text-gray-900 font-black text-2xl leading-[1.2] mb-6 underline decoration-blue-100 decoration-4">"International standards for accurate care."</p>
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-black">Dr</div>
                  <div>
                    <p className="font-black text-gray-900 uppercase text-[12px] tracking-widest">Dr. Sarah Thompson</p>
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest leading-none">Senior Pathologist</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 lg:pl-20">
              <h2 className="text-blue-600 font-black uppercase tracking-[0.4em] text-[12px] mb-8">Quality & Trust</h2>
              <h3 className="text-4xl lg:text-7xl font-black text-gray-900 mb-12 leading-[1] tracking-tighter">Your Health, <br /> Our Highest <br /> Priority.</h3>

              <div className="space-y-12">
                {[
                  { title: "NABL Accredited", desc: "Our laboratories are accredited by NABL, conforming to ISO 15189 standards for clinical safety." },
                  { title: "Fast Turnaround", desc: "State-of-the-art automated equipment ensures 95% of reports are delivered within 12 hours." },
                  { title: "Expert Consultations", desc: "Direct access to senior pathologists and specialists to discuss your reports in detail." }
                ].map((item, i) => (
                  <div key={i} className="flex items-start space-x-8">
                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-1">
                      <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-gray-900 mb-3 tracking-tight uppercase hover:text-blue-600 cursor-default transition-colors">{item.title}</h4>
                      <p className="text-gray-500 font-bold leading-relaxed text-[14px] uppercase tracking-wider">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrated Technology - Naturally presented */}
      <section className="py-32 bg-blue-950 text-white relative">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-lg mb-10 border border-white/10">
                <Brain className="h-4 w-4 text-blue-300" />
                <span className="text-[11px] font-black text-blue-100 uppercase tracking-widest">Next-Gen Laboratory Portal</span>
              </div>
              <h3 className="text-5xl lg:text-7xl font-black mb-10 leading-[1.05] tracking-tighter">Diagnostic <br /> Intelligence.</h3>
              <p className="text-xl text-blue-100/60 mb-16 font-medium leading-relaxed max-w-xl">
                We empower patients with smart health insights. Access clinical trends, predictive
                health monitoring, and instant vital checks through our secure digital portal.
              </p>

              <div className="flex items-center space-x-12 mb-16">
                <div>
                  <div className="text-5xl font-black mb-1">2M+</div>
                  <div className="text-blue-400 font-black text-[10px] uppercase tracking-[0.2em]">Samples Verified</div>
                </div>
                <div className="text-4xl text-blue-800">/</div>
                <div>
                  <div className="text-5xl font-black mb-1">99.5%</div>
                  <div className="text-blue-400 font-black text-[10px] uppercase tracking-[0.2em]">Precision Score</div>
                </div>
              </div>

              <Link
                to="/signup"
                className="bg-white text-blue-950 px-12 py-6 rounded-2xl font-black text-[16px] hover:bg-blue-50 transition-all flex items-center w-full lg:w-fit justify-center uppercase tracking-widest shadow-2xl shadow-blue-900/50"
              >
                Join Our Network <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
            <div className="relative group">
              <div className="rounded-[4rem] overflow-hidden border-[16px] border-white/5 shadow-4xl aspect-[4/5]">
                <img src={featuresImg} alt="Lab Testing" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
              </div>
              <div className="absolute -bottom-10 inset-x-0 flex justify-center">
                <div className="bg-white/10 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/20 text-center max-w-[350px]">
                  <p className="text-[11px] font-black text-blue-200 mb-2 uppercase tracking-[0.3em]">Smart Automation</p>
                  <p className="text-2xl font-black italic tracking-tighter">Clinical Excellence at Scale</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Call to Action */}
      <section className="py-32 bg-white">
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="bg-red-50 rounded-[4rem] p-12 lg:p-24 border border-red-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-100 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
            <div className="flex flex-col lg:flex-row items-center gap-16 relative z-10">
              <div className="h-32 w-32 bg-red-600 rounded-[2.5rem] flex items-center justify-center flex-shrink-0 animate-pulse-slow shadow-xl shadow-red-200">
                <AlertCircle className="h-16 w-16 text-white" />
              </div>
              <div className="flex-1 text-center lg:text-left">
                <h4 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6 tracking-tight">Need Emergency Home Collection?</h4>
                <p className="text-gray-500 font-black uppercase text-[12px] tracking-widest leading-loose">Reach our rapid response team 24/7. Sample collection within 60 mins for critical clinical diagnostics. Results on priority.</p>
              </div>
              <button className="bg-red-600 text-white px-12 py-7 rounded-2xl font-black text-xl hover:bg-red-700 transition-all shadow-2xl shadow-red-100 whitespace-nowrap uppercase tracking-widest group-hover:scale-105">
                Call 1-800-LAB-HLP
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Detailed Footer */}
      <footer id="contact" className="bg-gray-50 border-t border-gray-200 pt-32 pb-16 overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">+()          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-16 mb-24">
          <div className="col-span-2">
            <div className="flex items-center space-x-2 mb-10">
              <div className="p-1.5 bg-blue-600 rounded shadow-lg shadow-blue-100">
                <Microscope className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-black text-gray-900 tracking-tighter uppercase tracking-widest">LABMATE <span className="text-blue-600">360</span></span>
            </div>
            <p className="text-gray-500 font-black leading-relaxed mb-12 max-w-sm uppercase text-[11px] tracking-[0.1em]">
              Redefining clinical excellence through advanced diagnostics and empathetic patient care. India's trusted medical laboratory network.
            </p>
            <div className="flex space-x-6">
              {[Zap, Heart, Shield, Award].map((StaticIcon, i) => (
                <div key={i} className="h-12 w-12 bg-white rounded-xl shadow-sm flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all cursor-pointer text-blue-600 border border-gray-100">
                  <StaticIcon className="h-5 w-5" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-black text-gray-900 uppercase tracking-[0.2em] text-[10px] mb-10">Diagnostic Tests</h4>
            <ul className="space-y-5 font-black text-gray-400 text-[11px] uppercase tracking-widest">
              <li><a href="#" className="hover:text-blue-600">Full Body Profiles</a></li>
              <li><a href="#" className="hover:text-blue-600">Vitamin Panel</a></li>
              <li><a href="#" className="hover:text-blue-600">Diabetes Care</a></li>
              <li><a href="#" className="hover:text-blue-600">Cardiac Profile</a></li>
              <li><a href="#" className="hover:text-blue-600">Fever Profile</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-gray-900 uppercase tracking-[0.2em] text-[10px] mb-10">Patient Care</h4>
            <ul className="space-y-5 font-black text-gray-400 text-[11px] uppercase tracking-widest">
              <li><a href="#" className="hover:text-blue-600">Home Collection</a></li>
              <li><a href="#" className="hover:text-blue-600">Download Reports</a></li>
              <li><a href="#" className="hover:text-blue-600">Preparation Info</a></li>
              <li><a href="#" className="hover:text-blue-600">Lab Locations</a></li>
              <li><a href="#" className="hover:text-blue-600">Feedback</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-gray-900 uppercase tracking-[0.2em] text-[10px] mb-10">Corporate</h4>
            <ul className="space-y-5 font-black text-gray-400 text-[11px] uppercase tracking-widest">
              <li><a href="#" className="hover:text-blue-600">Quality Policy</a></li>
              <li><a href="#" className="hover:text-blue-600">NABL Info</a></li>
              <li><a href="#" className="hover:text-blue-600">Certifications</a></li>
              <li><a href="#" className="hover:text-blue-600">Media Center</a></li>
              <li><a href="#" className="hover:text-blue-600">Partner Portal</a></li>
            </ul>
          </div>
        </div>

          <div className="border-t border-gray-200 pt-16 flex flex-col md:flex-row justify-between items-center text-gray-400 font-black text-[10px] uppercase tracking-[0.2em]">
            <p>© 2024 LABMATE360 DIAGNOSTICS PVT LTD. ALL RIGHTS RESERVED.</p>
            <div className="flex items-center space-x-10 mt-8 md:mt-0">
              <span>CIN: U85110DL2024PTC123456</span>
              <span>ISO 9001:2015 CERTIFIED</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
