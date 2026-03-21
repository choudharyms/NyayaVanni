import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Briefcase, Calendar, Scale, Search, Filter } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function HireLawyer() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  // Mock Data for Lawyers
  const mockLawyers = [
    {
      id: 1,
      name: "Adv. Rahul Sharma",
      specialty: "Real Estate & Property",
      experience: "15 Years",
      rating: 4.8,
      reviews: 124,
      location: "New Delhi, Delhi",
      fee: "₹2,000/Consultation",
      image: "https://i.pravatar.cc/150?u=a042581f4e29026024d"
    },
    {
      id: 2,
      name: "Adv. Priya Desai",
      specialty: "Family Law & Divorce",
      experience: "12 Years",
      rating: 4.9,
      reviews: 210,
      location: "Mumbai, Maharashtra",
      fee: "₹2,500/Consultation",
      image: "https://i.pravatar.cc/150?u=a04258a2462d826712d"
    },
    {
      id: 3,
      name: "Adv. Vikram Singh",
      specialty: "Corporate & Business",
      experience: "20 Years",
      rating: 4.7,
      reviews: 89,
      location: "Bengaluru, Karnataka",
      fee: "₹5,000/Consultation",
      image: "https://i.pravatar.cc/150?u=a042581f4e29026704d"
    },
    {
      id: 4,
      name: "Adv. Neha Gupta",
      specialty: "Criminal Defense",
      experience: "8 Years",
      rating: 4.6,
      reviews: 67,
      location: "Pune, Maharashtra",
      fee: "₹1,500/Consultation",
      image: "https://i.pravatar.cc/150?u=a048581f4e29026701d"
    },
    {
      id: 5,
      name: "Adv. Anil Kumar",
      specialty: "Civil Litigation",
      experience: "18 Years",
      rating: 4.8,
      reviews: 156,
      location: "Chennai, Tamil Nadu",
      fee: "₹3,000/Consultation",
      image: "https://i.pravatar.cc/150?u=a04258114e29026702d"
    },
    {
      id: 6,
      name: "Adv. Meera Reddy",
      specialty: "Intellectual Property",
      experience: "10 Years",
      rating: 4.9,
      reviews: 92,
      location: "Hyderabad, Telangana",
      fee: "₹4,000/Consultation",
      image: "https://i.pravatar.cc/150?u=a04258114e29026302d"
    }
  ];

  const categories = ["All", "Real Estate & Property", "Family Law & Divorce", "Corporate & Business", "Criminal Defense", "Civil Litigation", "Intellectual Property"];

  const filteredLawyers = mockLawyers.filter(lawyer => {
    const matchesSearch = lawyer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lawyer.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lawyer.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'All' || lawyer.specialty === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleBookConsultancy = (lawyerName) => {
    alert(`Consultancy booking initiated with ${lawyerName}. This feature is coming soon!`);
  };

  return (
    <div className="min-h-screen bg-slate-50 relative pb-12">
      <nav className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-800 cursor-pointer" onClick={() => navigate('/')}>
              <Scale className="text-nyaya-500 w-6 h-6" /> NyayaVanni
            </div>
          </div>
          <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full hidden sm:block">
            {t("nav.directory")}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 mt-8">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">{t("lawyers.title")}</h1>
          <p className="text-lg text-slate-600">{t("lawyers.subtitle")}</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder={t("lawyers.search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-nyaya-500 focus:bg-white transition-colors"
            />
          </div>
          <div className="relative md:w-64">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-nyaya-500 focus:bg-white cursor-pointer transition-colors"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Lawyer Grid */}
        {filteredLawyers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700">No lawyers found</h3>
            <p className="text-slate-500 mt-2">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLawyers.map(lawyer => (
              <div key={lawyer.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all group">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-100 shrink-0">
                     <img src={lawyer.image} alt={lawyer.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-nyaya-600 transition-colors">{lawyer.name}</h3>
                    <p className="text-sm font-medium text-nyaya-600">{lawyer.specialty}</p>
                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="font-semibold text-slate-700">{lawyer.rating}</span>
                      <span>({lawyer.reviews} reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-6 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {lawyer.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    {lawyer.experience} Experience
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-slate-800 mt-2 pt-2 border-t">
                    {lawyer.fee}
                  </div>
                </div>

                <button 
                  onClick={() => handleBookConsultancy(lawyer.name)}
                  className="w-full bg-slate-900 hover:bg-nyaya-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" /> {t("lawyers.book")}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
