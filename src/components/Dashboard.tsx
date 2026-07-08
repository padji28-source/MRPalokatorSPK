import React, { useState, useRef } from 'react';
import { Product, RawMaterial, WorkOrder, AllocationResult } from '../types';
import { AlertCircle, CheckCircle2, Package, ArrowRight, Save, Plus, Trash2, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  products: Product[];
  materials: RawMaterial[];
  onAllocate: (spk: Omit<WorkOrder, 'id' | 'date'>) => void;
}

export function Dashboard({ products, materials, onAllocate }: Props) {
  const [items, setItems] = useState<{id: string, productId: string, quantity: number | ''}[]>([
    { id: crypto.randomUUID(), productId: '', quantity: '' }
  ]);
  const [allocations, setAllocations] = useState<AllocationResult[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    setAllocations(null);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    setAllocations(null);
  };

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), productId: '', quantity: '' }]);
    setAllocations(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      
      const newItems: {id: string, productId: string, quantity: number}[] = [];
      const startIndex = lines[0].toLowerCase().includes('produk') ? 1 : 0;
      
      for (let i = startIndex; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length >= 2) {
          const productName = parts[0].trim();
          const qty = parseInt(parts[1].trim(), 10);
          
          const matchedProduct = products.find(p => p.name.toLowerCase() === productName.toLowerCase());
          if (matchedProduct && !isNaN(qty) && qty > 0) {
            newItems.push({ id: crypto.randomUUID(), productId: matchedProduct.id, quantity: qty });
          }
        }
      }
      
      if (newItems.length > 0) {
        setItems(prev => {
          const filtered = prev.filter(p => p.productId !== '' || p.quantity !== '');
          return [...filtered, ...newItems];
        });
        setAllocations(null);
      } else {
        alert('Tidak ada produk yang cocok ditemukan di CSV. Pastikan nama produk sama persis. Format: "Nama Produk,Qty"');
      }
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validItems = items.filter(item => item.productId && item.quantity && item.quantity > 0);
    if (validItems.length === 0) return;

    const materialReqs = new Map<string, number>();
    
    validItems.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        product.bom.forEach(bom => {
          const currentReq = materialReqs.get(bom.materialId) || 0;
          materialReqs.set(bom.materialId, currentReq + (bom.quantity * (item.quantity as number)));
        });
      }
    });

    const results: AllocationResult[] = Array.from(materialReqs.entries()).map(([materialId, required]) => {
      const mat = materials.find(m => m.id === materialId);
      const available = mat?.stock || 0;
      return {
        materialId,
        required,
        available,
        shortage: required > available ? required - available : 0
      };
    });
    
    setAllocations(results);
  };

  const hasShortage = allocations?.some(a => a.shortage > 0);

  const handleAllocate = () => {
    const validItems = items.filter(item => item.productId && item.quantity && item.quantity > 0) as {productId: string, quantity: number}[];
    if (validItems.length === 0 || !allocations || hasShortage) return;
    
    onAllocate({
      spkNumber: `SPK-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      items: validItems.map(item => ({ productId: item.productId, quantity: item.quantity })),
      status: 'ALLOCATED',
      allocations
    });
    setItems([{ id: crypto.randomUUID(), productId: '', quantity: '' }]);
    setAllocations(null);
  };

  const exportToExcel = () => {
    if (!allocations) return;
    
    const exportData = allocations.map(a => {
      const mat = materials.find(m => m.id === a.materialId);
      return {
        'ID Bahan': a.materialId,
        'Nama Bahan Baku': mat?.name || 'Unknown',
        'Dibutuhkan': a.required,
        'Stok Saat Ini': a.available,
        'Kekurangan': a.shortage,
        'Satuan': mat?.unit || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Alokasi_MRP');
    XLSX.writeFile(wb, `Alokasi_MRP_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Buat Surat Perintah Kerja (SPK) Baru
          </h2>
          <div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              ref={fileInputRef}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors border border-slate-200"
            >
              <Upload className="w-4 h-4" />
              Upload CSV
            </label>
          </div>
        </div>
        
        <form onSubmit={handleCalculate} className="space-y-4">
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end p-4 sm:p-0 bg-slate-50 sm:bg-transparent rounded-lg border sm:border-none border-slate-200">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-slate-600 mb-1 sm:hidden">Produk Target</label>
                  <select
                    value={item.productId}
                    onChange={(e) => updateItem(item.id, 'productId', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  >
                    <option value="" disabled>Pilih Produk...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-32">
                  <label className="block text-sm font-medium text-slate-600 mb-1 sm:hidden">Kuantitas</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Qty"
                    required
                  />
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors w-full sm:w-auto flex justify-center"
                    title="Hapus Produk"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-between pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Tambah Produk
            </button>
            <button
              type="submit"
              className="bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Kalkulasi Kebutuhan <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {allocations && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Hasil Alokasi Bahan Baku (MRP)
            </h2>
            {hasShortage ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm font-medium border border-red-200">
                <AlertCircle className="w-4 h-4" /> Stok Tidak Mencukupi
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" /> Stok Tersedia
              </span>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Bahan Baku</th>
                  <th className="px-4 py-3 text-right">Dibutuhkan</th>
                  <th className="px-4 py-3 text-right">Stok Saat Ini</th>
                  <th className="px-4 py-3 text-right">Kekurangan</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {allocations.map(a => {
                  const mat = materials.find(m => m.id === a.materialId);
                  return (
                    <tr key={a.materialId} className={a.shortage > 0 ? 'bg-red-50/50' : 'bg-white'}>
                      <td className="px-4 py-3 font-medium text-slate-800">{mat?.name}</td>
                      <td className="px-4 py-3 text-right">{a.required} {mat?.unit}</td>
                      <td className="px-4 py-3 text-right">{a.available} {mat?.unit}</td>
                      <td className={`px-4 py-3 text-right font-medium ${a.shortage > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                        {a.shortage > 0 ? `-${a.shortage}` : '0'} {mat?.unit}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {a.shortage > 0 ? (
                          <AlertCircle className="w-5 h-5 text-red-500 mx-auto" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-between items-center">
            <button
              type="button"
              onClick={exportToExcel}
              className="flex items-center gap-2 font-medium py-2.5 px-4 rounded-lg transition-all bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
            >
              <Download className="w-4 h-4" />
              Export ke Excel
            </button>
            <button
              onClick={handleAllocate}
              disabled={hasShortage}
              className={`flex items-center gap-2 font-medium py-2.5 px-6 rounded-lg transition-all ${
                hasShortage 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow'
              }`}
            >
              <Save className="w-4 h-4" />
              Proses Alokasi & Rilis SPK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
