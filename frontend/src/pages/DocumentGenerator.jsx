import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Loader2, Scale, Sparkles } from "lucide-react";

const FIELD_CONFIG = [
  {
    name: "party_one_name",
    label: "Disclosing Party Name",
    placeholder: "e.g., ABC Technologies Pvt. Ltd.",
    type: "text",
    required: true,
  },
  {
    name: "party_two_name",
    label: "Receiving Party Name",
    placeholder: "e.g., John Doe",
    type: "text",
    required: true,
  },
  {
    name: "effective_date",
    label: "Effective Date",
    placeholder: "",
    type: "date",
    required: true,
  },
  {
    name: "consideration_amount",
    label: "Consideration Amount",
    placeholder: "e.g., INR 50,000",
    type: "text",
    required: true,
  },
  {
    name: "jurisdiction",
    label: "Jurisdiction",
    placeholder: "e.g., New Delhi, India",
    type: "text",
    required: true,
  },
];

const INITIAL_FORM = FIELD_CONFIG.reduce((acc, field) => {
  acc[field.name] = "";
  return acc;
}, {});

function getFilename(contentDispositionHeader) {
  if (!contentDispositionHeader) return "NDA_Document.pdf";
  const match = contentDispositionHeader.match(/filename="?([^"]+)"?/i);
  return match?.[1] || "NDA_Document.pdf";
}

export default function DocumentGenerator() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const isFormComplete = useMemo(() => {
    return FIELD_CONFIG.every((field) => formData[field.name].trim().length > 0);
  }, [formData]);

  const handleChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    setErrors((prev) => ({ ...prev, [fieldName]: "" }));
    setSubmitError("");
  };

  const validate = () => {
    const nextErrors = {};

    FIELD_CONFIG.forEach((field) => {
      const value = formData[field.name]?.trim();
      if (field.required && !value) {
        nextErrors[field.name] = `${field.label} is required.`;
      }
    });

    if (
      formData.party_one_name.trim() &&
      formData.party_two_name.trim() &&
      formData.party_one_name.trim().toLowerCase() === formData.party_two_name.trim().toLowerCase()
    ) {
      nextErrors.party_two_name = "Receiving Party must be different from Disclosing Party.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsGenerating(true);
    setSubmitError("");

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/generate-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.detail || "Failed to generate document.");
      }

      const pdfBlob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(pdfBlob);
      const filename = getFilename(response.headers.get("content-disposition"));

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      setSubmitError(error.message || "An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900 text-slate-100 pb-16">
      <div className="absolute top-[-8%] left-[-12%] w-[50%] h-[50%] bg-nyaya-500/20 rounded-full blur-[140px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[52%] h-[52%] bg-blue-600/20 rounded-full blur-[150px] mix-blend-screen pointer-events-none" />

      <nav className="sticky top-0 z-30 border-b border-white/10 bg-slate-900/60 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-slate-200" />
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-xl font-bold tracking-tight text-white"
            >
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-nyaya-500/15 border border-nyaya-500/25">
                <Scale className="text-nyaya-400 w-5 h-5" />
              </span>
              <span>
                Nyaya<span className="text-nyaya-400">Vanni</span>
              </span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-200 text-sm">
            <Sparkles className="w-4 h-4 text-nyaya-300" />
            NDA Generator
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-10">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full bg-nyaya-500/10 border border-nyaya-500/20 text-nyaya-300 font-medium text-sm">
            <FileText className="w-4 h-4" />
            Generate legally structured documents
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">NDA Document Generator</h1>
          <p className="mt-4 text-base md:text-lg text-slate-300">
            Fill in the details below to generate a professional NDA PDF instantly.
          </p>
        </div>

        <form
          onSubmit={handleGenerate}
          className="mt-10 rounded-[2rem] border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 md:p-8 shadow-[0_0_40px_rgba(37,99,235,0.08)]"
        >
          <div className="grid md:grid-cols-2 gap-5">
            {FIELD_CONFIG.map((field) => (
              <div key={field.name} className={field.name === "jurisdiction" ? "md:col-span-2" : ""}>
                <label htmlFor={field.name} className="block text-sm font-semibold text-slate-200 mb-2">
                  {field.label}
                </label>
                <input
                  id={field.name}
                  type={field.type}
                  value={formData[field.name]}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className={`w-full px-4 py-3 rounded-xl bg-slate-950/40 border text-white placeholder:text-slate-500
                    focus:outline-none focus:ring-2 transition
                    ${
                      errors[field.name]
                        ? "border-rose-500/60 focus:ring-rose-400/50"
                        : "border-white/10 focus:ring-nyaya-500/70 focus:border-nyaya-500/50"
                    }`}
                />
                {errors[field.name] && <p className="mt-1.5 text-xs text-rose-300">{errors[field.name]}</p>}
              </div>
            ))}
          </div>

          {submitError && (
            <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {submitError}
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-xs text-slate-400">
              Disclaimer: Generated by NyayaVanni for informational purposes only.
            </p>
            <button
              type="submit"
              disabled={isGenerating || !isFormComplete}
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 font-semibold text-white
                         bg-gradient-to-r from-nyaya-500 to-blue-600 shadow-[0_0_25px_rgba(37,99,235,0.22)]
                         transition-all duration-300 hover:scale-[1.02] active:scale-[0.99]
                         disabled:opacity-60 disabled:hover:scale-100"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                "Generate Document"
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
