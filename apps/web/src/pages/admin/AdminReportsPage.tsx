import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const AdminReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<'sales' | 'menu' | 'tables'>('sales');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/reports/${reportType}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const exportCSV = () => {
    if (!data) return;
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (reportType === 'sales') {
      csvContent += 'Order Number,Table,Total Amount (INR),Tax (INR),Payment Status,Method,Dishes,Date\n';
      data.orders.forEach((o: any) => {
        csvContent += `"${o.orderNumber}",Table ${o.tableNumber},${o.totalAmount},${o.taxAmount},${o.paymentStatus},${o.paymentMethod},"${o.dishes}","${new Date(o.createdAt).toLocaleString()}"\n`;
      });
    } else if (reportType === 'menu') {
      csvContent += 'Dish Name,Category,Price (INR),Units Sold,Gross Revenue (INR)\n';
      data.forEach((m: any) => {
        csvContent += `"${m.name}","${m.category}",${m.price},${m.unitsSold},${m.grossRevenue}\n`;
      });
    } else if (reportType === 'tables') {
      csvContent += 'Table Number,Capacity,Status,Total Orders,Total Revenue (INR),Average Order Value (INR)\n';
      data.forEach((t: any) => {
        csvContent += `Table ${t.tableNumber},${t.capacity},${t.status},${t.totalOrders},${t.totalRevenue},${t.averageOrderValue.toFixed(2)}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Aurelian_${reportType.toUpperCase()}_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    if (!data) return;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Aurelian Restaurant — Executive Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Report Type: ${reportType.toUpperCase()} | Generated: ${new Date().toLocaleString()}`, 14, 28);

    if (reportType === 'sales') {
      doc.text(`Total Revenue: INR ${data.totalRevenue.toFixed(2)} | Total Orders: ${data.totalOrders} | Avg Ticket: INR ${data.averageTicket.toFixed(2)}`, 14, 36);

      const tableRows = data.orders.map((o: any) => [
        o.orderNumber,
        `Table ${o.tableNumber}`,
        `INR ${o.totalAmount.toFixed(2)}`,
        o.paymentStatus.toUpperCase(),
        o.dishes,
        new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ]);

      autoTable(doc, {
        startY: 42,
        head: [['Order #', 'Table', 'Amount', 'Payment', 'Items', 'Time']],
        body: tableRows,
      });
    } else if (reportType === 'menu') {
      const tableRows = data.map((m: any) => [
        m.name,
        m.category,
        `INR ${m.price.toFixed(2)}`,
        m.unitsSold,
        `INR ${m.grossRevenue.toFixed(2)}`,
      ]);

      autoTable(doc, {
        startY: 34,
        head: [['Dish Name', 'Category', 'Price', 'Sold', 'Gross Revenue']],
        body: tableRows,
      });
    } else if (reportType === 'tables') {
      const tableRows = data.map((t: any) => [
        `Table ${t.tableNumber}`,
        `${t.capacity} Guests`,
        t.status.toUpperCase(),
        t.totalOrders,
        `INR ${t.totalRevenue.toFixed(2)}`,
        `INR ${t.averageOrderValue.toFixed(2)}`,
      ]);

      autoTable(doc, {
        startY: 34,
        head: [['Table', 'Capacity', 'Status', 'Orders', 'Total Revenue', 'Avg Ticket']],
        body: tableRows,
      });
    }

    doc.save(`Aurelian_${reportType.toUpperCase()}_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#121414] text-[#e3e2e2] flex">
      <AdminSidebar />

      <div className="pl-64 flex-1 flex flex-col">
        <AdminHeader title="Executive Reports & Export Center" />

        <main className="pt-16 p-8 space-y-6 max-w-7xl w-full">
          {/* Header Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#4f4539]/20 pb-4">
            <div>
              <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#e3e2e2]">
                Audit & Performance Reports
              </h1>
              <p className="text-xs text-[#d2c4b4]/60 mt-0.5">
                Generate and export detailed historical sales, menu item margins, and table utilization metrics
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={exportCSV}
                className="px-4 py-2.5 rounded-xl bg-[#1f2020] border border-[#4f4539]/40 hover:border-[#edbf7b]/40 text-xs font-semibold uppercase tracking-wider text-[#d2c4b4] hover:text-[#e3e2e2] flex items-center gap-1.5 transition-colors shadow-md"
              >
                <span className="material-symbols-outlined text-[17px]">csv</span>
                <span>Export CSV / Excel</span>
              </button>

              <button
                onClick={exportPDF}
                className="px-4 py-2.5 rounded-xl bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-all"
              >
                <span className="material-symbols-outlined text-[17px]">picture_as_pdf</span>
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          {/* Report Type Selector Tabs */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 w-fit text-xs">
            <button
              onClick={() => setReportType('sales')}
              className={`px-4 py-2 rounded-xl font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                reportType === 'sales' ? 'bg-[#edbf7b] text-[#442b00] shadow-md' : 'text-[#d2c4b4] hover:text-[#e3e2e2]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              <span>Sales & Order Revenue</span>
            </button>

            <button
              onClick={() => setReportType('menu')}
              className={`px-4 py-2 rounded-xl font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                reportType === 'menu' ? 'bg-[#edbf7b] text-[#442b00] shadow-md' : 'text-[#d2c4b4] hover:text-[#e3e2e2]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">restaurant_menu</span>
              <span>Menu Velocity & Margins</span>
            </button>

            <button
              onClick={() => setReportType('tables')}
              className={`px-4 py-2 rounded-xl font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                reportType === 'tables' ? 'bg-[#edbf7b] text-[#442b00] shadow-md' : 'text-[#d2c4b4] hover:text-[#e3e2e2]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">table_restaurant</span>
              <span>Table Turns & Utilization</span>
            </button>
          </div>

          {/* Report Content Table */}
          {isLoading ? (
            <div className="py-20 text-center text-[#d2c4b4]/60">
              <div className="w-10 h-10 border-2 border-[#edbf7b] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold uppercase tracking-wider">Aggregating Report Data...</p>
            </div>
          ) : reportType === 'sales' && data ? (
            /* Sales Report */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[#d2c4b4]/60">Total Gross Revenue</span>
                  <p className="font-serif-heading text-2xl font-bold text-[#edbf7b]">
                    ₹{data.totalRevenue.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[#d2c4b4]/60">Total Completed Tickets</span>
                  <p className="font-serif-heading text-2xl font-bold text-[#e3e2e2]">{data.totalOrders}</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[#d2c4b4]/60">Average Ticket Size</span>
                  <p className="font-serif-heading text-2xl font-bold text-[#e3e2e2]">
                    ₹{data.averageTicket.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="bg-[#1f2020] rounded-2xl border border-[#4f4539]/20 overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#4f4539]/30 text-[10px] font-bold uppercase tracking-wider text-[#d2c4b4]/60 bg-[#121414]/40">
                      <th className="p-4">Order #</th>
                      <th className="p-4">Table</th>
                      <th className="p-4">Dishes Ordered</th>
                      <th className="p-4">Tax (5%)</th>
                      <th className="p-4">Total Amount</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#4f4539]/15 text-[#e3e2e2]">
                    {data.orders.map((o: any) => (
                      <tr key={o.id} className="hover:bg-[#121414]/50">
                        <td className="p-4 font-mono font-bold text-[#d2c4b4]">#{o.orderNumber}</td>
                        <td className="p-4 font-bold text-[#edbf7b]">Table {o.tableNumber}</td>
                        <td className="p-4 max-w-sm truncate text-[#e3e2e2]">{o.dishes}</td>
                        <td className="p-4 text-[#d2c4b4]/70">₹{o.taxAmount.toFixed(2)}</td>
                        <td className="p-4 font-serif-heading font-bold text-sm text-[#edbf7b]">
                          ₹{o.totalAmount.toFixed(2)}
                        </td>
                        <td className="p-4 uppercase font-bold text-[10px] text-emerald-400">
                          {o.paymentStatus} ({o.paymentMethod})
                        </td>
                        <td className="p-4 text-right text-[11px] text-[#d2c4b4]/60">
                          {new Date(o.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : reportType === 'menu' && Array.isArray(data) ? (
            /* Menu Performance Report */
            <div className="bg-[#1f2020] rounded-2xl border border-[#4f4539]/20 overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#4f4539]/30 text-[10px] font-bold uppercase tracking-wider text-[#d2c4b4]/60 bg-[#121414]/40">
                    <th className="p-4">Dish Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Unit Price</th>
                    <th className="p-4">Units Sold</th>
                    <th className="p-4">Gross Revenue</th>
                    <th className="p-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#4f4539]/15 text-[#e3e2e2]">
                  {data.map((m: any) => (
                    <tr key={m.id} className="hover:bg-[#121414]/50">
                      <td className="p-4 font-serif-heading font-semibold text-sm text-[#e3e2e2]">
                        {m.name}
                      </td>
                      <td className="p-4 text-[#d2c4b4]">{m.category}</td>
                      <td className="p-4 font-bold text-[#edbf7b]">₹{m.price.toFixed(2)}</td>
                      <td className="p-4 font-bold text-[#e3e2e2]">{m.unitsSold}</td>
                      <td className="p-4 font-serif-heading font-bold text-sm text-emerald-400">
                        ₹{m.grossRevenue.toFixed(2)}
                      </td>
                      <td className="p-4 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            m.isAvailable
                              ? 'bg-emerald-950/60 text-emerald-300'
                              : 'bg-rose-950/60 text-rose-300'
                          }`}
                        >
                          {m.isAvailable ? 'Available' : '86 Sold Out'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : reportType === 'tables' && Array.isArray(data) ? (
            /* Table Utilization Report */
            <div className="bg-[#1f2020] rounded-2xl border border-[#4f4539]/20 overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#4f4539]/30 text-[10px] font-bold uppercase tracking-wider text-[#d2c4b4]/60 bg-[#121414]/40">
                    <th className="p-4">Table Number</th>
                    <th className="p-4">Seating Capacity</th>
                    <th className="p-4">Current Status</th>
                    <th className="p-4">Total Orders Served</th>
                    <th className="p-4">Total Revenue Generated</th>
                    <th className="p-4 text-right">Average Ticket</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#4f4539]/15 text-[#e3e2e2]">
                  {data.map((t: any) => (
                    <tr key={t.tableNumber} className="hover:bg-[#121414]/50">
                      <td className="p-4 font-bold text-[#edbf7b]">Table {t.tableNumber}</td>
                      <td className="p-4 text-[#d2c4b4]">{t.capacity} Guests</td>
                      <td className="p-4 font-bold uppercase text-[10px] text-emerald-400">{t.status}</td>
                      <td className="p-4 font-bold text-[#e3e2e2]">{t.totalOrders}</td>
                      <td className="p-4 font-serif-heading font-bold text-sm text-[#edbf7b]">
                        ₹{t.totalRevenue.toFixed(2)}
                      </td>
                      <td className="p-4 text-right font-bold text-[#e3e2e2]">
                        ₹{t.averageOrderValue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
};
