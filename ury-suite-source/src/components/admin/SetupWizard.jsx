import React, { useState } from 'react';
import { Sparkles, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

export default function SetupWizard() {
  const { showToast } = useRestaurant();
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    'Business Information',
    'Restaurant / Branch',
    'Country & Currency',
    'Staff Users',
    'POS Setup',
    'Initial Menu Data',
    'Complete Setup'
  ];

  const handleNext = async () => {
    if (currentStep < 7) {
      setCurrentStep(prev => prev + 1);
    } else {
      try {
        setLoading(true);
        showToast('Restaurant Business Setup completed successfully!');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (e) {
        showToast('Failed to save setup', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in p-4">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 to-green-800 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold flex items-center gap-1.5 w-max mb-2">
            <Sparkles className="h-3.5 w-3.5" /> Restaurant Setup Wizard
          </span>
          <h2 className="text-2xl font-black">Onboarding & Branch Setup</h2>
          <p className="text-xs text-emerald-200 mt-1">First-Time Restaurant Configuration</p>
        </div>
        <div className="text-xs text-emerald-300 font-semibold bg-white/10 px-3 py-1.5 rounded-xl w-max">
          Step {currentStep} of 7 — {steps[currentStep - 1]}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
        {steps.map((label, idx) => {
          const stepNum = idx + 1;
          const isDone = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          return (
            <div key={idx} className="flex items-center gap-2 shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${
                isDone
                  ? 'bg-green-600 text-white border-green-600'
                  : isCurrent
                  ? 'bg-green-600 text-white border-green-600 shadow-md'
                  : 'bg-gray-100 text-gray-400 border-gray-200'
              }`}>
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : stepNum}
              </div>
              <span className={`text-xs font-semibold hidden md:inline ${isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900">Step 1: Business Information</h3>
            <div>
              <label className="text-xs font-bold text-gray-600">Restaurant Name</label>
              <input type="text" defaultValue="Al Khan Restaurant & Grill" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-semibold text-gray-900 mt-1 outline-none focus:border-green-600 focus:bg-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600">Company Registration #</label>
              <input type="text" defaultValue="REG-994821" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-semibold text-gray-900 mt-1 outline-none focus:border-green-600 focus:bg-white" />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900">Step 2: Restaurant / Branch Details</h3>
            <div>
              <label className="text-xs font-bold text-gray-600">Main Branch Name</label>
              <input type="text" defaultValue="Main Branch — Gulberg III" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-semibold text-gray-900 mt-1 outline-none focus:border-green-600 focus:bg-white" />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900">Step 3: Country & Currency Setup</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-600">Country</label>
                <input type="text" defaultValue="Pakistan" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-semibold text-gray-900 mt-1 outline-none focus:border-green-600 focus:bg-white" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">Currency Symbol</label>
                <input type="text" defaultValue="Rs (PKR)" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-semibold text-gray-900 mt-1 outline-none focus:border-green-600 focus:bg-white" />
              </div>
            </div>
          </div>
        )}

        {currentStep >= 4 && currentStep < 7 && (
          <div className="space-y-4 text-center py-6">
            <h3 className="text-base font-bold text-gray-900">{steps[currentStep - 1]}</h3>
            <p className="text-xs text-gray-500">Default options initialized from URY template settings.</p>
          </div>
        )}

        {currentStep === 7 && (
          <div className="text-center space-y-4 py-8">
            <div className="h-16 w-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Setup Complete!</h3>
            <p className="text-xs text-gray-500">Your restaurant is now ready to process orders and launch terminals.</p>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 border border-gray-200 disabled:opacity-30 text-xs font-bold text-gray-700 hover:bg-gray-200"
          >
            <ArrowLeft className="h-4 w-4" /> Previous
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs shadow-md transition"
          >
            {currentStep === 7 ? 'Finish Setup' : 'Next Step'} <ChevronRight className="h-4 w-4" />
          </button>
        </div>

      </div>

    </div>
  );
}
