import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  Users,
  Utensils,
  ShoppingBag,
  ChefHat,
  Truck,
  CreditCard,
  CheckCircle,
  Star,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function SystemFlowchart() {
  const { orders, kots, deliveries, reviews } = useRestaurant();

  const pipelineSteps = [
    { title: '1. Customer Browse', icon: Users, count: '124 Visited', color: 'border-amber-200 text-amber-700 bg-amber-50' },
    { title: '2. Select Food & Cart', icon: Utensils, count: '182 Carts', color: 'border-sky-200 text-sky-700 bg-sky-50' },
    { title: '3. Place Order', icon: ShoppingBag, count: `${orders.length} Active`, color: 'border-indigo-200 text-indigo-700 bg-indigo-50' },
    { title: '4. Kitchen Prep', icon: ChefHat, count: `${kots.length} KOTs`, color: 'border-purple-200 text-purple-700 bg-purple-50' },
    { title: '5. Serve / Delivery', icon: Truck, count: `${deliveries.length} Deliveries`, color: 'border-rose-200 text-rose-700 bg-rose-50' },
    { title: '6. Billing & Pay', icon: CreditCard, count: 'Rs 245.5K Paid', color: 'border-emerald-200 text-emerald-700 bg-emerald-50' },
    { title: '7. Review & Rating', icon: Star, count: `${reviews.length} Reviews`, color: 'border-amber-200 text-amber-700 bg-amber-50' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold uppercase mb-2">
            <Sparkles className="h-3.5 w-3.5" /> Complete End-to-End System Pipeline
          </div>
          <h2 className="text-xl font-extrabold text-gray-900">Interactive System Process Flowchart</h2>
          <p className="text-xs text-gray-500">Live operational lifecycle from Customer entry to Kitchen, POS billing & Review submission</p>
        </div>
      </div>

      {/* Process Pipeline Flow */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {pipelineSteps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={idx} className={`p-5 rounded-2xl border ${step.color} space-y-3 relative overflow-hidden shadow-sm`}>
              <div className="flex items-center justify-between">
                <Icon className="h-6 w-6" />
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-white shadow-sm">
                  {step.count}
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-gray-900">{step.title}</h4>
              <p className="text-[11px] text-gray-600 leading-snug">
                Step {idx + 1} in the master operational restaurant workflow.
              </p>
            </div>
          );
        })}
      </div>

      {/* Visual Flow Diagram Banner */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center space-y-4">
        <h3 className="text-base font-extrabold text-gray-900">Unified System Architecture Workflow</h3>
        
        <div className="flex items-center justify-between gap-2 overflow-x-auto py-6 px-4 bg-gray-50 rounded-xl border border-gray-200 text-xs font-bold text-gray-700">
          <span className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-green-700 shadow-sm">CUSTOMER</span>
          <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
          <span className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sky-700 shadow-sm">BROWSE MENU</span>
          <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
          <span className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-indigo-700 shadow-sm">ORDER TYPE</span>
          <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
          <span className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-purple-700 shadow-sm">KITCHEN KOT PREP</span>
          <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
          <span className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-rose-700 shadow-sm">SERVE / RIDER</span>
          <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
          <span className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-emerald-700 shadow-sm">POS BILL & PAY</span>
          <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
          <span className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-amber-700 shadow-sm">REVIEW & RATING</span>
        </div>
      </div>

    </div>
  );
}
