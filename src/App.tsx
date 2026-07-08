/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Factory, LayoutDashboard, Database, History } from 'lucide-react';
import { initialMaterials, initialProducts } from './data';
import { RawMaterial, Product, WorkOrder } from './types';
import { Dashboard } from './components/Dashboard';
import { MasterData } from './components/MasterData';
import { SPKHistory } from './components/SPKHistory';

export default function App() {
  const [materials, setMaterials] = useState<RawMaterial[]>(initialMaterials);
  const [products] = useState<Product[]>(initialProducts);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'master' | 'history'>('dashboard');

  const handleAllocate = (spkData: Omit<WorkOrder, 'id' | 'date'>) => {
    // Deduct stock from materials
    setMaterials(prev => prev.map(mat => {
      const allocation = spkData.allocations.find(a => a.materialId === mat.id);
      if (allocation) {
        return { ...mat, stock: mat.stock - allocation.required };
      }
      return mat;
    }));

    // Save Work Order
    const newWorkOrder: WorkOrder = {
      ...spkData,
      id: crypto.randomUUID(),
      date: new Date().toISOString()
    };
    
    setWorkOrders(prev => [newWorkOrder, ...prev]);
    setActiveTab('history');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <Factory className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">
              MRP <span className="font-medium text-slate-500">Alokator SPK</span>
            </h1>
          </div>
          <nav className="flex gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-white text-blue-700 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Buat SPK
            </button>
            <button
              onClick={() => setActiveTab('master')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'master' 
                  ? 'bg-white text-blue-700 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Database className="w-4 h-4" />
              Master Data
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'history' 
                  ? 'bg-white text-blue-700 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <History className="w-4 h-4" />
              Riwayat SPK
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard products={products} materials={materials} onAllocate={handleAllocate} />
        )}
        {activeTab === 'master' && (
          <MasterData products={products} materials={materials} />
        )}
        {activeTab === 'history' && (
          <SPKHistory workOrders={workOrders} products={products} />
        )}
      </main>
    </div>
  );
}
