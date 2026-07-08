import React from 'react';
import { WorkOrder, Product } from '../types';
import { History, FileText, Calendar, Package, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  workOrders: WorkOrder[];
  products: Product[];
}

export function SPKHistory({ workOrders, products }: Props) {
  if (workOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <History className="w-12 h-12 mb-4 text-slate-300" />
        <p className="text-lg font-medium text-slate-600">Belum ada Riwayat SPK</p>
        <p className="text-sm mt-1">SPK yang telah dialokasikan akan muncul di sini.</p>
      </div>
    );
  }

  const exportHistoryToExcel = () => {
    // Flatten SPK data to export to Excel
    const exportData: any[] = [];
    
    workOrders.forEach(spk => {
      // For each item in SPK
      spk.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        exportData.push({
          'No SPK': spk.spkNumber,
          'Tanggal': new Date(spk.date).toLocaleString('id-ID'),
          'Nama Produk': product?.name || 'Unknown',
          'Kuantitas': item.quantity,
          'Status': spk.status
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Riwayat_SPK');
    XLSX.writeFile(wb, `Riwayat_SPK_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <History className="w-5 h-5 text-slate-600" />
          Riwayat Surat Perintah Kerja (SPK)
        </h2>
        <button
          onClick={exportHistoryToExcel}
          className="flex items-center gap-2 font-medium py-2 px-4 rounded-lg transition-all bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-sm"
        >
          <Download className="w-4 h-4" />
          Export ke Excel
        </button>
      </div>

      <div className="grid gap-4">
        {workOrders.map((spk) => {
          return (
            <div key={spk.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-slate-300 transition-colors">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="inline-flex items-center gap-1.5 font-mono text-sm font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                      <FileText className="w-4 h-4" /> {spk.spkNumber}
                    </span>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                      Teralokasi
                    </span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="text-sm text-slate-500 flex items-center gap-1.5 mb-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(spk.date).toLocaleString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-slate-400" />
                  Daftar Produk Produksi
                </h4>
                <div className="flex flex-col gap-2">
                  {spk.items.map((item, idx) => {
                    const product = products.find(p => p.id === item.productId);
                    return (
                      <div key={idx} className="flex justify-between items-center text-sm bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg">
                        <span className="font-medium text-slate-800">{product?.name || 'Unknown Product'}</span>
                        <span className="font-semibold text-slate-900 bg-white px-2 py-1 rounded shadow-sm border border-slate-200">
                          {item.quantity} Unit
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Bahan Baku Teralokasi</h4>
                <div className="flex flex-wrap gap-2">
                  {spk.allocations.map((a, i) => (
                    <span key={i} className="inline-flex items-center text-xs font-medium text-slate-700 bg-white border border-slate-200 px-2.5 py-1.5 rounded shadow-sm">
                      <span className="text-slate-400 mr-2">ID:{a.materialId}</span>
                      {a.required} unit
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
