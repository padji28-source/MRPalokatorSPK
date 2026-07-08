import React, { useState, useMemo } from 'react';
import { Product, RawMaterial } from '../types';
import { Database, Layers, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  materials: RawMaterial[];
  products: Product[];
}

export function MasterData({ materials, products }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const [productSearchTerm, setProductSearchTerm] = useState('');

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => 
      m.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [materials, searchTerm]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase()));
  }, [products, productSearchTerm]);

  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
  const currentMaterials = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMaterials.slice(start, start + itemsPerPage);
  }, [filteredMaterials, currentPage]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Stok Bahan Baku */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-800">Master Stok Bahan Baku</h2>
            <span className="bg-slate-200 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {filteredMaterials.length}
            </span>
          </div>
          
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Cari ID atau Nama Bahan..." 
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">ID Bahan (Search Key)</th>
                <th className="px-6 py-3">Nama Bahan Baku</th>
                <th className="px-6 py-3 text-right">Stok Tersedia</th>
                <th className="px-6 py-3">Satuan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {currentMaterials.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3 font-mono text-xs text-slate-500">{m.id}</td>
                  <td className="px-6 py-3 font-medium text-slate-800">{m.name}</td>
                  <td className="px-6 py-3 text-right font-medium">
                    <span className={m.stock < 20 ? 'text-amber-600' : 'text-emerald-600'}>
                      {m.stock}
                    </span>
                  </td>
                  <td className="px-6 py-3">{m.unit}</td>
                </tr>
              ))}
              {currentMaterials.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Tidak ada bahan baku yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredMaterials.length)} dari {filteredMaterials.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bill of Materials (BOM) */}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-800">Bill of Materials (BOM) Produk</h2>
            <span className="bg-slate-200 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {filteredProducts.length}
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Cari Nama Produk..." 
              value={productSearchTerm}
              onChange={(e) => setProductSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        <div className="divide-y divide-slate-200 max-h-[800px] overflow-y-auto">
          {filteredProducts.map(product => (
            <div key={product.id} className="p-6">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
                    {product.id}
                  </span>
                  {product.name}
                </h3>
              </div>
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Komposisi per 1 Unit</h4>
                <ul className="space-y-2">
                  {product.bom.map((item, idx) => {
                    const mat = materials.find(m => m.id === item.materialId);
                    return (
                      <li key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-slate-700">{mat?.name}</span>
                        <span className="font-medium text-slate-900 border-b border-slate-200 border-dashed pb-0.5">
                          {item.quantity} {mat?.unit}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
