import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Calendar,
  Scale,
  Search,
  Filter,
  Clock,
  X,
  Check,
  FileText,
  Bookmark,
  CalendarDays,
  BadgeAlert,
  BadgeCheck,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export default function HireLawyer() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");

  // Modal / Booking State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [caseDescription, setCaseDescription] = useState("");
  const [attachDocument, setAttachDocument] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(null);

  // Persistence State
  const [activeBookings, setActiveBookings] = useState([]);

  // Load existing bookings from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("nyayavanni_consultations");
      if (stored) setActiveBookings(JSON.parse(stored));
    } catch (e) {
      console.error("Failed to load consultations", e);
    }
  }, []);

  // Mock Data for Lawyers (BCI Compliant - No Ratings)
  const mockLawyers = useMemo(
    () => [
      {
        id: 1,
        name: "Adv. Rahul Sharma",
        specialty: "Real Estate & Property",
        experience: "15 Years",
        location: "New Delhi, Delhi",
        fee: "₹2,000/Consultation",
        image:
          "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256&h=256",
      },
      {
        id: 2,
        name: "Adv. Priya Desai",
        specialty: "Family Law & Divorce",
        experience: "12 Years",
        location: "Mumbai, Maharashtra",
        fee: "₹2,500/Consultation",
        image:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256&h=256",
      },
      {
        id: 3,
        name: "Adv. Vikram Singh",
        specialty: "Corporate & Business",
        experience: "20 Years",
        location: "Bengaluru, Karnataka",
        fee: "₹5,000/Consultation",
        image:
          "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=256&h=256",
      },
      {
        id: 4,
        name: "Adv. Neha Gupta",
        specialty: "Criminal Defense",
        experience: "8 Years",
        location: "Pune, Maharashtra",
        fee: "₹1,500/Consultation",
        image:
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=256&h=256",
      },
      {
        id: 5,
        name: "Adv. Anil Kumar",
        specialty: "Civil Litigation",
        experience: "18 Years",
        location: "Chennai, Tamil Nadu",
        fee: "₹3,000/Consultation",
        image:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=256&h=256",
      },
      {
        id: 6,
        name: "Adv. Meera Reddy",
        specialty: "Intellectual Property",
        experience: "10 Years",
        location: "Hyderabad, Telangana",
        fee: "₹4,000/Consultation",
        image:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256&h=256",
      },
    ],
    []
  );

  const categories = useMemo(
    () => [
      "All",
      "Real Estate & Property",
      "Family Law & Divorce",
      "Corporate & Business",
      "Criminal Defense",
      "Civil Litigation",
      "Intellectual Property",
    ],
    []
  );

  // Helper: next 7 days
  const datesList = useMemo(() => {
    const dates = [];
    const locale = "en-US";
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push({
        fullDate: d.toISOString().split("T")[0],
        dayName: d.toLocaleDateString(locale, { weekday: "short" }),
        dayNum: d.getDate(),
        month: d.toLocaleDateString(locale, { month: "short" }),
      });
    }
    return dates;
  }, []);

  const timeSlots = useMemo(
    () => ["09:30 AM", "11:00 AM", "01:30 PM", "03:00 PM", "04:30 PM", "06:00 PM"],
    []
  );

  // Filter logic
  const filteredLawyers = useMemo(() => {
    return mockLawyers.filter((lawyer) => {
      const s = searchTerm.toLowerCase();
      const matchesSearch =
        lawyer.name.toLowerCase().includes(s) ||
        lawyer.specialty.toLowerCase().includes(s) ||
        lawyer.location.toLowerCase().includes(s);
      const matchesFilter = filterType === "All" || lawyer.specialty === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [mockLawyers, searchTerm, filterType]);

  const handleOpenBooking = (lawyer) => {
    setSelectedLawyer(lawyer);
    setSelectedDate(datesList[0]?.fullDate || "");
    setSelectedTime(timeSlots[0] || "");
    setCaseDescription("");
    setAttachDocument(false);
    setBookingComplete(false);
    setCurrentTicket(null);
    setIsModalOpen(true);
  };

  const handleConfirmBooking = (e) => {
    e.preventDefault();
    if (!selectedLawyer || !selectedDate || !selectedTime) return;

    const randomId = Math.floor(1000 + Math.random() * 9000);
    const meetingCode = `NV-${randomId}-${selectedLawyer.name
      .split(" ")
      .pop()
      .toUpperCase()}`;

    const formattedDate = new Date(selectedDate).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const newBooking = {
      id: Date.now(),
      meetingCode,
      lawyer: selectedLawyer,
      date: formattedDate,
      rawDate: selectedDate,
      time: selectedTime,
      description: caseDescription,
      attachedContext: attachDocument ? "NyayaVanni_Extracted_Context.pdf" : null,
      bookedAt: new Date().toLocaleDateString(),
    };

    const updatedBookings = [newBooking, ...activeBookings];
    setActiveBookings(updatedBookings);
    localStorage.setItem("nyayavanni_consultations", JSON.stringify(updatedBookings));

    setCurrentTicket(newBooking);
    setBookingComplete(true);
  };

  const handleCancelBooking = (bookingId) => {
    if (window.confirm("Are you sure you want to cancel this consultation booking?")) {
      const next = activeBookings.filter((b) => b.id !== bookingId);
      setActiveBookings(next);
      localStorage.setItem("nyayavanni_consultations", JSON.stringify(next));
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900 text-slate-100 pb-16">
      {/* Background gradients (match LandingPage) */}
      <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] bg-nyaya-500/25 rounded-full blur-[140px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-12%] right-[-12%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[160px] mix-blend-screen pointer-events-none" />

      {/* Navbar */}
      <nav className="sticky top-0 z-30 border-b border-white/10 bg-slate-900/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-slate-200" />
            </button>

            <div
              className="flex items-center gap-2 text-xl font-bold tracking-tight text-white cursor-pointer"
              onClick={() => navigate("/")}
            >
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-nyaya-500/15 border border-nyaya-500/25">
                <Scale className="text-nyaya-400 w-5 h-5" />
              </span>
              <span>Nyaya<span className="text-nyaya-400">Vanni</span></span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-200 text-sm">
            {t("nav.directory")}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-10 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-block mb-5 px-4 py-1.5 rounded-full bg-nyaya-500/10 border border-nyaya-500/20 text-nyaya-300 font-medium text-sm">
            Legal Experts Directory
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            {t("lawyers.title")}
          </h1>

          <p className="mt-4 text-base md:text-lg text-slate-300">
            {t("lawyers.disclaimer")}
          </p>
        </div>

        {/* Active Consultations */}
        {activeBookings.length > 0 && (
          <div className="mt-10 mb-10 rounded-[2rem] border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-nyaya-300" />
                <h2 className="text-lg font-bold text-white">Your Active Consultations</h2>
              </div>
              <span className="bg-white/5 border border-white/10 text-slate-200 text-xs font-semibold px-3 py-1 rounded-full">
                {activeBookings.length} Scheduled
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="group rounded-2xl border border-white/10 bg-slate-950/30 hover:bg-slate-950/45 p-4 flex items-center gap-4 transition"
                >
                  <img
                    src={booking.lawyer.image}
                    alt={booking.lawyer.name}
                    className="w-12 h-12 rounded-full object-cover border border-white/10"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white truncate">{booking.lawyer.name}</h4>
                    <p className="text-xs text-nyaya-300 font-semibold truncate">
                      {booking.lawyer.specialty}
                    </p>

                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-300 font-semibold">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                        {booking.date.split(",")[1] || booking.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {booking.time}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCancelBooking(booking.id)}
                    className="text-xs font-semibold px-3 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-rose-500/15 hover:border-rose-500/30 text-rose-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search + Filters */}
        <div className="mt-10 mb-10">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 backdrop-blur-xl p-5 md:p-6 shadow-[0_0_40px_rgba(37,99,235,0.08)]">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-slate-400" />
                </div>

                {searchTerm.length > 0 && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute inset-y-0 right-3 my-auto h-9 px-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition text-slate-200 text-sm"
                  >
                    Clear
                  </button>
                )}

                <input
                  type="text"
                  placeholder={t("lawyers.search")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-20 py-4 rounded-2xl bg-slate-950/40 border border-white/10
                             text-white placeholder:text-slate-500
                             focus:outline-none focus:ring-2 focus:ring-nyaya-500/70 focus:border-nyaya-500/50
                             transition"
                />
              </div>

              {/* Filter */}
              <div className="relative md:w-72">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Filter className="w-5 h-5 text-slate-400" />
                </div>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full pl-12 pr-10 py-4 rounded-2xl bg-slate-950/40 border border-white/10
                             text-white focus:outline-none focus:ring-2 focus:ring-nyaya-500/70 focus:border-nyaya-500/50
                             transition cursor-pointer appearance-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-slate-900">
                      {cat}
                    </option>
                  ))}
                </select>

                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                  ▾
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-400">
              <p>
                Showing{" "}
                <span className="text-slate-200 font-semibold">{filteredLawyers.length}</span>{" "}
                result(s)
              </p>
              <p className="hidden sm:block">
                Tip: Search by <span className="text-slate-200">name</span>,{" "}
                <span className="text-slate-200">specialty</span>, or{" "}
                <span className="text-slate-200">location</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Grid */}
        {filteredLawyers.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 backdrop-blur-xl p-10 text-center">
            <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white">No lawyers found</h3>
            <p className="text-slate-400 mt-2">Try adjusting your search or filters.</p>
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterType("All");
              }}
              className="mt-6 inline-flex items-center justify-center px-6 py-3 rounded-full bg-white/10 border border-white/10 hover:bg-white/15 transition text-white font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredLawyers.map((lawyer) => (
              <div
                key={lawyer.id}
                className="group relative rounded-[2rem] border border-white/10 bg-slate-900/65 backdrop-blur-xl p-6
                           shadow-[0_0_30px_rgba(0,0,0,0.25)]
                           transition-all duration-500
                           hover:-translate-y-2 hover:border-nyaya-500/40 hover:shadow-[0_0_45px_rgba(37,99,235,0.22)]"
              >
                {/* glow blobs */}
                <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 bg-nyaya-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 bg-blue-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="flex items-start gap-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 ring-2 ring-white/10 group-hover:ring-nyaya-500/40 transition">
                    <img src={lawyer.image} alt={lawyer.name} className="w-full h-full object-cover" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-white truncate group-hover:text-nyaya-300 transition-colors">
                      {lawyer.name}
                    </h3>
                    <p className="text-sm font-medium text-nyaya-300/90">{lawyer.specialty}</p>
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{lawyer.location}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <span>{lawyer.experience} Experience</span>
                  </div>

                  <div className="pt-3 mt-3 border-t border-white/10 text-slate-100 font-semibold">
                    {lawyer.fee}
                  </div>
                </div>

                <button
                  onClick={() => handleOpenBooking(lawyer)}
                  className="mt-6 w-full rounded-2xl py-3.5 px-4 font-semibold text-white
                             bg-gradient-to-r from-nyaya-500 to-blue-600
                             shadow-[0_0_25px_rgba(37,99,235,0.22)]
                             transition-all duration-300
                             hover:scale-[1.02] active:scale-[0.99]
                             flex items-center justify-center gap-2"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4" /> {t("lawyers.book")}
                  </span>
                </button>

                <p className="mt-3 text-xs text-slate-500">Informational directory only (BCI compliant).</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {isModalOpen && selectedLawyer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
          />

          <div className="relative w-full max-w-xl bg-white/95 border border-white/20 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden transition-all transform scale-100 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Scale className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Consultation Scheduler</h3>
                  <p className="text-xs text-slate-500 font-semibold">NyayaVanni Instant Match</p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {!bookingComplete ? (
                <form onSubmit={handleConfirmBooking} className="space-y-6">
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex gap-4 items-center">
                    <img
                      src={selectedLawyer.image}
                      alt={selectedLawyer.name}
                      className="w-12 h-12 rounded-full object-cover border"
                    />
                    <div>
                      <h4 className="font-bold text-slate-800">{selectedLawyer.name}</h4>
                      <p className="text-xs font-semibold text-blue-600">{selectedLawyer.specialty}</p>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">{selectedLawyer.fee}</p>
                    </div>
                  </div>

                  {/* Date selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Select Date Slot
                    </label>
                    <div className="flex gap-2.5 overflow-x-auto pb-2">
                      {datesList.map((d) => {
                        const isSelected = selectedDate === d.fullDate;
                        return (
                          <button
                            key={d.fullDate}
                            type="button"
                            onClick={() => setSelectedDate(d.fullDate)}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border shrink-0 w-16 transition-all ${
                              isSelected
                                ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10"
                                : "bg-white border-slate-200 hover:border-slate-300 text-slate-600"
                            }`}
                          >
                            <span className="text-[10px] uppercase font-bold tracking-wider">{d.dayName}</span>
                            <span className="text-lg font-extrabold my-0.5 leading-none">{d.dayNum}</span>
                            <span className="text-[9px] uppercase font-semibold">{d.month}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Select Available Time
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map((time) => {
                        const isSelected = selectedTime === time;
                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setSelectedTime(time)}
                            className={`py-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                              isSelected
                                ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10"
                                : "bg-white border-slate-200 hover:border-slate-300 text-slate-600"
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Attach context */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Legal Context
                    </label>
                    <div
                      onClick={() => setAttachDocument(!attachDocument)}
                      className={`p-3.5 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                        attachDocument ? "bg-blue-50/50 border-blue-200 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div
                        className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                          attachDocument ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white"
                        }`}
                      >
                        {attachDocument && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <FileText className={`w-4 h-4 ${attachDocument ? "text-blue-600" : "text-slate-400"}`} />
                          <h5 className="text-xs font-bold text-slate-800">Attach Document Analysis</h5>
                        </div>
                        <p className="text-[11px] text-slate-500 font-semibold mt-1">
                          Share your active analyzed legal document automatically with {selectedLawyer.name} for instant briefing.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Case summary */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Case Summary or Questions
                    </label>
                    <textarea
                      placeholder="Briefly describe your case or outline the questions you want to ask..."
                      value={caseDescription}
                      onChange={(e) => setCaseDescription(e.target.value)}
                      rows={3}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-xs font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    Confirm Consultation Booking
                  </button>
                </form>
              ) : (
                <div className="space-y-6 flex flex-col items-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 animate-pulse">
                    <BadgeCheck className="w-8 h-8" />
                  </div>

                  <div className="text-center">
                    <h3 className="text-xl font-bold text-slate-900">Appointment Confirmed!</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      Your instant match ticket has been generated below.
                    </p>
                  </div>

                  <div className="w-full max-w-sm bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl shadow-xl overflow-hidden relative border border-slate-800">
                    <div className="absolute w-4 h-4 bg-white/95 rounded-full -left-2 top-1/2 -translate-y-1/2 border-r border-slate-800" />
                    <div className="absolute w-4 h-4 bg-white/95 rounded-full -right-2 top-1/2 -translate-y-1/2 border-l border-slate-800" />

                    <div className="p-5 border-b border-dashed border-slate-800 pb-6 relative">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] tracking-widest font-black uppercase text-blue-400">
                          NYAYAVANNI TICKET
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          {currentTicket?.meetingCode}
                        </span>
                      </div>

                      <div className="flex gap-4 items-center mb-5">
                        <img
                          src={currentTicket?.lawyer?.image}
                          alt={currentTicket?.lawyer?.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-blue-500/20"
                        />
                        <div>
                          <h4 className="font-extrabold text-sm">{currentTicket?.lawyer?.name}</h4>
                          <p className="text-[11px] text-blue-400 font-bold uppercase">
                            {currentTicket?.lawyer?.specialty}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Date</span>
                          <span className="font-semibold text-slate-200">
                            {currentTicket?.date?.split(",")[1] || currentTicket?.date}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Time Slot</span>
                          <span className="font-semibold text-slate-200">{currentTicket?.time}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-6 bg-slate-950/70">
                      <div className="flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-slate-500 font-bold block uppercase">
                            Legal Briefing
                          </span>
                          <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                            {currentTicket?.attachedContext ? (
                              <>
                                <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Context Attached
                              </>
                            ) : (
                              <>
                                <BadgeAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" /> No Context
                              </>
                            )}
                          </span>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <div className="flex gap-0.5">
                            {[1, 3, 2, 4, 1, 3, 1, 2, 4, 2, 3, 1, 4].map((w, idx) => (
                              <div key={idx} className="bg-slate-400" style={{ width: `${w}px`, height: "24px" }} />
                            ))}
                          </div>
                          <span className="text-[8px] font-mono text-slate-500">MEMBER SLOT</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 w-full max-w-sm">
                    <button
                      onClick={() => alert("Adding to Google Calendar... Done!")}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5"
                    >
                      <CalendarDays className="w-4 h-4 text-slate-500" /> Add to Calendar
                    </button>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 bg-slate-900 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-all text-xs"
                    >
                      Dismiss Ticket
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
